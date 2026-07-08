/**
 * (Re-)runs denomination matching (lib/denomination-matching.ts) against
 * existing Church rows. This is the deliberate, explicit counterpart to the
 * matching import-osm-churches.ts does automatically at create time — use it
 * when:
 *   - you've added new DenominationAlias rows and want previously-unmatched
 *     churches to pick them up, or
 *   - you want to re-check every church, including ones already linked
 *     (--force), after fixing bad seed data.
 *
 * By default, only touches churches with denominationId = null, so it never
 * clobbers an admin's manual correction — see the comment in
 * import-osm-churches.ts for why that matters.
 *
 * Usage: npx tsx scripts/match-denominations.ts [--dry-run] [--force]
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { loadDenominationIndex, matchDenominationWithIndex } from "../lib/denomination-matching"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const force = args.includes("--force")

async function main() {
  const index = await loadDenominationIndex(prisma)

  const churches = await prisma.church.findMany({
    where: force ? {} : { denominationId: null },
    select: { id: true, name: true, denomination: true, denominationId: true },
  })

  let matched = 0
  let nonDenominational = 0
  const unmatchedRaw = new Map<string, number>()

  for (const church of churches) {
    const result = matchDenominationWithIndex(church.denomination, index)

    if (result.kind === "matched") {
      matched++
      if (!dryRun && church.denominationId !== result.denominationId) {
        await prisma.church.update({
          where: { id: church.id },
          data: { denominationId: result.denominationId },
        })
      }
    } else if (result.kind === "non-denominational") {
      nonDenominational++
      if (!dryRun && church.denominationId !== null) {
        await prisma.church.update({ where: { id: church.id }, data: { denominationId: null } })
      }
    } else {
      unmatchedRaw.set(church.denomination, (unmatchedRaw.get(church.denomination) ?? 0) + 1)
    }
  }

  console.log(`Checked ${churches.length} churches${force ? " (forced re-check of all)" : " (unmatched only)"}.`)
  console.log(`  Matched: ${matched}`)
  console.log(`  Explicitly non-denominational: ${nonDenominational}`)
  console.log(`  Still unmatched: ${churches.length - matched - nonDenominational}`)

  if (unmatchedRaw.size > 0) {
    console.log("\nUnmatched raw denomination strings (add a DenominationAlias for these, via /admin/denominations):")
    for (const [raw, count] of [...unmatchedRaw.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count.toString().padStart(4)}  ${raw}`)
    }
  }

  if (dryRun) console.log("\nDry run: no changes were written. Re-run without --dry-run to apply.")

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
