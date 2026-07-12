import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"

// The other half of "resolve" for an unmatched listing — the admin has
// looked at it and decided it's not worth turning into a church (an
// org/diocese page rather than a congregation, too sparse to use, etc).
// The record is kept, never deleted, just hidden from the queue.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireModerator()
    const { id } = await params

    const source = await prisma.churchSource.findUnique({ where: { id } })
    if (!source) throw new ApiError(404, "Source not found.")
    if (source.churchId) throw new ApiError(409, "This source is already linked to a church.")

    await prisma.churchSource.update({
      where: { id },
      data: { dismissedAt: new Date(), dismissedById: admin.id },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
