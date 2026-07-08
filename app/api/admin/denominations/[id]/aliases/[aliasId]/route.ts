import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; aliasId: string }> },
) {
  try {
    await requireAdmin()
    const { id, aliasId } = await params

    const alias = await prisma.denominationAlias.findUnique({ where: { id: aliasId } })
    if (!alias || alias.denominationId !== id) throw new ApiError(404, "Alias not found.")

    await prisma.denominationAlias.delete({ where: { id: aliasId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
