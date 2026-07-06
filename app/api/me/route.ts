import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { profileUpdateSchema } from "@/lib/validations"
import { jsonError, requireUser, resolveIdentityIds } from "@/lib/api-utils"

export async function GET() {
  try {
    const user = await requireUser()
    const profile = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        identities: { select: { identity: { select: { label: true } } } },
      },
    })
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      identities: profile.identities.map((i) => i.identity.label),
    })
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { displayName, identities } = parsed.data

    if (identities) {
      const identityIds = await resolveIdentityIds(prisma, identities)
      await prisma.$transaction([
        prisma.userIdentity.deleteMany({ where: { userId: user.id } }),
        prisma.userIdentity.createMany({
          data: identityIds.map((identityId) => ({ userId: user.id, identityId })),
        }),
      ])
    }

    if (displayName !== undefined) {
      await prisma.user.update({ where: { id: user.id }, data: { displayName } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
