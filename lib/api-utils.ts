import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error(error)
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
}

export async function requireUser() {
  const session = await auth()
  if (!session?.user) throw new ApiError(401, "Sign in to continue.")
  return session.user
}

export async function requireModerator() {
  const user = await requireUser()
  if (user.role !== "MODERATOR" && user.role !== "ADMIN") {
    throw new ApiError(403, "You don't have permission to do that.")
  }
  return user
}

// Denominational Context is reference data that shapes what every visitor
// reads about a whole tradition, not a single piece of content — reserved
// for admins rather than the broader moderator role.
export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "You don't have permission to do that.")
  }
  return user
}

/** Only resolves labels against the seeded, moderated identity taxonomy — never creates new ones on the fly. */
export async function resolveIdentityIds(prisma: import("@prisma/client").PrismaClient, labels: string[]) {
  if (labels.length === 0) return [] as string[]
  const matches = await prisma.identity.findMany({
    where: { label: { in: labels } },
    select: { id: true },
  })
  return matches.map((m) => m.id)
}
