/**
 * Core "scrape one ChurchFinder.com batch and run it through the matching
 * pipeline" logic — shared by scripts/import-church-finder.ts (ad hoc,
 * any URL(s)) and scripts/import-church-finder-wa.ts (systematic,
 * one Washington city at a time). Kept here rather than duplicated so the
 * two entry points can never drift out of sync on how a listing is parsed
 * or matched.
 *
 * See scripts/import-church-finder.ts's module comment for the fuller
 * rationale (why website/imageUrl are ignored, why addresses are geocoded,
 * confidence rules, etc).
 */
import type { PrismaClient } from "@prisma/client"
import { ApifyClient } from "apify-client"
import { geocodeAddress } from "./geocode"
import { DEFAULT_CONFIDENCE_BY_SOURCE_TYPE } from "./church-sources"
import { findBestMatch, upsertMergeCandidate, performMerge, AUTO_MERGE_THRESHOLD } from "./church-merge"

export const CHURCH_FINDER_ACTOR_ID = "MTWRuFjw4Vsg1e8Tz"
const GEOCODE_DELAY_MS = 1100

type ChurchFinderItem = {
  url: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  phone: string | null
  denomination: string | null
  serviceTimes: string | null
  description: string | null
  claimed: boolean
  scrapedAt: string
}

export type ChurchFinderBatchStats = {
  scraped: number
  created: number
  autoMatched: number
  sentToReview: number
  noMatch: number
  geocodeFailed: number
  alreadyLinked: number
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ChurchFinder concatenates street + "City, ST ZIPCountry" with no
// separating space (e.g. "132 Odell Clark PlNew York, NY 10030United
// States"). city/state/zipCode are given separately, so the street can
// usually be recovered deterministically by stripping the known suffix
// rather than guessing where the street name ends. `matched: false` means
// the item's own city/state/zip don't actually appear at the end of its
// address (seen on org/diocese listings where ChurchFinder's assigned
// "city" is the metro area, not the literal city in the mailing address) —
// in that case the raw address is kept as-is rather than guessed at.
function extractStreet(item: ChurchFinderItem): { street: string | null; matched: boolean } {
  if (!item.address) return { street: null, matched: false }
  if (!item.city || !item.state) return { street: item.address.trim() || null, matched: false }

  const suffixVariants = [
    `${item.city}, ${item.state} ${item.zipCode ?? ""}United States`,
    `${item.city}, ${item.state} ${item.zipCode ?? ""}`,
    `${item.city}, ${item.state}`,
  ]
  for (const suffix of suffixVariants) {
    if (item.address.endsWith(suffix)) {
      const street = item.address.slice(0, item.address.length - suffix.length).trim()
      if (street) return { street, matched: true }
    }
  }
  return { street: item.address.trim() || null, matched: false }
}

function parseServiceTimes(raw: string | null): string[] {
  if (!raw) return []
  return raw.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
}

export async function importChurchFinderBatch(
  prisma: PrismaClient,
  client: ApifyClient,
  opts: { startUrls: string[]; maxItems: number; dryRun?: boolean },
): Promise<ChurchFinderBatchStats> {
  const stats: ChurchFinderBatchStats = {
    scraped: 0,
    created: 0,
    autoMatched: 0,
    sentToReview: 0,
    noMatch: 0,
    geocodeFailed: 0,
    alreadyLinked: 0,
  }

  const run = await client.actor(CHURCH_FINDER_ACTOR_ID).call({ maxItems: opts.maxItems, startUrls: opts.startUrls })
  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  const churchFinderItems = items as unknown as ChurchFinderItem[]
  stats.scraped = churchFinderItems.length
  console.log(`Scraped ${churchFinderItems.length} listings.`)

  for (const item of churchFinderItems) {
    const { street, matched } = extractStreet(item)
    // If the address didn't cleanly split, item.city/state/zip may not
    // actually describe this address (see extractStreet) — geocode the raw
    // string alone rather than appending fields that could be wrong.
    const geocodeQuery = matched ? [street, item.city, item.state, item.zipCode].filter(Boolean).join(", ") : street ?? ""
    console.log(`\n${item.name} — ${geocodeQuery || "(no address)"}`)

    let coords: { lat: number; lng: number } | null = null
    if (geocodeQuery) {
      coords = await geocodeAddress(geocodeQuery)
      await sleep(GEOCODE_DELAY_MS)
    }
    if (!coords) {
      console.log("  Could not geocode — recording as an orphan source with no coordinates.")
      stats.geocodeFailed++
    }

    const confidence = item.claimed ? DEFAULT_CONFIDENCE_BY_SOURCE_TYPE.CHURCH_FINDER : "LOW"

    if (opts.dryRun) {
      console.log(`  Dry run: would upsert ChurchSource (confidence=${confidence}, coords=${coords ? `${coords.lat},${coords.lng}` : "none"}).`)
      continue
    }

    const source = await prisma.churchSource.upsert({
      where: { sourceType_externalId: { sourceType: "CHURCH_FINDER", externalId: item.url } },
      update: {
        name: item.name,
        address: street,
        city: item.city,
        state: item.state,
        zip: item.zipCode,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        phone: item.phone,
        denomination: item.denomination,
        serviceTimes: parseServiceTimes(item.serviceTimes),
        confidence,
        rawData: item,
      },
      create: {
        sourceType: "CHURCH_FINDER",
        externalId: item.url,
        name: item.name,
        address: street,
        city: item.city,
        state: item.state,
        zip: item.zipCode,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        phone: item.phone,
        denomination: item.denomination,
        serviceTimes: parseServiceTimes(item.serviceTimes),
        confidence,
        rawData: item,
      },
    })

    if (source.churchId) {
      console.log("  Already linked to a church from a previous import — updated in place.")
      stats.alreadyLinked++
      continue
    }

    const best = await findBestMatch(prisma, source)
    if (!best) {
      console.log("  No likely match — left as an orphan source.")
      stats.noMatch++
      continue
    }

    if (best.score >= AUTO_MERGE_THRESHOLD) {
      const merged = await performMerge(prisma, source, best.source)
      await upsertMergeCandidate(prisma, source, best.source, best.score, best.breakdown)
      await prisma.churchMergeCandidate.updateMany({
        where: { OR: [{ sourceAId: source.id }, { sourceBId: source.id }] },
        data: { status: "AUTO_MERGED", reviewedAt: new Date() },
      })
      console.log(`  Auto-matched (score ${best.score}) -> ${merged.outcome === "created" ? "new church" : "existing church"} ${merged.churchSlug}`)
      stats.autoMatched++
      if (merged.outcome === "created") stats.created++
    } else {
      await upsertMergeCandidate(prisma, source, best.source, best.score, best.breakdown)
      console.log(`  Possible match (score ${best.score}) vs "${best.source.name}" — sent to the merge queue for review.`)
      stats.sentToReview++
    }
  }

  return stats
}
