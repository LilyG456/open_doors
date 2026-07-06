import Link from "next/link"
import { Bookmark } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { churchIncludeForShaping, toChurchSummary, type ChurchWithRelations } from "@/lib/church-shapes"
import { ChurchCard } from "@/components/church-card"

export const metadata = {
  title: "Saved Churches · Open Doors",
}

export default async function SavedPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-16 pt-16 text-center sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8">
          <span className="mx-auto inline-flex size-11 items-center justify-center rounded-xl bg-sage-soft text-primary">
            <Bookmark className="size-5" />
          </span>
          <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            Sign in to see saved churches
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Saved churches are tied to your account so you can find them again later.
          </p>
          <Link
            href="/signin?callbackUrl=/saved"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const saved = await prisma.savedChurch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { church: { include: churchIncludeForShaping } },
  })
  const churches = saved.map((s) => toChurchSummary(s.church as unknown as ChurchWithRelations))

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
        Saved churches
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Communities you've bookmarked to revisit or compare.
      </p>

      {churches.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Save a church from its page to find it here later.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Explore churches
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {churches.map((church) => (
            <ChurchCard key={church.id} church={church} />
          ))}
        </div>
      )}
    </div>
  )
}
