import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { churchIncludeForShaping, toChurchDetail, type ChurchWithRelations } from "@/lib/church-shapes"
import { formatRelativeTime } from "@/lib/aggregation"
import type { Story } from "@/lib/types"
import { ChurchHeader } from "@/components/church/church-header"
import { CommunitySnapshot } from "@/components/church/community-snapshot"
import { TheologyCard } from "@/components/church/theology-card"
import { TransparencySection } from "@/components/church/transparency-section"
import { VisitorStories } from "@/components/church/visitor-stories"
import { ArrowLeft } from "lucide-react"

const MEMBER_STATUS_LABEL: Record<string, Story["status"]> = {
  VISITOR: "Visitor",
  REGULAR_ATTENDER: "Regular Attender",
  CURRENT_MEMBER: "Current Member",
  FORMER_MEMBER: "Former Member",
}

async function getChurch(slug: string) {
  const church = await prisma.church.findUnique({
    where: { slug },
    include: churchIncludeForShaping,
  })
  return church ? toChurchDetail(church as unknown as ChurchWithRelations) : null
}

async function getStories(churchId: string, userId: string | undefined): Promise<Story[]> {
  const experiences = await prisma.experience.findMany({
    where: { churchId, moderationStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      identities: { include: { identity: true } },
      helpfulVotes: { where: { userId: userId ?? "__anonymous__" } },
      _count: { select: { helpfulVotes: true } },
    },
  })

  return experiences.map((e) => ({
    id: e.id,
    name: e.displayName,
    visits: e.visitLabel,
    status: MEMBER_STATUS_LABEL[e.memberStatus],
    identities: e.identities.map((i) => i.identity.label),
    text: e.text,
    helpful: e._count.helpfulVotes,
    votedByMe: e.helpfulVotes.length > 0,
    timeAgo: formatRelativeTime(e.createdAt),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const church = await getChurch(slug)
  if (!church) return { title: "Church not found · Open Doors" }
  return {
    title: `${church.name} · Open Doors`,
    description: church.summary ?? undefined,
  }
}

export default async function ChurchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  const churchRecord = await prisma.church.findUnique({
    where: { slug },
    include: churchIncludeForShaping,
  })
  if (!churchRecord) notFound()

  const church = toChurchDetail(churchRecord as unknown as ChurchWithRelations)
  const stories = await getStories(churchRecord.id, session?.user?.id)

  const initiallySaved = session?.user
    ? Boolean(
        await prisma.savedChurch.findUnique({
          where: { userId_churchId: { userId: session.user.id, churchId: churchRecord.id } },
        }),
      )
    : false

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6">
        <Link
          href="/explore"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Explore
        </Link>

        <ChurchHeader church={church} initiallySaved={initiallySaved} />

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-3">
            <CommunitySnapshot metrics={church.snapshot} />
            <VisitorStories stories={stories} churchSlug={church.slug} />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-2">
            <TheologyCard church={church} />
            <TransparencySection church={church} />
          </div>
        </div>
    </div>
  )
}
