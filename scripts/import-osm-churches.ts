/**
 * One-time (re-runnable) import of Christian places of worship from
 * OpenStreetMap into the Church table, via the Overpass API.
 *
 * Imports factual directory data only — name, address, coordinates,
 * denomination tag, website. Never fabricates theology/accessibility/worship
 * tags or a summary blurb, since those are meant to come from real community
 * reports (see lib/aggregation.ts). Imported churches will show as "limited
 * information" until visitors submit experiences, which is correct.
 *
 * Re-running this script is safe: each OSM element is upserted by a stable
 * `osmId` (e.g. "node/123456"), so it updates existing imported rows instead
 * of duplicating them. It never touches manually-seeded churches (which have
 * osmId = null).
 *
 * Usage: npx tsx scripts/import-osm-churches.ts [--state=WA] [--dry-run]
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const stateArg = args.find((a) => a.startsWith("--state="))
const STATE_CODE = (stateArg ? stateArg.split("=")[1] : "WA").toUpperCase()

const OVERPASS_URL = "https://overpass-api.de/api/interpreter"
const USER_AGENT = "OpenDoorsImportBot/1.0 (https://github.com/; one-time OSM church directory import)"

type OverpassElement = {
  type: "node" | "way" | "relation"
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

async function fetchOverpass(stateCode: string): Promise<OverpassElement[]> {
  const query = `
[out:json][timeout:180];
area["ISO3166-2"="US-${stateCode}"]["admin_level"="4"]->.state;
(
  node["amenity"="place_of_worship"]["religion"="christian"](area.state);
  way["amenity"="place_of_worship"]["religion"="christian"](area.state);
  relation["amenity"="place_of_worship"]["religion"="christian"](area.state);
);
out center tags;
`.trim()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 200_000)
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`Overpass request failed: ${res.status} ${res.statusText} — ${await res.text()}`)
    }
    const json = (await res.json()) as { elements: OverpassElement[] }
    return json.elements
  } finally {
    clearTimeout(timeout)
  }
}

function titleCase(s: string) {
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}

function denominationFromTags(tags: Record<string, string>): string {
  if (tags.denomination) return titleCase(tags.denomination)
  return "Christian (denomination not specified)"
}

function addressFromTags(tags: Record<string, string>): string {
  const parts = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean)
  return parts.join(" ")
}

function cityFromTags(tags: Record<string, string>): string {
  return (
    tags["addr:city"] ||
    tags["addr:suburb"] ||
    tags["addr:hamlet"] ||
    tags["addr:place"] ||
    `${STATE_CODE} (city unknown)`
  )
}

function normalizeNameForDedup(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(the|church|of|a)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const TYPE_PRIORITY: Record<OverpassElement["type"], number> = { node: 0, relation: 1, way: 2 }

type Candidate = {
  osmId: string
  type: OverpassElement["type"]
  name: string
  normalizedName: string
  lat: number
  lng: number
  tags: Record<string, string>
}

/** Grid-bucketed proximity + name dedup — see module comment for why this exists. */
function dedupeElements(elements: OverpassElement[]): Candidate[] {
  const candidates: Candidate[] = []
  for (const el of elements) {
    const tags = el.tags ?? {}
    if (!tags.name) continue
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (lat === undefined || lng === undefined) continue
    candidates.push({
      osmId: `${el.type}/${el.id}`,
      type: el.type,
      name: tags.name,
      normalizedName: normalizeNameForDedup(tags.name),
      lat,
      lng,
      tags,
    })
  }

  // Prefer nodes over relations over ways when the same church is mapped twice.
  candidates.sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type])

  const BUCKET_SIZE = 0.005 // ~500m
  const buckets = new Map<string, Candidate[]>()
  const kept: Candidate[] = []

  function bucketKey(lat: number, lng: number) {
    return `${Math.round(lat / BUCKET_SIZE)}_${Math.round(lng / BUCKET_SIZE)}`
  }

  for (const c of candidates) {
    const bx = Math.round(c.lat / BUCKET_SIZE)
    const by = Math.round(c.lng / BUCKET_SIZE)
    let isDuplicate = false
    for (let dx = -1; dx <= 1 && !isDuplicate; dx++) {
      for (let dy = -1; dy <= 1 && !isDuplicate; dy++) {
        const neighbors = buckets.get(`${bx + dx}_${by + dy}`)
        if (!neighbors) continue
        for (const other of neighbors) {
          if (
            other.normalizedName === c.normalizedName &&
            haversineMeters(c.lat, c.lng, other.lat, other.lng) < 150
          ) {
            isDuplicate = true
            break
          }
        }
      }
    }
    if (isDuplicate) continue
    kept.push(c)
    const key = bucketKey(c.lat, c.lng)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(c)
  }

  return kept
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function main() {
  console.log(`Fetching Christian places of worship for US-${STATE_CODE} from Overpass...`)
  const elements = await fetchOverpass(STATE_CODE)
  console.log(`Fetched ${elements.length} raw OSM elements.`)

  const deduped = dedupeElements(elements)
  console.log(
    `After requiring a name and de-duplicating near-identical node/way/relation pairs: ${deduped.length} candidate churches.`,
  )

  const existingSlugs = new Set(
    (await prisma.church.findMany({ select: { slug: true } })).map((c) => c.slug),
  )

  let created = 0
  let updated = 0

  for (const [i, c] of deduped.entries()) {
    const city = cityFromTags(c.tags)
    const baseSlug = slugify(`${c.name}-${city}`)
    let slug = baseSlug
    let suffix = 2
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`
    }

    const data = {
      slug,
      name: c.name,
      denomination: denominationFromTags(c.tags),
      address: addressFromTags(c.tags),
      city,
      state: STATE_CODE,
      zip: c.tags["addr:postcode"] ?? null,
      lat: c.lat,
      lng: c.lng,
      website: c.tags.website ?? c.tags["contact:website"] ?? null,
      serviceTimes: c.tags.service_times ? [c.tags.service_times] : [],
      osmId: c.osmId,
    }

    if (dryRun) {
      existingSlugs.add(slug)
      created++
      continue
    }

    const existing = await prisma.church.findUnique({ where: { osmId: c.osmId }, select: { id: true } })
    await prisma.church.upsert({
      where: { osmId: c.osmId },
      update: data,
      create: data,
    })
    existingSlugs.add(slug)
    if (existing) updated++
    else created++

    if ((i + 1) % 250 === 0) {
      console.log(`  ...${i + 1}/${deduped.length} processed`)
    }
  }

  console.log(
    dryRun
      ? `Dry run: would create/update ${created} churches. Re-run without --dry-run to write to the database.`
      : `Done. Created ${created}, updated ${updated} churches from OpenStreetMap.`,
  )

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
