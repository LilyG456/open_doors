import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

// Deliberately its own /delete sub-route rather than DELETE on
// /api/admin/churches/[id] directly — this is the one irreversible action on
// a church (cascades to its experiences, saved-by records, tags, and
// verification), so it gets a distinct, harder-to-hit-by-accident endpoint.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const church = await prisma.church.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    await prisma.church.delete({ where: { id } })

    return NextResponse.json({ ok: true, name: church.name })
  } catch (error) {
    return jsonError(error)
  }
}
