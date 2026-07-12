import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchDenominationEditSchema } from "@/lib/validations"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"

// A direct one-off correction, separate from the alias-driven matching in
// lib/denomination-matching.ts. Use this when a specific church's own
// website says something the raw string/alias table couldn't have caught —
// e.g. tagged "Non-denominational" but it actually names an affiliation.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModerator()
    const { id } = await params

    const church = await prisma.church.findUnique({ where: { id }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const body = await req.json()
    const parsed = churchDenominationEditSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    if (input.denominationId) {
      const denomination = await prisma.denomination.findUnique({
        where: { id: input.denominationId },
        select: { id: true },
      })
      if (!denomination) throw new ApiError(404, "Denomination not found.")
    }

    const updated = await prisma.church.update({
      where: { id },
      data: { denomination: input.denomination, denominationId: input.denominationId },
    })

    return NextResponse.json({ id: updated.id, denomination: updated.denomination, denominationId: updated.denominationId })
  } catch (error) {
    return jsonError(error)
  }
}
