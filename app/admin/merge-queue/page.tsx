import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminNav } from "@/components/admin/admin-nav"
import { MergeCandidateQueue } from "@/components/admin/merge-candidate-queue"
import { UnmatchedListingsQueue } from "@/components/admin/unmatched-listings-queue"

export const metadata = {
  title: "Merge Queue · Open Doors Admin",
}

function toSourceInfo(source: {
  id: string
  sourceType: string
  confidence: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  website: string | null
  phone: string | null
  denomination: string | null
  serviceTimes: string[]
  church: { slug: string } | null
}) {
  return {
    id: source.id,
    sourceType: source.sourceType,
    confidence: source.confidence,
    name: source.name,
    address: source.address,
    city: source.city,
    state: source.state,
    zip: source.zip,
    website: source.website,
    phone: source.phone,
    denomination: source.denomination,
    serviceTimes: source.serviceTimes,
    churchSlug: source.church?.slug ?? null,
  }
}

export default async function MergeQueuePage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/merge-queue")
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") redirect("/")

  const [candidates, unmatchedOrphans] = await Promise.all([
    prisma.churchMergeCandidate.findMany({
      where: { status: "PENDING" },
      orderBy: { score: "desc" },
      include: {
        sourceA: { include: { church: { select: { slug: true } } } },
        sourceB: { include: { church: { select: { slug: true } } } },
      },
    }),
    prisma.churchSource.findMany({
      where: {
        churchId: null,
        dismissedAt: null,
        mergeCandidatesA: { none: { status: "PENDING" } },
        mergeCandidatesB: { none: { status: "PENDING" } },
      },
      orderBy: { fetchedAt: "desc" },
      select: { id: true, name: true, city: true, state: true, sourceType: true, fetchedAt: true, lat: true, lng: true },
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="/admin/merge-queue" role={session.user.role} />
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Merge Queue</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Possible duplicate church listings found by the matching pipeline. {candidates.length} waiting for review.
        Accepting merges the two records (keeping every field&apos;s higher-confidence source); rejecting keeps them
        separate for good — this pairing won&apos;t be suggested again.
      </p>

      <div className="mt-8">
        <MergeCandidateQueue
          rows={candidates.map((c) => ({
            id: c.id,
            score: c.score,
            sourceA: toSourceInfo(c.sourceA),
            sourceB: toSourceInfo(c.sourceB),
          }))}
        />
      </div>

      {unmatchedOrphans.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-lg font-semibold text-foreground">Unmatched listings</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            No likely match was found for these. Resolve each one: create a new church from it if it&apos;s a
            genuine congregation, or dismiss it if it isn&apos;t (an organization page, a duplicate that will never
            geocode, too sparse to use). Nothing is deleted either way — dismissing just hides it from this list.
          </p>
          <div className="mt-3">
            <UnmatchedListingsQueue
              rows={unmatchedOrphans.map((o) => ({
                id: o.id,
                name: o.name,
                city: o.city,
                state: o.state,
                sourceType: o.sourceType,
                hasCoords: o.lat !== null && o.lng !== null,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  )
}
