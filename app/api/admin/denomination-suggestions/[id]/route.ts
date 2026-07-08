import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { suggestionDecisionSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    const body = await req.json()
    const parsed = suggestionDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const suggestion = await prisma.denominationSuggestion.findUnique({ where: { id } })
    if (!suggestion) throw new ApiError(404, "Suggestion not found.")
    if (suggestion.status !== "PENDING") throw new ApiError(409, "This suggestion was already reviewed.")

    if (parsed.data.decision === "ACCEPT") {
      if (!suggestion.suggestedDenominationId) {
        throw new ApiError(400, "This suggestion has no denomination to accept — reject it instead.")
      }
      await prisma.$transaction([
        prisma.church.update({
          where: { id: suggestion.churchId },
          data: { denominationId: suggestion.suggestedDenominationId },
        }),
        prisma.denominationSuggestion.update({
          where: { id },
          data: { status: "ACCEPTED", reviewedById: admin.id, reviewedAt: new Date() },
        }),
      ])
    } else {
      await prisma.denominationSuggestion.update({
        where: { id },
        data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
