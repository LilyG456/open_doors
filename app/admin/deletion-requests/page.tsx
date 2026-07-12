import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminNav } from "@/components/admin/admin-nav"
import { DeletionRequestQueue } from "@/components/admin/deletion-request-queue"

export const metadata = {
  title: "Deletion Requests · Open Doors Admin",
}

// ADMIN-only, unlike most of the other queues — a moderator can request a
// deletion (see app/api/admin/churches/[id]/request-deletion) but reviewing
// and approving one performs the actual irreversible delete, so it stays
// gated the same as the direct delete flow.
export default async function DeletionRequestsPage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/deletion-requests")
  if (session.user.role !== "ADMIN") redirect("/")

  const requests = await prisma.churchDeletionRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      church: { select: { name: true, slug: true, _count: { select: { experiences: true, savedBy: true } } } },
      requestedBy: { select: { displayName: true } },
    },
  })

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="/admin/deletion-requests" role={session.user.role} />
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Deletion Requests</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Churches a moderator has flagged for removal — nothing is deleted until you approve it here.{" "}
        {requests.length} waiting for review.
      </p>

      <div className="mt-8">
        <DeletionRequestQueue
          rows={requests.map((r) => ({
            id: r.id,
            church: { name: r.church.name, slug: r.church.slug },
            reason: r.reason,
            requestedByName: r.requestedBy?.displayName ?? null,
            counts: { experiences: r.church._count.experiences, savedBy: r.church._count.savedBy },
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  )
}
