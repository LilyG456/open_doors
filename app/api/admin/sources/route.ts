import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchSourceUntargetedSchema } from "@/lib/validations"
import { jsonError, requireModerator } from "@/lib/api-utils"
import { findBestMatch, upsertMergeCandidate, performMerge, AUTO_MERGE_THRESHOLD } from "@/lib/church-merge"

// A listing the admin isn't sure about yet — might be a new church, might be
// a duplicate of one we already have. Unlike the targeted route
// (app/api/admin/churches/[id]/sources/route.ts), this never touches a
// Church directly: it creates an orphan ChurchSource (churchId: null), then
// runs it through the same matching logic scripts/generate-merge-candidates.ts
// uses for bulk reconciliation, so a single manually-entered listing gets
// the same instant treatment a bulk import would eventually give it.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireModerator()

    const body = await req.json()
    const parsed = churchSourceUntargetedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const source = await prisma.churchSource.upsert({
      where: { sourceType_externalId: { sourceType: input.sourceType, externalId: input.externalId } },
      update: {
        confidence: input.confidence,
        name: input.name,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zip: input.zip ?? null,
        lat: input.lat,
        lng: input.lng,
        website: input.website ?? null,
        phone: input.phone ?? null,
        serviceTimes: input.serviceTimes,
        denomination: input.denomination ?? null,
        worshipStyleRaw: input.worshipStyleRaw ?? null,
        ministryTagsRaw: input.ministryTagsRaw,
        submittedById: admin.id,
        rawData: input,
      },
      create: {
        sourceType: input.sourceType,
        externalId: input.externalId,
        confidence: input.confidence,
        name: input.name,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zip: input.zip ?? null,
        lat: input.lat,
        lng: input.lng,
        website: input.website ?? null,
        phone: input.phone ?? null,
        serviceTimes: input.serviceTimes,
        denomination: input.denomination ?? null,
        worshipStyleRaw: input.worshipStyleRaw ?? null,
        ministryTagsRaw: input.ministryTagsRaw,
        submittedById: admin.id,
        rawData: input,
      },
    })

    const best = await findBestMatch(prisma, source)
    if (!best) {
      return NextResponse.json({ id: source.id, outcome: "no-match" }, { status: 201 })
    }

    if (best.score >= AUTO_MERGE_THRESHOLD) {
      const merged = await performMerge(prisma, source, best.source, { setById: admin.id })
      await upsertMergeCandidate(prisma, source, best.source, best.score, best.breakdown)
      await prisma.churchMergeCandidate.updateMany({
        where: { OR: [{ sourceAId: source.id }, { sourceBId: source.id }] },
        data: { status: "AUTO_MERGED", reviewedAt: new Date() },
      })
      return NextResponse.json({ id: source.id, outcome: "auto-matched", churchSlug: merged.churchSlug }, { status: 201 })
    }

    await upsertMergeCandidate(prisma, source, best.source, best.score, best.breakdown)
    return NextResponse.json({ id: source.id, outcome: "review" }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
