import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { churchQuerySchema } from "@/lib/validations"
import { churchIncludeForShaping, toChurchSummary, type ChurchWithRelations } from "@/lib/church-shapes"
import { jsonError } from "@/lib/api-utils"

// Special "Experience" filters describe a computed outcome (map status, respect
// rate), not a stored tag, so they're matched after aggregation rather than in SQL.
const COMPUTED_EXPERIENCE_FILTERS: Record<
  string,
  (summary: ReturnType<typeof toChurchSummary>) => boolean
> = {
  "safe to visit": (s) => s.status === "positive",
  "respectful community": (s) => (s.transparency.respected ?? 0) >= 80,
  "mixed experiences": (s) => s.status === "mixed",
  "lgbtq support group": (s) => s.theology.includes("Fully Affirming"),
}

export async function GET(req: NextRequest) {
  try {
    const parsed = churchQuerySchema.safeParse({
      ...Object.fromEntries(req.nextUrl.searchParams),
      tags: req.nextUrl.searchParams.getAll("tags"),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { q, tags, north, south, east, west, page, pageSize } = parsed.data

    const where: Prisma.ChurchWhereInput = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { denomination: { contains: q, mode: "insensitive" } },
              { zip: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(north !== undefined && south !== undefined ? { lat: { lte: north, gte: south } } : {}),
      ...(east !== undefined && west !== undefined ? { lng: { lte: east, gte: west } } : {}),
    }

    const churches = await prisma.church.findMany({
      where,
      include: churchIncludeForShaping,
      orderBy: { name: "asc" },
    })

    let summaries = churches.map((c) => toChurchSummary(c as unknown as ChurchWithRelations))

    if (tags.length > 0) {
      const haystackFor = (s: ReturnType<typeof toChurchSummary>) =>
        [s.denomination, ...s.theology, ...s.accessibility, ...s.worship, ...s.community, ...s.mentalHealth]
          .join(" ")
          .toLowerCase()

      summaries = summaries.filter((s) => {
        const haystack = haystackFor(s)
        return tags.every((tag) => {
          const key = tag.toLowerCase()
          const computed = COMPUTED_EXPERIENCE_FILTERS[key]
          if (computed) return computed(s)
          return haystack.includes(key)
        })
      })
    }

    const total = summaries.length
    const start = (page - 1) * pageSize
    const paged = summaries.slice(start, start + pageSize)

    return NextResponse.json({ churches: paged, total, page, pageSize })
  } catch (error) {
    return jsonError(error)
  }
}
