import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { denominationSourceSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const denomination = await prisma.denomination.findUnique({ where: { id }, select: { id: true } })
    if (!denomination) throw new ApiError(404, "Denomination not found.")

    const body = await req.json()
    const parsed = denominationSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const source = await prisma.denominationSource.create({
      data: { denominationId: id, url: parsed.data.url, label: parsed.data.label ?? null },
    })

    return NextResponse.json({ id: source.id }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
