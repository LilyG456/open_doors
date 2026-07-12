/**
 * Shared "what should happen with this ChurchSource" decision logic — used
 * identically by the inline admin "add an unmatched listing" API route (one
 * source at a time, instant feedback) and the bulk
 * scripts/generate-merge-candidates.ts / scripts/apply-merges.ts, so the two
 * paths can never disagree about what counts as a match.
 */
import type { PrismaClient, ChurchSource } from "@prisma/client"
import { scoreMatch, AUTO_MERGE_THRESHOLD, REVIEW_THRESHOLD, type MatchableRecord } from "./church-matching"
import { applySourceToChurch } from "./church-field-sync"

/** Degrees of lat/lng to search around a source — ~5-6km, generously wider than MAX_MEANINGFUL_DISTANCE_METERS in church-matching.ts so nothing just outside the geo-score cutoff is missed by the candidate search itself. */
const SEARCH_RADIUS_DEGREES = 0.05

function toMatchable(source: Pick<ChurchSource, "name" | "address" | "city" | "state" | "zip" | "lat" | "lng" | "website">): MatchableRecord {
  return {
    name: source.name,
    address: source.address,
    city: source.city,
    state: source.state,
    zip: source.zip,
    lat: source.lat,
    lng: source.lng,
    website: source.website,
  }
}

export type BestMatch = {
  source: ChurchSource
  score: number
  breakdown: ReturnType<typeof scoreMatch>["breakdown"]
}

/**
 * Finds the best-scoring other ChurchSource near `source` — candidates from
 * churches other than the one `source` might already belong to, and never
 * itself. Returns null if nothing scored above REVIEW_THRESHOLD at all.
 */
export async function findBestMatch(prisma: PrismaClient, source: ChurchSource): Promise<BestMatch | null> {
  if (source.lat === null || source.lng === null) return null

  const nearby = await prisma.churchSource.findMany({
    where: {
      id: { not: source.id },
      // An admin already decided a dismissed orphan isn't a usable record —
      // don't keep offering it up as a match for other incoming sources.
      dismissedAt: null,
      lat: { gte: source.lat - SEARCH_RADIUS_DEGREES, lte: source.lat + SEARCH_RADIUS_DEGREES },
      lng: { gte: source.lng - SEARCH_RADIUS_DEGREES, lte: source.lng + SEARCH_RADIUS_DEGREES },
      // When source is itself an orphan, any nearby source is a fair
      // candidate — including ones already linked to a canonical church,
      // which is in fact the most common and most useful case (e.g. a
      // freshly-scraped listing matching an existing OSM-derived church).
      // When source already belongs to a church, only compare it against
      // orphans or its own siblings — never against a *different*
      // already-canonical church (see the module comment in
      // generate-merge-candidates.ts for why merging two established
      // churches is out of scope).
      ...(source.churchId ? { OR: [{ churchId: null }, { churchId: source.churchId }] } : {}),
    },
  })

  let best: BestMatch | null = null
  for (const candidate of nearby) {
    const { score, breakdown } = scoreMatch(toMatchable(source), toMatchable(candidate))
    if (score < REVIEW_THRESHOLD) continue
    if (!best || score > best.score) best = { source: candidate, score, breakdown }
  }
  return best
}

/** Consistent ordering so the same pair never produces two candidate rows in opposite order. */
function orderPair(a: ChurchSource, b: ChurchSource): [ChurchSource, ChurchSource] {
  return a.id < b.id ? [a, b] : [b, a]
}

export async function upsertMergeCandidate(
  prisma: PrismaClient,
  sourceA: ChurchSource,
  sourceB: ChurchSource,
  score: number,
  breakdown: unknown,
) {
  const [first, second] = orderPair(sourceA, sourceB)
  const existing = await prisma.churchMergeCandidate.findUnique({
    where: { sourceAId_sourceBId: { sourceAId: first.id, sourceBId: second.id } },
  })
  // A human already decided this pair isn't a match (or already reviewed it
  // some other way) — don't resurrect it just because the score was
  // recomputed. Only PENDING candidates get their score refreshed.
  if (existing && existing.status !== "PENDING") return existing

  return prisma.churchMergeCandidate.upsert({
    where: { sourceAId_sourceBId: { sourceAId: first.id, sourceBId: second.id } },
    update: { score, scoreBreakdown: breakdown as object },
    create: { sourceAId: first.id, sourceBId: second.id, score, scoreBreakdown: breakdown as object },
  })
}

export type ApplyMergeResult =
  | { outcome: "linked"; churchId: string; churchSlug: string }
  | { outcome: "created"; churchId: string; churchSlug: string }

/**
 * Actually performs a merge between two sources that have been decided to
 * be the same church (whether by the auto-merge threshold or an admin
 * accepting a candidate). Exactly one of three shapes going in:
 *   - both orphans -> creates a new canonical Church from whichever source
 *     has higher confidence, then links both.
 *   - one already canonical, one orphan -> links the orphan to it.
 *   - both already canonical -> not supported here (see the comment in
 *     generate-merge-candidates.ts); callers must not reach this with that case.
 */
export async function performMerge(
  prisma: PrismaClient,
  sourceA: ChurchSource,
  sourceB: ChurchSource,
  opts: { setById?: string } = {},
): Promise<ApplyMergeResult> {
  if (sourceA.churchId && sourceB.churchId) {
    throw new Error("performMerge does not support merging two already-canonical churches (see module comment).")
  }

  const anchor = sourceA.churchId ? sourceA : sourceB.churchId ? sourceB : null
  const orphan = anchor === sourceA ? sourceB : sourceA

  if (anchor) {
    await prisma.churchSource.update({ where: { id: orphan.id }, data: { churchId: anchor.churchId } })
    const relinkedOrphan = { ...orphan, churchId: anchor.churchId }
    await applySourceToChurch(prisma, anchor.churchId!, relinkedOrphan, opts)
    const church = await prisma.church.findUniqueOrThrow({ where: { id: anchor.churchId! }, select: { id: true, slug: true } })
    return { outcome: "linked", churchId: church.id, churchSlug: church.slug }
  }

  // Both orphans: create a new canonical Church seeded from whichever
  // source is more confident (falling back to sourceA on a tie), then
  // apply both onto it — the second application only changes fields where
  // it out-confidences the first, same as any other merge.
  const primary = rankConfidence(sourceA.confidence) >= rankConfidence(sourceB.confidence) ? sourceA : sourceB
  const secondary = primary === sourceA ? sourceB : sourceA

  const church = await createChurchFromSource(prisma, primary)
  await prisma.churchSource.updateMany({ where: { id: { in: [primary.id, secondary.id] } }, data: { churchId: church.id } })
  await applySourceToChurch(prisma, church.id, { ...primary, churchId: church.id }, opts)
  await applySourceToChurch(prisma, church.id, { ...secondary, churchId: church.id }, opts)

  return { outcome: "created", churchId: church.id, churchSlug: church.slug }
}

/**
 * Turns a single unmatched orphan into its own new canonical Church — for
 * the admin merge queue's "no likely match, this is probably a genuinely
 * new church" case, where there's no second source to merge with. Unlike
 * performMerge's orphan-vs-orphan path, only one source's data seeds the
 * new record.
 */
export async function promoteOrphanToChurch(
  prisma: PrismaClient,
  source: ChurchSource,
  opts: { setById?: string } = {},
): Promise<{ churchId: string; churchSlug: string }> {
  if (source.churchId) throw new Error("This source is already linked to a church.")

  const church = await createChurchFromSource(prisma, source)
  await prisma.churchSource.update({ where: { id: source.id }, data: { churchId: church.id } })
  await applySourceToChurch(prisma, church.id, { ...source, churchId: church.id }, opts)

  return { churchId: church.id, churchSlug: church.slug }
}

async function createChurchFromSource(prisma: PrismaClient, source: ChurchSource) {
  if (source.lat === null || source.lng === null) {
    throw new Error("Cannot create a new church from a source with no coordinates.")
  }
  const slug = await uniqueSlug(prisma, source.name, source.city ?? "")
  return prisma.church.create({
    data: {
      slug,
      name: source.name,
      denomination: source.denomination ?? "Christian (denomination not specified)",
      address: source.address ?? "",
      city: source.city ?? "",
      state: source.state,
      zip: source.zip,
      lat: source.lat,
      lng: source.lng,
      website: source.website,
      phone: source.phone,
      serviceTimes: source.serviceTimes,
    },
  })
}

function rankConfidence(c: ChurchSource["confidence"]): number {
  return { UNVERIFIED: 0, LOW: 1, MEDIUM: 2, HIGH: 3 }[c]
}

async function uniqueSlug(prisma: PrismaClient, name: string, city: string): Promise<string> {
  const base = `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  let slug = base
  let suffix = 2
  while (await prisma.church.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix++}`
  }
  return slug
}

export { AUTO_MERGE_THRESHOLD, REVIEW_THRESHOLD }
