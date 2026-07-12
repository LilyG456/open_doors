import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchDeletionRequestSchema } from "@/lib/validations"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"

// A MODERATOR can't delete a church directly (see
// app/api/admin/churches/[id]/delete, still ADMIN-only) — this just flags
// it for an admin to review at /admin/deletion-requests. An ADMIN can also
// hit this (requireModerator allows both), though they'd normally just use
// the direct delete flow instead.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModerator()
    const { id } = await params

    const church = await prisma.church.findUnique({ where: { id }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const existing = await prisma.churchDeletionRequest.findFirst({ where: { churchId: id, status: "PENDING" } })
    if (existing) throw new ApiError(409, "A deletion request is already pending for this church.")

    const body = await req.json()
    const parsed = churchDeletionRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const request = await prisma.churchDeletionRequest.create({
      data: { churchId: id, reason: parsed.data.reason, requestedById: user.id },
    })

    return NextResponse.json({ id: request.id }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
