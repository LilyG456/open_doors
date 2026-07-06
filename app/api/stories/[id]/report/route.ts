import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reportSchema } from "@/lib/validations"
import { jsonError, ApiError, requireUser } from "@/lib/api-utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params

    const experience = await prisma.experience.findUnique({
      where: { id },
      select: { id: true, moderationStatus: true },
    })
    if (!experience || experience.moderationStatus === "REJECTED") {
      throw new ApiError(404, "Story not found.")
    }

    const body = await req.json()
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { reason, details } = parsed.data

    // Reports never change moderationStatus themselves — they only surface
    // the story in the admin dashboard. See prisma/schema.prisma Report model.
    await prisma.report.upsert({
      where: { experienceId_userId: { experienceId: id, userId: user.id } },
      update: { reason: details ? `${reason}: ${details}` : reason },
      create: {
        experienceId: id,
        userId: user.id,
        reason: details ? `${reason}: ${details}` : reason,
      },
    })

    return NextResponse.json({ reported: true })
  } catch (error) {
    return jsonError(error)
  }
}
