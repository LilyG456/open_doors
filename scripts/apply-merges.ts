/**
 * Processes every PENDING ChurchMergeCandidate: re-scores the pair (data
 * may have changed since the candidate was created) and, if it still clears
 * AUTO_MERGE_THRESHOLD, performs the merge via lib/church-merge.ts and marks
 * it AUTO_MERGED. Anything still in the review band (>= REVIEW_THRESHOLD but
 * below AUTO_MERGE_THRESHOLD) is left PENDING for a human to review in the
 * admin Merge Queue. Anything that dropped below REVIEW_THRESHOLD entirely
 * (e.g. one side was hand-corrected and no longer resembles the other) is
 * left PENDING too, rather than silently discarded — an admin should see
 * why it no longer looks like a match, not have it vanish.
 *
 * Usage: npx tsx scripts/apply-merges.ts [--dry-run]
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { scoreMatch, AUTO_MERGE_THRESHOLD, type MatchableRecord } from "../lib/church-matching"
import { performMerge } from "../lib/church-merge"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const dryRun = process.argv.includes("--dry-run")

function toMatchable(source: { name: string; address: string | null; city: string | null; state: string | null; zip: string | null; lat: number | null; lng: number | null; website: string | null }): MatchableRecord {
  return source
}

async function main() {
  const pending = await prisma.churchMergeCandidate.findMany({
    where: { status: "PENDING" },
    include: { sourceA: true, sourceB: true },
  })

  console.log(`Found ${pending.length} pending merge candidates.`)

  let autoMerged = 0
  let stillPending = 0

  for (const candidate of pending) {
    // Both sides may already have been claimed by a different merge since
    // this candidate was created (e.g. one side was auto-merged into
    // another pair first) — a stale pairing like that can't be applied.
    if (candidate.sourceA.churchId && candidate.sourceB.churchId && candidate.sourceA.churchId !== candidate.sourceB.churchId) {
      console.log(`  Skipping ${candidate.id}: both sides now belong to different established churches.`)
      stillPending++
      continue
    }

    const { score, breakdown } = scoreMatch(toMatchable(candidate.sourceA), toMatchable(candidate.sourceB))

    if (score < AUTO_MERGE_THRESHOLD) {
      if (!dryRun && score !== candidate.score) {
        await prisma.churchMergeCandidate.update({ where: { id: candidate.id }, data: { score, scoreBreakdown: breakdown } })
      }
      stillPending++
      continue
    }

    console.log(`  Auto-merging ${candidate.sourceA.name} <-> ${candidate.sourceB.name} (score ${score})`)
    autoMerged++
    if (dryRun) continue

    await performMerge(prisma, candidate.sourceA, candidate.sourceB)
    await prisma.churchMergeCandidate.update({
      where: { id: candidate.id },
      data: { status: "AUTO_MERGED", score, scoreBreakdown: breakdown, reviewedAt: new Date() },
    })
  }

  if (dryRun) {
    console.log(`Dry run: would auto-merge ${autoMerged}, leave ${stillPending} pending for review.`)
  } else {
    console.log(`Done. Auto-merged ${autoMerged}, left ${stillPending} pending for review.`)
  }
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
