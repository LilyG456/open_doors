import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireUser } from "@/lib/api-utils"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params

    const experience = await prisma.experience.findUnique({
      where: { id },
      select: { id: true, moderationStatus: true },
    })
    if (!experience || experience.moderationStatus !== "APPROVED") {
      throw new ApiError(404, "Story not found.")
    }

    const existing = await prisma.helpfulVote.findUnique({
      where: { userId_experienceId: { userId: user.id, experienceId: id } },
    })

    if (existing) {
      await prisma.helpfulVote.delete({
        where: { userId_experienceId: { userId: user.id, experienceId: id } },
      })
    } else {
      await prisma.helpfulVote.create({ data: { userId: user.id, experienceId: id } })
    }

    const helpful = await prisma.helpfulVote.count({ where: { experienceId: id } })

    return NextResponse.json({ helpful, votedByMe: !existing })
  } catch (error) {
    return jsonError(error)
  }
}
