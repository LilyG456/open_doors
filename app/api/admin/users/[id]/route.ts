import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { userRoleUpdateSchema } from "@/lib/validations"
import { jsonError, ApiError, requireAdmin } from "@/lib/api-utils"

// ADMIN-only, same as the page that calls this (app/admin/users). Deliberately
// blocks changing your own role — the only way to lock every admin out of
// this page would be an admin demoting themselves with no one else to fix
// it; scripts/set-user-role.ts remains the escape hatch for that edge case.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    if (id === admin.id) throw new ApiError(400, "You can't change your own role.")

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!user) throw new ApiError(404, "User not found.")

    const body = await req.json()
    const parsed = userRoleUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const updated = await prisma.user.update({ where: { id }, data: { role: parsed.data.role } })
    return NextResponse.json({ id: updated.id, role: updated.role })
  } catch (error) {
    return jsonError(error)
  }
}
