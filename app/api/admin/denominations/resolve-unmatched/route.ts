import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveUnmatchedSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"
import { normalizeDenominationString } from "@/lib/denomination-matching"

/**
 * The triage action for the admin's "needs matching" queue: teaches the
 * matcher this raw string permanently (creates/updates a DenominationAlias)
 * and immediately links every currently-unmatched church carrying that exact
 * raw string, so the fix takes effect right away instead of waiting for the
 * next import/backfill run.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const parsed = resolveUnmatchedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { rawDenomination, denominationId } = parsed.data

    const denomination = await prisma.denomination.findUnique({
      where: { id: denominationId },
      select: { id: true },
    })
    if (!denomination) throw new ApiError(404, "Denomination not found.")

    const alias = normalizeDenominationString(rawDenomination)
    const existingAlias = await prisma.denominationAlias.findUnique({ where: { alias } })
    if (existingAlias && existingAlias.denominationId !== denominationId) {
      throw new ApiError(409, `"${rawDenomination}" is already linked to a different denomination.`)
    }

    const [, updateResult] = await prisma.$transaction([
      prisma.denominationAlias.upsert({
        where: { alias },
        update: { denominationId },
        create: { alias, denominationId },
      }),
      prisma.church.updateMany({
        where: { denomination: rawDenomination, denominationId: null },
        data: { denominationId },
      }),
    ])

    return NextResponse.json({ churchesLinked: updateResult.count })
  } catch (error) {
    return jsonError(error)
  }
}
