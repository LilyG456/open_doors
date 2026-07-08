import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { denominationUpsertSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const parsed = denominationUpsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const existing = await prisma.denomination.findUnique({ where: { name: input.name }, select: { id: true } })
    if (existing) throw new ApiError(409, "A denomination with this name already exists.")

    const denomination = await prisma.denomination.create({
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

    return NextResponse.json({ id: denomination.id }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
