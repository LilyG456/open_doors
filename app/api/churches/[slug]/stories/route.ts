import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { experienceSubmitSchema } from "@/lib/validations"
import { jsonError, ApiError, requireUser, resolveIdentityIds } from "@/lib/api-utils"
import { formatRelativeTime } from "@/lib/aggregation"
import { evaluateSubmission, RATE_LIMIT_WINDOW_MINUTES } from "@/lib/moderation"

const MEMBER_STATUS_LABEL: Record<string, string> = {
  VISITOR: "Visitor",
  REGULAR_ATTENDER: "Regular Attender",
  CURRENT_MEMBER: "Current Member",
  FORMER_MEMBER: "Former Member",
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const session = await auth()

    const church = await prisma.church.findUnique({ where: { slug }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const experiences = await prisma.experience.findMany({
      where: { churchId: church.id, moderationStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: {
        identities: { include: { identity: true } },
        helpfulVotes: { where: { userId: session?.user?.id ?? "__anonymous__" } },
        _count: { select: { helpfulVotes: true } },
      },
    })

    return NextResponse.json({
      stories: experiences.map((e) => ({
        id: e.id,
        name: e.displayName,
        visits: e.visitLabel,
        status: MEMBER_STATUS_LABEL[e.memberStatus],
        identities: e.identities.map((i) => i.identity.label),
        text: e.text,
        helpful: e._count.helpfulVotes,
        votedByMe: e.helpfulVotes.length > 0,
        timeAgo: formatRelativeTime(e.createdAt),
      })),
    })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser()
    const { slug } = await params

    const church = await prisma.church.findUnique({ where: { slug }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const body = await req.json()
    const parsed = experienceSubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const recentSubmissionCount = await prisma.experience.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000) },
      },
    })
    const { autoHold, reason } = evaluateSubmission(input.text, recentSubmissionCount)

    const identityIds = await resolveIdentityIds(prisma, input.identities)
    const displayName = input.isAnonymous ? "Anonymous" : (input.displayName?.trim() || "Anonymous")

    const experience = await prisma.experience.create({
      data: {
        churchId: church.id,
        userId: user.id,
        displayName,
        visitLabel: input.visitLabel,
        memberStatus: input.memberStatus,
        text: input.text,
        feltSafe: input.feltSafe ?? null,
        feltRespected: input.feltRespected ?? null,
        wouldReturn: input.wouldReturn ?? null,
        lgbtqExperience: input.lgbtqExperience ?? null,
        womenInLeadership: input.womenInLeadership ?? null,
        accessibilityRating: input.accessibilityRating ?? null,
        mentalHealthRating: input.mentalHealthRating ?? null,
        moderationStatus: autoHold ? "PENDING" : "APPROVED",
        moderationNote: reason,
        identities: { create: identityIds.map((identityId) => ({ identityId })) },
      },
    })

    return NextResponse.json(
      {
        id: experience.id,
        moderationStatus: experience.moderationStatus,
        message: autoHold
          ? "Thanks for sharing. Your story was automatically held for a quick review before it goes public."
          : "Thank you for sharing — your story is live now.",
      },
      { status: 201 },
    )
  } catch (error) {
    return jsonError(error)
  }
}
