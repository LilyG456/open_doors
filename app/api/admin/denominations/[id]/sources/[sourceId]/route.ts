import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  try {
    await requireAdmin()
    const { id, sourceId } = await params

    const source = await prisma.denominationSource.findUnique({ where: { id: sourceId } })
    if (!source || source.denominationId !== id) throw new ApiError(404, "Source not found.")

    await prisma.denominationSource.delete({ where: { id: sourceId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
