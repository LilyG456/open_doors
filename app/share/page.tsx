import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ChurchPicker } from "@/components/share/church-picker"
import { ShareForm } from "@/components/share/share-form"
import { HandHeart } from "lucide-react"

export const metadata = {
  title: "Share Your Experience · Open Doors",
  description: "Share what a visit was like for you — anonymously and on your own terms.",
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ church?: string }>
}) {
  const { church: churchSlug } = await searchParams
  const session = await auth()

  const church = churchSlug
    ? await prisma.church.findUnique({
        where: { slug: churchSlug },
        select: { slug: true, name: true, city: true },
      })
    : null

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <div className="mb-8 text-center">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-sage-soft text-primary">
          <HandHeart className="size-5" />
        </span>
        <h1 className="mt-4 text-balance font-serif text-3xl font-semibold text-foreground">
          Share your experience
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          Your story could help someone else feel less alone. Shared anonymously, reviewed before
          it's public, and never tied to your account email.
        </p>
      </div>

      {!session?.user ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in to share an experience — it keeps the community honest without collecting your
            name.
          </p>
          <Link
            href={`/signin?callbackUrl=/share${churchSlug ? `?church=${churchSlug}` : ""}`}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Sign in to continue
          </Link>
        </div>
      ) : church ? (
        <ShareForm church={church} />
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-7">
          <h2 className="mb-1 font-serif text-lg font-semibold text-foreground">
            Which church are you sharing about?
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Search by name or city to find the right community.
          </p>
          <ChurchPicker />
        </div>
      )}
    </div>
  )
}
