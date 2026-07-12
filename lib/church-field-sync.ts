/**
 * Applies one ChurchSource's data onto a canonical Church record — the one
 * place that actually writes Church fields as part of the multi-source
 * pipeline, so "never overwrite blindly" is enforced in exactly one spot.
 *
 * A field only changes if the incoming source's confidence is *strictly
 * higher* than whatever confidence the field is currently recorded at (see
 * ChurchFieldSource), or the field has no recorded source yet. Equal
 * confidence never overwrites — two MEDIUM-confidence sources disagreeing
 * isn't grounds for one silently replacing the other; that's exactly the
 * kind of case that should surface in the admin review queue instead (see
 * scripts/generate-merge-candidates.ts).
 */
import type { PrismaClient, ChurchSource, ChurchSourceType, SourceConfidence } from "@prisma/client"
import { ChurchFieldName } from "@prisma/client"
import { CONFIDENCE_RANK } from "./church-sources"

export type FieldSyncResult = {
  updatedFields: ChurchFieldName[]
  skippedFields: { field: ChurchFieldName; reason: string }[]
}

const FIELD_TO_CHURCH_COLUMN: Partial<Record<ChurchFieldName, string>> = {
  NAME: "name",
  ADDRESS: "address",
  CITY: "city",
  STATE: "state",
  ZIP: "zip",
  LAT: "lat",
  LNG: "lng",
  WEBSITE: "website",
  PHONE: "phone",
  SERVICE_TIMES: "serviceTimes",
  DENOMINATION: "denomination",
}

// Common ways a source might phrase worship style, mapped onto our curated
// WORSHIP tag vocabulary (see prisma/seed.ts THEOLOGY/WORSHIP_TAGS). First
// keyword found in the raw text wins; anything unrecognized is preserved
// untouched in ChurchSource.worshipStyleRaw (nothing is ever lost) but
// simply doesn't produce a tag.
const WORSHIP_STYLE_KEYWORDS: [string, string][] = [
  ["contemporary", "Contemporary"],
  ["traditional", "Traditional"],
  ["liturgical", "Liturgical"],
  ["blended", "Blended"],
]

/**
 * Records which source currently backs a field, subject to the same
 * strictly-higher-confidence rule as applySourceToChurch — exported so
 * callers that don't have (or don't want) a full ChurchSource row can still
 * participate in provenance tracking. Used directly by the
 * ChurchEditSuggestion acceptance route, where an admin's explicit "accept
 * this suggestion" click is itself the authoritative decision: pass
 * `force: true` to record it regardless of the field's current confidence,
 * the same way any other deliberate admin edit would.
 */
export async function setFieldProvenance(
  prisma: PrismaClient,
  churchId: string,
  field: ChurchFieldName,
  attribution: { sourceType: ChurchSourceType; confidence: SourceConfidence; sourceId?: string | null; setById?: string },
  opts: { force?: boolean } = {},
): Promise<boolean> {
  const existing = await prisma.churchFieldSource.findUnique({ where: { churchId_field: { churchId, field } } })
  const wins = opts.force || !existing || CONFIDENCE_RANK[attribution.confidence] > CONFIDENCE_RANK[existing.confidence]
  if (!wins) return false

  await prisma.churchFieldSource.upsert({
    where: { churchId_field: { churchId, field } },
    update: {
      sourceType: attribution.sourceType,
      sourceId: attribution.sourceId ?? null,
      confidence: attribution.confidence,
      setById: attribution.setById ?? null,
      setAt: new Date(),
    },
    create: {
      churchId,
      field,
      sourceType: attribution.sourceType,
      sourceId: attribution.sourceId ?? null,
      confidence: attribution.confidence,
      setById: attribution.setById ?? null,
    },
  })
  return true
}

async function trySetFieldSource(
  prisma: PrismaClient,
  churchId: string,
  field: ChurchFieldName,
  source: ChurchSource,
  setById: string | undefined,
): Promise<boolean> {
  return setFieldProvenance(prisma, churchId, field, {
    sourceType: source.sourceType,
    confidence: source.confidence,
    sourceId: source.id,
    setById,
  })
}

async function applyTagSignals(
  prisma: PrismaClient,
  churchId: string,
  source: ChurchSource,
  setById: string | undefined,
): Promise<ChurchFieldName[]> {
  const updated: ChurchFieldName[] = []

  if (source.worshipStyleRaw) {
    const normalized = source.worshipStyleRaw.toLowerCase()
    const matchedLabel = WORSHIP_STYLE_KEYWORDS.find(([kw]) => normalized.includes(kw))?.[1]
    if (matchedLabel) {
      const tag = await prisma.tag.findUnique({ where: { label_category: { label: matchedLabel, category: "WORSHIP" } } })
      if (tag) {
        await prisma.churchTag.upsert({
          where: { churchId_tagId: { churchId, tagId: tag.id } },
          update: {},
          create: { churchId, tagId: tag.id },
        })
        if (await trySetFieldSource(prisma, churchId, ChurchFieldName.WORSHIP_TAGS, source, setById)) {
          updated.push(ChurchFieldName.WORSHIP_TAGS)
        }
      }
    }
  }

  if (source.ministryTagsRaw.length > 0) {
    const communityTags = await prisma.tag.findMany({ where: { category: "COMMUNITY" } })
    let matchedAny = false
    for (const raw of source.ministryTagsRaw) {
      const rawNormalized = raw.trim().toLowerCase()
      const match = communityTags.find(
        (t) => t.label.toLowerCase() === rawNormalized || rawNormalized.includes(t.label.toLowerCase()),
      )
      if (!match) continue
      matchedAny = true
      await prisma.churchTag.upsert({
        where: { churchId_tagId: { churchId, tagId: match.id } },
        update: {},
        create: { churchId, tagId: match.id },
      })
    }
    if (matchedAny && (await trySetFieldSource(prisma, churchId, ChurchFieldName.COMMUNITY_TAGS, source, setById))) {
      updated.push(ChurchFieldName.COMMUNITY_TAGS)
    }
  }

  return updated
}

export async function applySourceToChurch(
  prisma: PrismaClient,
  churchId: string,
  source: ChurchSource,
  opts: { setById?: string } = {},
): Promise<FieldSyncResult> {
  const candidates: [ChurchFieldName, unknown][] = [
    [ChurchFieldName.NAME, source.name || null],
    [ChurchFieldName.ADDRESS, source.address],
    [ChurchFieldName.CITY, source.city],
    [ChurchFieldName.STATE, source.state],
    [ChurchFieldName.ZIP, source.zip],
    [ChurchFieldName.LAT, source.lat],
    [ChurchFieldName.LNG, source.lng],
    [ChurchFieldName.WEBSITE, source.website],
    [ChurchFieldName.PHONE, source.phone],
    [ChurchFieldName.SERVICE_TIMES, source.serviceTimes.length > 0 ? source.serviceTimes : null],
    [ChurchFieldName.DENOMINATION, source.denomination],
  ]

  const updatedFields: ChurchFieldName[] = []
  const skippedFields: { field: ChurchFieldName; reason: string }[] = []
  const churchUpdate: Record<string, unknown> = {}

  for (const [field, value] of candidates) {
    if (value === null || value === undefined || value === "") continue

    const column = FIELD_TO_CHURCH_COLUMN[field]
    if (!column) continue

    const existing = await prisma.churchFieldSource.findUnique({ where: { churchId_field: { churchId, field } } })
    const wins = !existing || CONFIDENCE_RANK[source.confidence] > CONFIDENCE_RANK[existing.confidence]
    if (!wins) {
      skippedFields.push({
        field,
        reason: existing
          ? `current field is ${existing.confidence} confidence, this source is only ${source.confidence}`
          : "unexpected",
      })
      continue
    }

    churchUpdate[column] = value
    updatedFields.push(field)
    await trySetFieldSource(prisma, churchId, field, source, opts.setById)
  }

  if (Object.keys(churchUpdate).length > 0) {
    await prisma.church.update({ where: { id: churchId }, data: churchUpdate })
  }

  const tagFields = await applyTagSignals(prisma, churchId, source, opts.setById)

  return { updatedFields: [...updatedFields, ...tagFields], skippedFields }
}
