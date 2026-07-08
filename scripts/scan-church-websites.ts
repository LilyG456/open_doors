/**
 * Visits each unmatched church's own website and looks for a denominational
 * affiliation signal (an "Affiliated with...", "Cooperating with...", etc.
 * phrase, or failing that, a bare mention of a denomination name) — see
 * lib/website-denomination-scan.ts for the actual matching logic. Every hit
 * becomes a PENDING DenominationSuggestion for a human to accept or reject
 * in the admin Verification Queue (/admin/verification-queue); nothing here
 * writes to Church.denominationId directly.
 *
 * This is a deterministic text scan, not an LLM call — confidence is either
 * 95 (explicit affiliation phrase nearby) or 70 (bare mention, no phrase).
 * A run that finds nothing for a church still records that (confidence
 * null, suggestedDenominationId null) so the queue shows "we checked and
 * found nothing" rather than silently skipping it.
 *
 * Usage: npx tsx scripts/scan-church-websites.ts [--dry-run] [--limit=25] [--slug=some-church]
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { extractPageText, extractRelevantLinks, scanTextForDenomination, type ScanCandidate } from "../lib/website-denomination-scan"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const limitArg = args.find((a) => a.startsWith("--limit="))
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 25
const slugArg = args.find((a) => a.startsWith("--slug="))
const SLUG = slugArg ? slugArg.split("=")[1] : null

const USER_AGENT = "OpenDoorsDenominationScanBot/1.0 (+https://github.com/; reviews denomination affiliation only)"
const FETCH_TIMEOUT_MS = 10_000

// Same "this is too generic to be an actionable suggestion" rule as the seed
// data's family placeholders — don't let the scanner "discover" that a
// church's site says the word "Baptist" and call that a specific finding.
const PLACEHOLDER_NAME_PATTERN = /\((?:denomination|jurisdiction) unspecified\)/i

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("html")) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function loadCandidates(): Promise<ScanCandidate[]> {
  const aliases = await prisma.denominationAlias.findMany({
    select: { alias: true, denomination: { select: { id: true, name: true } } },
  })
  return aliases
    .filter((a) => !PLACEHOLDER_NAME_PATTERN.test(a.denomination.name))
    .map((a) => ({ denominationId: a.denomination.id, denominationName: a.denomination.name, alias: a.alias }))
}

async function scanChurchWebsite(website: string, candidates: ScanCandidate[]) {
  const homepageHtml = await fetchText(website)
  if (homepageHtml === null) return { result: scanTextForDenomination("", []), checkedUrl: website, fetchFailed: true }

  const homepageResult = scanTextForDenomination(extractPageText(homepageHtml), candidates)
  if (homepageResult.matched) return { result: homepageResult, checkedUrl: website, fetchFailed: false }

  for (const link of extractRelevantLinks(homepageHtml, website)) {
    const html = await fetchText(link)
    if (html === null) continue
    const result = scanTextForDenomination(extractPageText(html), candidates)
    if (result.matched) return { result, checkedUrl: link, fetchFailed: false }
  }

  return { result: { matched: false } as const, checkedUrl: website, fetchFailed: false }
}

async function main() {
  const candidates = await loadCandidates()
  console.log(`Loaded ${candidates.length} aliases across ${new Set(candidates.map((c) => c.denominationId)).size} named denominations.`)

  const churches = SLUG
    ? await prisma.church.findMany({ where: { slug: SLUG }, select: { id: true, name: true, slug: true, website: true } })
    : await prisma.church.findMany({
        where: {
          denominationId: null,
          website: { not: null },
          suggestions: { none: { status: "PENDING" } },
        },
        select: { id: true, name: true, slug: true, website: true },
        take: LIMIT,
      })

  console.log(`Scanning ${churches.length} church website${churches.length === 1 ? "" : "s"}...`)

  let matched = 0
  let noSignal = 0
  let failed = 0

  for (const church of churches) {
    if (!church.website) continue

    const { result, checkedUrl, fetchFailed } = await scanChurchWebsite(church.website, candidates)

    if (fetchFailed) {
      failed++
      console.log(`  ✗ ${church.name} — couldn't fetch ${church.website}`)
      continue
    }

    if (result.matched) {
      matched++
      console.log(`  ✓ ${church.name} -> ${result.denominationName} (${result.confidence}%)`)
      if (!dryRun) {
        await prisma.denominationSuggestion.deleteMany({ where: { churchId: church.id, status: "PENDING" } })
        await prisma.denominationSuggestion.create({
          data: {
            churchId: church.id,
            suggestedDenominationId: result.denominationId,
            confidence: result.confidence,
            evidence: result.evidence,
            sourceUrl: checkedUrl,
          },
        })
      }
    } else {
      noSignal++
      console.log(`  · ${church.name} — no denominational signal found`)
      if (!dryRun) {
        await prisma.denominationSuggestion.deleteMany({ where: { churchId: church.id, status: "PENDING" } })
        await prisma.denominationSuggestion.create({
          data: {
            churchId: church.id,
            suggestedDenominationId: null,
            confidence: null,
            evidence: null,
            sourceUrl: checkedUrl,
          },
        })
      }
    }
  }

  console.log(`\nDone. Matched: ${matched}, no signal: ${noSignal}, fetch failed: ${failed}.`)
  if (dryRun) console.log("Dry run: no suggestions were written. Re-run without --dry-run to save them for review at /admin/verification-queue.")
  else console.log("Review these at /admin/verification-queue.")

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
