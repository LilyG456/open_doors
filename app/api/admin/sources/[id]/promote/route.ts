import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"
import { promoteOrphanToChurch } from "@/lib/church-merge"

// "Resolve" action for an unmatched listing in /admin/merge-queue — the
// admin has looked at it and decided it's a genuinely new church (not a
// duplicate of anything else), so create a canonical Church from it
// directly rather than leaving it to sit as an orphan indefinitely.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireModerator()
    const { id } = await params

    const source = await prisma.churchSource.findUnique({ where: { id } })
    if (!source) throw new ApiError(404, "Source not found.")
    if (source.churchId) throw new ApiError(409, "This source is already linked to a church.")
    if (source.lat === null || source.lng === null) {
      throw new ApiError(400, "This listing has no coordinates, so it can't become a church yet — edit it with a location first.")
    }

    const result = await promoteOrphanToChurch(prisma, source, { setById: admin.id })
    return NextResponse.json(result)
  } catch (error) {
    return jsonError(error)
  }
}
