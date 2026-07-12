import Link from "next/link"
import { ThumbsUp, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatRelativeTime } from "@/lib/aggregation"

// New stories get approved continuously, so don't freeze this at build time.
// Not ISR (revalidate) — see app/page.tsx's comment on why that still
// queries the DB from the build environment, which platforms like Railway
// can't reach.
export const dynamic = "force-dynamic"

export const metadata = {
  title: "Stories · Open Doors",
  description:
    "Real experiences from real people. Explore visitor stories to understand what belonging can feel like.",
}

const MEMBER_STATUS_LABEL: Record<string, string> = {
  VISITOR: "Visitor",
  REGULAR_ATTENDER: "Regular Attender",
  CURRENT_MEMBER: "Current Member",
  FORMER_MEMBER: "Former Member",
}

async function getStories() {
  const experiences = await prisma.experience.findMany({
    where: { moderationStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      church: { select: { name: true, slug: true } },
      identities: { include: { identity: true } },
      _count: { select: { helpfulVotes: true } },
    },
  })

  return experiences
    .map((e) => ({
      id: e.id,
      name: e.displayName,
      visits: e.visitLabel,
      status: MEMBER_STATUS_LABEL[e.memberStatus],
      identities: e.identities.map((i) => i.identity.label),
      text: e.text,
      helpful: e._count.helpfulVotes,
      timeAgo: formatRelativeTime(e.createdAt),
      churchName: e.church.name,
      churchSlug: e.church.slug,
    }))
    .sort((a, b) => b.helpful - a.helpful)
}

export default async function StoriesPage() {
  const allStories = await getStories()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        <div className="mb-8 text-center">
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            Visitor Stories
          </span>
          <h1 className="mt-2 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Belonging, in people&apos;s own words
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            These are personal experiences, not reviews or ratings. Each one is a single
            perspective—together they help paint a fuller, more honest picture.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {allStories.map((story) => (
            <article
              key={`${story.churchSlug}-${story.id}`}
              className="rounded-3xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                    {story.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{story.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {story.status} · {story.visits}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{story.timeAgo}</span>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {story.identities.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center rounded-full bg-secondary/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {id}
                  </span>
                ))}
              </div>

              <p className="mb-4 text-sm leading-relaxed text-foreground">{story.text}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <Link
                  href={`/church/${story.churchSlug}`}
                  className="text-sm font-medium text-muted-blue underline-offset-2 hover:underline"
                >
                  {story.churchName}
                </Link>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <ThumbsUp className="size-3.5" />
                    {story.helpful} found helpful
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    Similar
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
    </div>
  )
}
