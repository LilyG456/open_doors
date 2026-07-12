import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminNav } from "@/components/admin/admin-nav"
import { UserRoleTable } from "@/components/admin/user-role-table"

export const metadata = {
  title: "Users · Open Doors Admin",
}

const PAGE_SIZE = 50

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/users")
  if (session.user.role !== "ADMIN") redirect("/")

  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ""
  const page = Math.max(1, Number(pageParam) || 1)

  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { displayName: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, email: true, displayName: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const qParam = query ? `q=${encodeURIComponent(query)}&` : ""

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="/admin/users" role={session.user.role} />
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Users</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Grant or revoke Moderator and Admin access. {total} {total === 1 ? "account" : "accounts"} total.
      </p>

      <form action="/admin/users" method="GET" className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by email or name"
          className="h-11 w-full max-w-sm rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </form>

      <div className="mt-6">
        <UserRoleTable
          currentUserId={session.user.id}
          rows={users.map((u) => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
          }))}
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          {page > 1 ? (
            <Link href={`/admin/users?${qParam}page=${page - 1}`} className="font-medium text-foreground hover:underline">
              &larr; Previous
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/admin/users?${qParam}page=${page + 1}`} className="font-medium text-foreground hover:underline">
              Next &rarr;
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}
