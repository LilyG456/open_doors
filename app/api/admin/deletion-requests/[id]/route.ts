import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deletionRequestDecisionSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

// Reviewing a moderator's deletion request. ADMIN-only, same as the direct
// delete flow (app/api/admin/churches/[id]/delete) this ultimately calls —
// a request is just a detour through review, not a lower bar for the
// irreversible action itself.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    const body = await req.json()
    const parsed = deletionRequestDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const request = await prisma.churchDeletionRequest.findUnique({ where: { id }, include: { church: true } })
    if (!request) throw new ApiError(404, "Deletion request not found.")
    if (request.status !== "PENDING") throw new ApiError(409, "This request was already reviewed.")

    if (parsed.data.decision === "DISMISS") {
      await prisma.churchDeletionRequest.update({
        where: { id },
        data: { status: "DISMISSED", reviewedById: admin.id, reviewedAt: new Date() },
      })
      return NextResponse.json({ status: "DISMISSED" })
    }

    // Approving deletes the church, which cascades away this request row
    // too (onDelete: Cascade on churchId) — so the status/reviewedBy update
    // happens first, in the same transaction, purely for the audit trail if
    // anything ever queries requests by church history before the cascade.
    const name = request.church.name
    await prisma.$transaction([
      prisma.churchDeletionRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
      }),
      prisma.church.delete({ where: { id: request.churchId } }),
    ])

    return NextResponse.json({ status: "APPROVED", name })
  } catch (error) {
    return jsonError(error)
  }
}
