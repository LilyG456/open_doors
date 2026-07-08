import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChurchEditQueue } from "@/components/admin/church-edit-queue"
import { AdminNav } from "@/components/admin/admin-nav"

export const metadata = {
  title: "Church Edit Queue · Open Doors Admin",
}

export default async function ChurchEditQueuePage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/church-edit-queue")
  if (session.user.role !== "ADMIN") redirect("/")

  const [suggestions, allTags] = await Promise.all([
    prisma.churchEditSuggestion.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        church: { select: { name: true, slug: true, website: true, address: true, city: true, serviceTimes: true, summary: true } },
        submittedBy: { select: { displayName: true } },
      },
    }),
    prisma.tag.findMany({ select: { id: true, label: true } }),
  ])

  const tagLabelById = new Map(allTags.map((t) => [t.id, t.label]))

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="/admin/church-edit-queue" />
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Church Edit Queue</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Community-submitted corrections to church facts — address, website, service times, tags — as distinct
        from personal experiences. {suggestions.length} waiting for review.
      </p>

      <div className="mt-8">
        <ChurchEditQueue
          rows={suggestions.map((s) => ({
            id: s.id,
            church: s.church,
            submitterDisplayName: s.submittedBy.displayName,
            submitterRole: s.submitterRole,
            website: s.website,
            address: s.address,
            city: s.city,
            serviceTimes: s.serviceTimes,
            summary: s.summary,
            addedTagLabels: [
              ...s.addAccessibilityTagIds,
              ...s.addWorshipTagIds,
              ...s.addCommunityTagIds,
              ...s.addMentalHealthTagIds,
              ...s.addTheologyTagIds,
            ].map((tagId) => tagLabelById.get(tagId) ?? "(removed tag)"),
            note: s.note,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  )
}
