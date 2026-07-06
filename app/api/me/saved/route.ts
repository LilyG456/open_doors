import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchIncludeForShaping, toChurchSummary, type ChurchWithRelations } from "@/lib/church-shapes"
import { jsonError, requireUser } from "@/lib/api-utils"

export async function GET() {
  try {
    const user = await requireUser()
    const saved = await prisma.savedChurch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { church: { include: churchIncludeForShaping } },
    })
    return NextResponse.json({
      churches: saved.map((s) => toChurchSummary(s.church as unknown as ChurchWithRelations)),
    })
  } catch (error) {
    return jsonError(error)
  }
}
