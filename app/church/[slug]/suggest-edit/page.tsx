import { notFound, permanentRedirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { SuggestEditForm } from "@/components/church/suggest-edit-form"
import { PencilLine } from "lucide-react"

// See app/church/[slug]/page.tsx for why this falls back to previousSlugs.
async function findChurchBySlug(slug: string) {
  const include = { tags: { select: { tag: { select: { id: true } } } } } as const
  const direct = await prisma.church.findUnique({ where: { slug }, include })
  if (direct) return { record: direct, redirectTo: null as string | null }

  const renamed = await prisma.church.findFirst({ where: { previousSlugs: { has: slug } }, include })
  if (renamed) return { record: renamed, redirectTo: renamed.slug }

  return { record: null, redirectTo: null }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { record: church } = await findChurchBySlug(slug)
  return { title: church ? `Suggest an edit · ${church.name} · Open Doors` : "Suggest an edit · Open Doors" }
}

export default async function SuggestEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()

  const { record: church, redirectTo } = await findChurchBySlug(slug)
  if (redirectTo) permanentRedirect(`/church/${redirectTo}/suggest-edit`)
  if (!church) notFound()

  const attachedTagIds = new Set(church.tags.map((t) => t.tag.id))
  const allTags = await prisma.tag.findMany({ orderBy: { label: "asc" } })
  const availableTagsByCategory = {
    ACCESSIBILITY: allTags.filter((t) => t.category === "ACCESSIBILITY" && !attachedTagIds.has(t.id)),
    WORSHIP: allTags.filter((t) => t.category === "WORSHIP" && !attachedTagIds.has(t.id)),
    COMMUNITY: allTags.filter((t) => t.category === "COMMUNITY" && !attachedTagIds.has(t.id)),
    MENTAL_HEALTH: allTags.filter((t) => t.category === "MENTAL_HEALTH" && !attachedTagIds.has(t.id)),
    THEOLOGY: allTags.filter((t) => t.category === "THEOLOGY" && !attachedTagIds.has(t.id)),
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <div className="mb-8 text-center">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-sage-soft text-primary">
          <PencilLine className="size-5" />
        </span>
        <h1 className="mt-4 text-balance font-serif text-3xl font-semibold text-foreground">
          Suggest an edit
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          Spot outdated contact info, a missing accessibility feature, or a program we don&apos;t have listed for{" "}
          {church.name}? Suggest a correction here — this is for facts about the church, not a personal
          experience (share one of those{" "}
          <Link href={`/share?church=${church.slug}`} className="text-blue underline-offset-2 hover:underline">
            here
          </Link>{" "}
          instead). An admin reviews every suggestion before anything changes on the page.
        </p>
      </div>

      {!session?.user ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in to suggest an edit — it keeps the queue accountable without collecting your name.
          </p>
          <Link
            href={`/signin?callbackUrl=/church/${church.slug}/suggest-edit`}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Sign in to continue
          </Link>
        </div>
      ) : (
        <SuggestEditForm church={church} availableTagsByCategory={availableTagsByCategory} />
      )}
    </div>
  )
}
