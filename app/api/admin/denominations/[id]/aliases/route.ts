import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { denominationAliasSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"
import { normalizeDenominationString } from "@/lib/denomination-matching"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const denomination = await prisma.denomination.findUnique({ where: { id }, select: { id: true } })
    if (!denomination) throw new ApiError(404, "Denomination not found.")

    const body = await req.json()
    const parsed = denominationAliasSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const alias = normalizeDenominationString(parsed.data.alias)
    const existing = await prisma.denominationAlias.findUnique({ where: { alias } })
    if (existing) {
      throw new ApiError(
        409,
        existing.denominationId === id
          ? "That alias is already linked to this denomination."
          : "That alias is already linked to a different denomination.",
      )
    }

    const created = await prisma.denominationAlias.create({ data: { alias, denominationId: id } })
    return NextResponse.json({ id: created.id, alias: created.alias }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
