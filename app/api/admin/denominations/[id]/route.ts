import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { denominationUpsertSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await req.json()
    const parsed = denominationUpsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const existing = await prisma.denomination.findUnique({ where: { id } })
    if (!existing) throw new ApiError(404, "Denomination not found.")

    const nameTaken = await prisma.denomination.findFirst({
      where: { name: input.name, NOT: { id } },
      select: { id: true },
    })
    if (nameTaken) throw new ApiError(409, "A denomination with this name already exists.")

    const updated = await prisma.denomination.update({
      where: { id },
      data: {
        name: input.name,
        tradition: input.tradition,
        governance: input.governance,
        originsNote: input.originsNote ?? null,
        founded: input.founded ?? null,
        headquarters: input.headquarters ?? null,
        membershipApprox: input.membershipApprox ?? null,
        website: input.website ?? null,
        beliefsUrl: input.beliefsUrl ?? null,
        allowsLgbtqClergy: input.allowsLgbtqClergy,
        allowsSameSexMarriage: input.allowsSameSexMarriage,
        requiresChurchesSameSexMarriage: input.requiresChurchesSameSexMarriage,
        allowsWomenPastors: input.allowsWomenPastors,
        allowsWomenBishops: input.allowsWomenBishops,
        communionPractice: input.communionPractice ?? null,
        baptismPractice: input.baptismPractice ?? null,
        notes: input.notes ?? null,
        lastUpdated: input.lastUpdated ? new Date(input.lastUpdated) : new Date(),
      },
    })

    return NextResponse.json({ id: updated.id })
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const linkedChurches = await prisma.church.count({ where: { denominationId: id } })
    if (linkedChurches > 0) {
      throw new ApiError(
        409,
        `${linkedChurches} church${linkedChurches === 1 ? " is" : "es are"} still linked to this denomination. Re-link or clear them first.`,
      )
    }

    await prisma.denomination.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
