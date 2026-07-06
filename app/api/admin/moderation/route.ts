import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, requireModerator } from "@/lib/api-utils"

export async function GET() {
  try {
    await requireModerator()

    // Two ways something lands in the queue: auto-held at submission time
    // (PENDING), or already public but reported by other members. Reports
    // never hide content on their own — see the Report model's comment —
    // so a moderator always makes the final call either way.
    const [autoHeld, reported] = await Promise.all([
      prisma.experience.findMany({
        where: { moderationStatus: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          church: { select: { name: true, slug: true } },
          identities: { include: { identity: true } },
          reports: true,
        },
      }),
      prisma.experience.findMany({
        where: { moderationStatus: "APPROVED", reports: { some: {} } },
        orderBy: { createdAt: "asc" },
        include: {
          church: { select: { name: true, slug: true } },
          identities: { include: { identity: true } },
          reports: true,
        },
      }),
    ])

    const shape = (e: (typeof autoHeld)[number], queueReason: "auto-held" | "reported") => ({
      id: e.id,
      queueReason,
      autoHoldReason: e.moderationNote,
      church: e.church,
      displayName: e.displayName,
      visitLabel: e.visitLabel,
      memberStatus: e.memberStatus,
      text: e.text,
      identities: e.identities.map((i) => i.identity.label),
      feltSafe: e.feltSafe,
      feltRespected: e.feltRespected,
      wouldReturn: e.wouldReturn,
      lgbtqExperience: e.lgbtqExperience,
      womenInLeadership: e.womenInLeadership,
      accessibilityRating: e.accessibilityRating,
      mentalHealthRating: e.mentalHealthRating,
      reports: e.reports.map((r) => r.reason),
      createdAt: e.createdAt,
    })

    return NextResponse.json({
      experiences: [
        ...autoHeld.map((e) => shape(e, "auto-held")),
        ...reported.map((e) => shape(e, "reported")),
      ],
    })
  } catch (error) {
    return jsonError(error)
  }
}
