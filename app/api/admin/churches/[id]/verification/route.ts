import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchVerificationSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    const church = await prisma.church.findUnique({ where: { id }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const body = await req.json()
    const parsed = churchVerificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const verification = await prisma.churchVerification.upsert({
      where: { churchId: id },
      update: {
        lgbtqClergy: input.lgbtqClergy ?? null,
        sameSexMarriage: input.sameSexMarriage ?? null,
        requiresChurchesSameSexMarriage: input.requiresChurchesSameSexMarriage ?? null,
        womenPastors: input.womenPastors ?? null,
        womenBishops: input.womenBishops ?? null,
        sourceUrl: input.sourceUrl,
        note: input.note ?? null,
        verifiedById: admin.id,
        verifiedAt: new Date(),
      },
      create: {
        churchId: id,
        lgbtqClergy: input.lgbtqClergy ?? null,
        sameSexMarriage: input.sameSexMarriage ?? null,
        requiresChurchesSameSexMarriage: input.requiresChurchesSameSexMarriage ?? null,
        womenPastors: input.womenPastors ?? null,
        womenBishops: input.womenBishops ?? null,
        sourceUrl: input.sourceUrl,
        note: input.note ?? null,
        verifiedById: admin.id,
      },
    })

    return NextResponse.json({ id: verification.id })
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.churchVerification.deleteMany({ where: { churchId: id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
