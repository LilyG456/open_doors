/**
 * Ad hoc import of church listings from ChurchFinder.com for any specific
 * URL(s) you give it. For working through an entire state systematically
 * without re-scraping the same cities, use
 * scripts/import-church-finder-wa.ts instead — it tracks progress across
 * runs. See lib/church-finder-import.ts for how a listing is parsed,
 * geocoded, and matched.
 *
 * Usage:
 *   npx tsx scripts/import-church-finder.ts --url=https://www.churchfinder.com/churches/ny/new-york [--url=...] [--max-items=10] [--dry-run]
 * Defaults to a two-city test set if no --url is given.
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { ApifyClient } from "apify-client"
import { importChurchFinderBatch } from "../lib/church-finder-import"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const urlArgs = args.filter((a) => a.startsWith("--url=")).map((a) => a.slice("--url=".length))
const maxItemsArg = args.find((a) => a.startsWith("--max-items="))
const maxItems = maxItemsArg ? Number(maxItemsArg.split("=")[1]) : 10
const startUrls = urlArgs.length > 0
  ? urlArgs
  : ["https://www.churchfinder.com/churches/ny/new-york", "https://www.churchfinder.com/churches/ca/los-angeles"]

async function main() {
  console.log(`Fetching from ${startUrls.length} ChurchFinder URL(s), max ${maxItems} items total.`)
  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })
  const stats = await importChurchFinderBatch(prisma, client, { startUrls, maxItems, dryRun })
  console.log(
    `\nDone. ${stats.autoMatched} auto-matched (${stats.created} as new churches), ${stats.sentToReview} sent to review, ${stats.noMatch} unmatched orphans, ${stats.geocodeFailed} failed to geocode, ${stats.alreadyLinked} already linked.`,
  )
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
