import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { churchFactsSchema } from "@/lib/validations"
import { jsonError, ApiError, requireModerator } from "@/lib/api-utils"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModerator()
    const { id } = await params

    const church = await prisma.church.findUnique({ where: { id }, select: { id: true, slug: true, previousSlugs: true } })
    if (!church) throw new ApiError(404, "Church not found.")

    const body = await req.json()
    const parsed = churchFactsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const slugTaken = await prisma.church.findFirst({
      where: { slug: input.slug, NOT: { id } },
      select: { id: true },
    })
    if (slugTaken) throw new ApiError(409, "That URL slug is already used by another church.")

    // Record the outgoing slug so old bookmarks/shared links/search results
    // redirect to the new URL instead of 404ing — see app/church/[slug]/page.tsx.
    const renamed = input.slug !== church.slug
    const previousSlugs = renamed
      ? [...church.previousSlugs.filter((s) => s !== input.slug), church.slug]
      : church.previousSlugs

    const updated = await prisma.church.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        previousSlugs,
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

    return NextResponse.json({ id: updated.id, slug: updated.slug })
  } catch (error) {
    return jsonError(error)
  }
}
