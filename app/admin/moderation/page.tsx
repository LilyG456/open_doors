import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ModerationQueue } from "@/components/admin/moderation-queue"
import { AdminNav } from "@/components/admin/admin-nav"

export const metadata = {
  title: "Moderation Queue · Open Doors",
}

const include = {
  church: { select: { name: true, slug: true } },
  identities: { include: { identity: true } },
  reports: true,
} as const

export default async function ModerationPage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/moderation")
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") redirect("/")

  const [autoHeld, reported] = await Promise.all([
    prisma.experience.findMany({ where: { moderationStatus: "PENDING" }, orderBy: { createdAt: "asc" }, include }),
    prisma.experience.findMany({
      where: { moderationStatus: "APPROVED", reports: { some: {} } },
      orderBy: { createdAt: "asc" },
      include,
    }),
  ])

  function shape(e: (typeof autoHeld)[number], queueReason: "auto-held" | "reported") {
    return {
      id: e.id,
      queueReason,
      autoHoldReason: e.moderationNote,
      church: e.church,
      displayName: e.displayName,
      visitLabel: e.visitLabel,
      memberStatus: e.memberStatus,
      text: e.text,
      identities: e.identities.map((i) => i.identity.label),
      reports: e.reports.map((r) => r.reason),
    }
  }

  const experiences = [
    ...autoHeld.map((e) => shape(e, "auto-held" as const)),
    ...reported.map((e) => shape(e, "reported" as const)),
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="/admin/moderation" />
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
        Moderation queue
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Stories publish immediately by default. {autoHeld.length} were auto-held by the
        spam/abuse filter, and {reported.length} are already public but have been reported by a
        member — both need a quick human look.
      </p>

      <div className="mt-8">
        <ModerationQueue experiences={experiences} />
      </div>
    </div>
  )
}
