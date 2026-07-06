import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchIncludeForShaping, toChurchDetail, type ChurchWithRelations } from "@/lib/church-shapes"
import { jsonError, ApiError } from "@/lib/api-utils"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const church = await prisma.church.findUnique({
      where: { slug },
      include: churchIncludeForShaping,
    })
    if (!church) throw new ApiError(404, "Church not found.")

    return NextResponse.json(toChurchDetail(church as unknown as ChurchWithRelations))
  } catch (error) {
    return jsonError(error)
  }
}
