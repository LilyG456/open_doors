import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchEditSuggestionSchema } from "@/lib/validations"
import { jsonError, ApiError, requireUser } from "@/lib/api-utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser()
    const { slug } = await params

    const church = await prisma.church.findUnique({ where: { slug }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const body = await req.json()
    const parsed = churchEditSuggestionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    // Cross-check submitted tag ids against the real, curated taxonomy per
    // category rather than trusting the client — anything that doesn't
    // match a real Tag in that category is silently dropped, not stored.
    const allTagIds = [
      ...input.addAccessibilityTagIds,
      ...input.addWorshipTagIds,
      ...input.addCommunityTagIds,
      ...input.addMentalHealthTagIds,
      ...input.addTheologyTagIds,
    ]
    const validTags = allTagIds.length
      ? await prisma.tag.findMany({ where: { id: { in: allTagIds } }, select: { id: true, category: true } })
      : []
    const validIdsByCategory = (category: string) =>
      new Set(validTags.filter((t) => t.category === category).map((t) => t.id))
    const accessibilityIds = input.addAccessibilityTagIds.filter((id) => validIdsByCategory("ACCESSIBILITY").has(id))
    const worshipIds = input.addWorshipTagIds.filter((id) => validIdsByCategory("WORSHIP").has(id))
    const communityIds = input.addCommunityTagIds.filter((id) => validIdsByCategory("COMMUNITY").has(id))
    const mentalHealthIds = input.addMentalHealthTagIds.filter((id) => validIdsByCategory("MENTAL_HEALTH").has(id))
    const theologyIds = input.addTheologyTagIds.filter((id) => validIdsByCategory("THEOLOGY").has(id))

    const suggestion = await prisma.churchEditSuggestion.create({
      data: {
        churchId: church.id,
        submittedById: user.id,
        submitterRole: input.submitterRole,
        website: input.website ?? null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        serviceTimes: input.serviceTimes,
        summary: input.summary?.trim() || null,
        addAccessibilityTagIds: accessibilityIds,
        addWorshipTagIds: worshipIds,
        addCommunityTagIds: communityIds,
        addMentalHealthTagIds: mentalHealthIds,
        addTheologyTagIds: theologyIds,
        note: input.note?.trim() || null,
      },
    })

    return NextResponse.json({ id: suggestion.id }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
