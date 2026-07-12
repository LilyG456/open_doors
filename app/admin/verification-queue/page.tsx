import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { VerificationQueue } from "@/components/admin/verification-queue"
import { AdminNav } from "@/components/admin/admin-nav"

export const metadata = {
  title: "Verification Queue · Open Doors Admin",
}

export default async function VerificationQueuePage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/verification-queue")
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") redirect("/")

  const suggestions = await prisma.denominationSuggestion.findMany({
    where: { status: "PENDING" },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
    include: {
      church: { select: { name: true, slug: true, denomination: true } },
      suggestedDenomination: { select: { id: true, name: true } },
    },
  })

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="/admin/verification-queue" role={session.user.role} />
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Verification Queue</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Candidate denomination matches found by scanning church websites for affiliation language — never applied
        automatically. {suggestions.length} waiting for review.
      </p>

      <div className="mt-8">
        <VerificationQueue
          rows={suggestions.map((s) => ({
            id: s.id,
            church: s.church,
            suggestedDenomination: s.suggestedDenomination,
            confidence: s.confidence,
            evidence: s.evidence,
            sourceUrl: s.sourceUrl,
          }))}
        />
      </div>
    </div>
  )
}
