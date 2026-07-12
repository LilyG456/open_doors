/**
 * One-time backfill: creates a ChurchSource(sourceType=OSM) row for every
 * Church that was imported before the data-provenance pipeline existed
 * (i.e. has an osmId but no ChurchSource yet), plus initial
 * ChurchFieldSource rows for its populated fields.
 *
 * Honesty note: the *original* raw OSM tags for these older imports were
 * never preserved (the import script used to write straight to Church), so
 * `rawData` here is reconstructed from the current Church row rather than
 * the true original payload — marked `reconstructed: true` so that's never
 * mistaken for an actual OSM API response. Going forward,
 * scripts/import-osm-churches.ts preserves the real raw tags for every new
 * or re-touched element, so this gap only affects historical rows.
 *
 * Safe to re-run: skips any church that already has an OSM ChurchSource.
 *
 * Usage: npx tsx scripts/backfill-church-sources.ts [--dry-run]
 */
import "dotenv/config"
import { PrismaClient, ChurchFieldName } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { DEFAULT_CONFIDENCE_BY_SOURCE_TYPE } from "../lib/church-sources"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const dryRun = process.argv.includes("--dry-run")

async function main() {
  const churches = await prisma.church.findMany({
    where: { osmId: { not: null }, sources: { none: { sourceType: "OSM" } } },
    select: {
      id: true,
      osmId: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      lat: true,
      lng: true,
      website: true,
      phone: true,
      serviceTimes: true,
      denomination: true,
    },
  })

  console.log(`Found ${churches.length} OSM-imported churches with no ChurchSource yet.`)
  if (dryRun) {
    console.log("Dry run: no changes written.")
    await prisma.$disconnect()
    return
  }

  let done = 0
  for (const church of churches) {
    const source = await prisma.churchSource.create({
      data: {
        sourceType: "OSM",
        externalId: church.osmId!,
        rawData: { reconstructed: true, note: "Original raw OSM tags were not preserved by the import script at the time this church was first imported." },
        name: church.name,
        address: church.address,
        city: church.city,
        state: church.state,
        zip: church.zip,
        lat: church.lat,
        lng: church.lng,
        website: church.website,
        phone: church.phone,
        serviceTimes: church.serviceTimes,
        denomination: church.denomination,
        confidence: DEFAULT_CONFIDENCE_BY_SOURCE_TYPE.OSM,
        churchId: church.id,
      },
    })

    const fields: [ChurchFieldName, unknown][] = [
      [ChurchFieldName.NAME, church.name],
      [ChurchFieldName.ADDRESS, church.address],
      [ChurchFieldName.CITY, church.city],
      [ChurchFieldName.STATE, church.state],
      [ChurchFieldName.ZIP, church.zip],
      [ChurchFieldName.LAT, church.lat],
      [ChurchFieldName.LNG, church.lng],
      [ChurchFieldName.WEBSITE, church.website],
      [ChurchFieldName.PHONE, church.phone],
      [ChurchFieldName.SERVICE_TIMES, church.serviceTimes.length > 0 ? church.serviceTimes : null],
      [ChurchFieldName.DENOMINATION, church.denomination],
    ]

    // Only fill in field provenance that isn't already recorded — a church
    // could already have ChurchFieldSource rows from an approved
    // ChurchEditSuggestion or admin edit even without a ChurchSource yet.
    const existingFields = new Set(
      (await prisma.churchFieldSource.findMany({ where: { churchId: church.id }, select: { field: true } })).map(
        (f) => f.field,
      ),
    )

    await prisma.churchFieldSource.createMany({
      data: fields
        .filter(([field, value]) => !existingFields.has(field) && value !== null && value !== undefined && value !== "")
        .map(([field]) => ({
          churchId: church.id,
          field,
          sourceType: "OSM" as const,
          sourceId: source.id,
          confidence: DEFAULT_CONFIDENCE_BY_SOURCE_TYPE.OSM,
        })),
    })

    done++
    if (done % 250 === 0) console.log(`  ...${done}/${churches.length} backfilled`)
  }

  console.log(`Done. Backfilled ${done} churches.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
