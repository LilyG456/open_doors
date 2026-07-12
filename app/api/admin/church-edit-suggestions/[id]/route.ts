import { NextRequest, NextResponse } from "next/server"
import { ChurchFieldName } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { suggestionDecisionSchema } from "@/lib/validations"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"
import { setFieldProvenance } from "@/lib/church-field-sync"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireModerator()
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

      // Track provenance for what actually changed — a moderator or admin
      // explicitly accepting a suggestion is itself the authoritative
      // decision, so it always wins (force: true), same as any other
      // deliberate manual edit. See lib/church-field-sync.ts for the
      // general strictly-higher-confidence rule this deliberately bypasses
      // here.
      const attribution = { sourceType: "USER_SUBMITTED" as const, confidence: "HIGH" as const, setById: admin.id }
      const fieldToTrack: [string, ChurchFieldName][] = [
        ["website", ChurchFieldName.WEBSITE],
        ["address", ChurchFieldName.ADDRESS],
        ["city", ChurchFieldName.CITY],
        ["serviceTimes", ChurchFieldName.SERVICE_TIMES],
        ["summary", ChurchFieldName.SUMMARY],
      ]
      for (const [column, field] of fieldToTrack) {
        if (column in churchUpdate) {
          await setFieldProvenance(prisma, suggestion.churchId, field, attribution, { force: true })
        }
      }
      const tagFieldsTouched: [string[], ChurchFieldName][] = [
        [suggestion.addAccessibilityTagIds, ChurchFieldName.ACCESSIBILITY_TAGS],
        [suggestion.addWorshipTagIds, ChurchFieldName.WORSHIP_TAGS],
        [suggestion.addCommunityTagIds, ChurchFieldName.COMMUNITY_TAGS],
        [suggestion.addMentalHealthTagIds, ChurchFieldName.MENTAL_HEALTH_TAGS],
        [suggestion.addTheologyTagIds, ChurchFieldName.THEOLOGY_TAGS],
      ]
      for (const [ids, field] of tagFieldsTouched) {
        if (ids.length > 0) {
          await setFieldProvenance(prisma, suggestion.churchId, field, attribution, { force: true })
        }
      }
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
