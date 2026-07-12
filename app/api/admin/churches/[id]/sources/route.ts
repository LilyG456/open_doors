import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchSourceEntrySchema } from "@/lib/validations"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"
import { applySourceToChurch } from "@/lib/church-field-sync"

// Manually-entered source records — Shepherd's Stream, a denomination
// directory, or a church's own website checked by hand — always target a
// specific, already-known church (the admin is on that church's manage
// page), so there's no matching ambiguity to resolve: apply immediately,
// respecting the normal "only overwrite with strictly higher confidence"
// rule (see lib/church-field-sync.ts).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireModerator()
    const { id } = await params

    const church = await prisma.church.findUnique({ where: { id }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const body = await req.json()
    const parsed = churchSourceEntrySchema.safeParse(body)
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
        website: input.website ?? null,
        phone: input.phone ?? null,
        serviceTimes: input.serviceTimes,
        denomination: input.denomination ?? null,
        worshipStyleRaw: input.worshipStyleRaw ?? null,
        ministryTagsRaw: input.ministryTagsRaw,
        churchId: id,
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
        website: input.website ?? null,
        phone: input.phone ?? null,
        serviceTimes: input.serviceTimes,
        denomination: input.denomination ?? null,
        worshipStyleRaw: input.worshipStyleRaw ?? null,
        ministryTagsRaw: input.ministryTagsRaw,
        churchId: id,
        submittedById: admin.id,
        rawData: input,
      },
    })

    const result = await applySourceToChurch(prisma, id, source, { setById: admin.id })

    return NextResponse.json({ id: source.id, ...result }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
