import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchCreateSchema } from "@/lib/validations"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"

export async function POST(req: NextRequest) {
  try {
    await requireModerator()

    const body = await req.json()
    const parsed = churchCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const slugTaken = await prisma.church.findUnique({ where: { slug: input.slug }, select: { id: true } })
    if (slugTaken) throw new ApiError(409, "That URL slug is already used by another church.")

    if (input.denominationId) {
      const denomination = await prisma.denomination.findUnique({
        where: { id: input.denominationId },
        select: { id: true },
      })
      if (!denomination) throw new ApiError(404, "Denomination not found.")
    }

    const church = await prisma.church.create({
      data: {
        name: input.name,
        slug: input.slug,
        denomination: input.denomination,
        denominationId: input.denominationId ?? null,
        address: input.address,
        city: input.city,
        state: input.state?.trim() || null,
        zip: input.zip?.trim() || null,
        lat: input.lat,
        lng: input.lng,
        website: input.website ?? null,
        serviceTimes: input.serviceTimes,
        attendance: input.attendance?.trim() || null,
        coverImage: input.coverImage?.trim() || null,
        logoImage: input.logoImage?.trim() || null,
        summary: input.summary?.trim() || null,
      },
    })

    return NextResponse.json({ id: church.id, slug: church.slug }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
