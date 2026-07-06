import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { moderationDecisionSchema } from "@/lib/validations"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModerator()
    const { id } = await params

    const body = await req.json()
    const parsed = moderationDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const experience = await prisma.experience.findUnique({ where: { id }, select: { id: true } })
    if (!experience) throw new ApiError(404, "Story not found.")

    // A decision — either way — counts as "reviewed," so clear any reports
    // that brought this into the queue. If a moderator approves (keeps it
    // public), dismissing the reports takes it off the reported queue. If
    // they reject, the reports are moot since the story is now hidden.
    const [updated] = await prisma.$transaction([
      prisma.experience.update({
        where: { id },
        data: { moderationStatus: parsed.data.decision, moderationNote: parsed.data.note ?? null },
      }),
      prisma.report.deleteMany({ where: { experienceId: id } }),
    ])

    return NextResponse.json({ id: updated.id, moderationStatus: updated.moderationStatus })
  } catch (error) {
    return jsonError(error)
  }
}
