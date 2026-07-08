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

    const suggestion = await prisma.churchEditSuggestion.findUnique({ where: { id } })
    if (!suggestion) throw new ApiError(404, "Suggestion not found.")
    if (suggestion.status !== "PENDING") throw new ApiError(409, "This suggestion was already reviewed.")

    if (parsed.data.decision === "ACCEPT") {
      const churchUpdate: Record<string, unknown> = {}
      if (suggestion.website) churchUpdate.website = suggestion.website
      if (suggestion.address) churchUpdate.address = suggestion.address
      if (suggestion.city) churchUpdate.city = suggestion.city
      if (suggestion.serviceTimes.length > 0) churchUpdate.serviceTimes = suggestion.serviceTimes
      if (suggestion.summary) churchUpdate.summary = suggestion.summary

      const tagIds = [
        ...suggestion.addAccessibilityTagIds,
        ...suggestion.addWorshipTagIds,
        ...suggestion.addCommunityTagIds,
        ...suggestion.addMentalHealthTagIds,
        ...suggestion.addTheologyTagIds,
      ]

      await prisma.$transaction([
        ...(Object.keys(churchUpdate).length > 0
          ? [prisma.church.update({ where: { id: suggestion.churchId }, data: churchUpdate })]
          : []),
        ...(tagIds.length > 0
          ? [
              prisma.churchTag.createMany({
                data: tagIds.map((tagId) => ({ churchId: suggestion.churchId, tagId })),
                skipDuplicates: true,
              }),
            ]
          : []),
        prisma.churchEditSuggestion.update({
          where: { id },
          data: { status: "ACCEPTED", reviewedById: admin.id, reviewedAt: new Date() },
        }),
      ])
    } else {
      await prisma.churchEditSuggestion.update({
        where: { id },
        data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
