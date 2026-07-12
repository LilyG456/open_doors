/**
 * Systematically works through every Washington city ChurchFinder.com has
 * (scripts/wa-cities.json, extracted by scripts/discover-wa-cities.ts from
 * ChurchFinder's own state index page — not guessed) a batch at a time,
 * tracking which cities are already done in scripts/.wa-import-progress.json
 * so re-running this script always continues where it left off instead of
 * re-scraping the same cities. Each city still individually dedupes by
 * listing URL (see lib/church-finder-import.ts), so even a repeated city is
 * harmless — this just makes sure repeated *runs* make forward progress by
 * default.
 *
 * Usage:
 *   npx tsx scripts/import-church-finder-wa.ts [--batch-size=15] [--max-items=60] [--dry-run]
 *   npx tsx scripts/import-church-finder-wa.ts --status   # show progress without importing
 *   npx tsx scripts/import-church-finder-wa.ts --reset    # forget progress, start over from the first city
 */
import "dotenv/config"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { ApifyClient } from "apify-client"
import { importChurchFinderBatch, type ChurchFinderBatchStats } from "../lib/church-finder-import"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const CITIES_PATH = join(__dirname, "wa-cities.json")
const PROGRESS_PATH = join(__dirname, ".wa-import-progress.json")

type Progress = Record<string, { importedAt: string; stats: ChurchFinderBatchStats }>

function loadCities(): string[] {
  if (!existsSync(CITIES_PATH)) {
    throw new Error(`${CITIES_PATH} not found — run "npx tsx scripts/discover-wa-cities.ts" first.`)
  }
  return JSON.parse(readFileSync(CITIES_PATH, "utf-8"))
}

function loadProgress(): Progress {
  if (!existsSync(PROGRESS_PATH)) return {}
  return JSON.parse(readFileSync(PROGRESS_PATH, "utf-8"))
}

function saveProgress(progress: Progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2) + "\n")
}

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const showStatus = args.includes("--status")
const reset = args.includes("--reset")
const batchSizeArg = args.find((a) => a.startsWith("--batch-size="))
const batchSize = batchSizeArg ? Number(batchSizeArg.split("=")[1]) : 15
const maxItemsArg = args.find((a) => a.startsWith("--max-items="))
const maxItemsPerCity = maxItemsArg ? Number(maxItemsArg.split("=")[1]) : 60

async function main() {
  const cities = loadCities()

  if (reset) {
    saveProgress({})
    console.log("Progress reset — the next run will start from the first city again.")
    await prisma.$disconnect()
    return
  }

  const progress = loadProgress()
  const remaining = cities.filter((c) => !progress[c])

  if (showStatus) {
    console.log(`${cities.length - remaining.length}/${cities.length} WA cities imported so far.`)
    if (remaining.length > 0) console.log(`Next up: ${remaining.slice(0, batchSize).join(", ")}`)
    await prisma.$disconnect()
    return
  }

  if (remaining.length === 0) {
    console.log(`All ${cities.length} WA cities have already been imported. Run with --reset to re-scrape from the start (e.g. to refresh stale data).`)
    await prisma.$disconnect()
    return
  }

  const batch = remaining.slice(0, batchSize)
  console.log(`${cities.length - remaining.length}/${cities.length} WA cities already done. Importing the next ${batch.length}: ${batch.join(", ")}`)

  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })
  const totals: ChurchFinderBatchStats = { scraped: 0, created: 0, autoMatched: 0, sentToReview: 0, noMatch: 0, geocodeFailed: 0, alreadyLinked: 0 }

  for (const city of batch) {
    console.log(`\n=== ${city} ===`)
    const startUrls = [`https://www.churchfinder.com/churches/wa/${city}`]
    const stats = await importChurchFinderBatch(prisma, client, { startUrls, maxItems: maxItemsPerCity, dryRun })

    if (!dryRun) {
      progress[city] = { importedAt: new Date().toISOString(), stats }
      saveProgress(progress)
    }

    for (const key of Object.keys(totals) as (keyof ChurchFinderBatchStats)[]) {
      totals[key] += stats[key]
    }
  }

  console.log(
    `\nBatch done. ${totals.scraped} scraped, ${totals.autoMatched} auto-matched (${totals.created} new churches), ${totals.sentToReview} sent to review, ${totals.noMatch} unmatched orphans, ${totals.geocodeFailed} failed to geocode.`,
  )
  console.log(`${cities.length - (remaining.length - batch.length)}/${cities.length} WA cities done overall. Run again for the next batch.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
