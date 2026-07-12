/**
 * Bulk reconciliation: scans every orphan ChurchSource (churchId: null —
 * from an untargeted admin entry, or from a future bulk import that doesn't
 * resolve matches inline) and scores it against nearby sources using the
 * same lib/church-merge.ts logic app/api/admin/sources/route.ts uses for a
 * single listing. Anything scoring at or above REVIEW_THRESHOLD gets (or
 * refreshes) a PENDING ChurchMergeCandidate row; run
 * scripts/apply-merges.ts afterward to auto-merge the ones that clear
 * AUTO_MERGE_THRESHOLD.
 *
 * Deliberately out of scope: pairing two sources that are EACH ALREADY
 * linked to a different canonical Church. Two established churches turning
 * out to be the same place is rare, high-stakes (it would need to combine
 * each church's experiences, saved-by, tags, edit history, etc.), and
 * decidedly not "duplicate listing cleanup" — it warrants a deliberate
 * admin-initiated action of its own, not something this pipeline decides
 * silently. lib/church-merge.ts's findBestMatch already excludes this case.
 *
 * Safe to re-run: PENDING candidates get their score refreshed; anything a
 * human already reviewed (APPROVED/REJECTED/IGNORED/AUTO_MERGED) is left
 * alone, even if it would now score differently.
 *
 * Usage: npx tsx scripts/generate-merge-candidates.ts [--dry-run]
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { findBestMatch, upsertMergeCandidate } from "../lib/church-merge"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const dryRun = process.argv.includes("--dry-run")

async function main() {
  const orphans = await prisma.churchSource.findMany({
    where: { churchId: null, dismissedAt: null, lat: { not: null }, lng: { not: null } },
  })

  console.log(`Found ${orphans.length} unmatched source records with coordinates.`)

  let matched = 0
  let noMatch = 0

  for (const orphan of orphans) {
    const best = await findBestMatch(prisma, orphan)
    if (!best) {
      noMatch++
      continue
    }

    console.log(`  ${orphan.name} <-> ${best.source.name}: score ${best.score}`)
    matched++
    if (!dryRun) {
      await upsertMergeCandidate(prisma, orphan, best.source, best.score, best.breakdown)
    }
  }

  if (dryRun) {
    console.log(`Dry run: would create/refresh ${matched} candidates, ${noMatch} sources had no match above the review threshold.`)
  } else {
    console.log(`Done. ${matched} candidates created/refreshed, ${noMatch} sources had no match above the review threshold.`)
  }
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
