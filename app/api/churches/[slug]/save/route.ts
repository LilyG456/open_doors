import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, ApiError, requireUser } from "@/lib/api-utils"

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser()
    const { slug } = await params

    const church = await prisma.church.findUnique({ where: { slug }, select: { id: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const existing = await prisma.savedChurch.findUnique({
      where: { userId_churchId: { userId: user.id, churchId: church.id } },
    })

    if (existing) {
      await prisma.savedChurch.delete({
        where: { userId_churchId: { userId: user.id, churchId: church.id } },
      })
      return NextResponse.json({ saved: false })
    }

    await prisma.savedChurch.create({ data: { userId: user.id, churchId: church.id } })
    return NextResponse.json({ saved: true })
  } catch (error) {
    return jsonError(error)
  }
}
