import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"
import { performMerge } from "@/lib/church-merge"
import { suggestionDecisionSchema } from "@/lib/validations"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireModerator()
    const { id } = await params

    const body = await req.json()
    const parsed = suggestionDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const candidate = await prisma.churchMergeCandidate.findUnique({
      where: { id },
      include: { sourceA: true, sourceB: true },
    })
    if (!candidate) throw new ApiError(404, "Merge candidate not found.")
    if (candidate.status !== "PENDING") throw new ApiError(409, "This candidate was already reviewed.")

    if (parsed.data.decision === "REJECT") {
      await prisma.churchMergeCandidate.update({
        where: { id },
        data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
      })
      return NextResponse.json({ status: "REJECTED" })
    }

    const merged = await performMerge(prisma, candidate.sourceA, candidate.sourceB, { setById: admin.id })
    await prisma.churchMergeCandidate.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
    })
    return NextResponse.json({ status: "APPROVED", ...merged })
  } catch (error) {
    return jsonError(error)
  }
}
