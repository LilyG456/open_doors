import { notFound, redirect, permanentRedirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChurchVerificationForm } from "@/components/admin/church-verification-form"
import { ChurchDenominationForm } from "@/components/admin/church-denomination-form"
import { ChurchFactsForm, type ChurchFactsFormValues } from "@/components/admin/church-facts-form"
import { ChurchDeleteSection } from "@/components/admin/church-delete-section"

const churchInclude = {
  verification: true,
  denominationRef: { select: { id: true, name: true } },
  _count: { select: { experiences: true, savedBy: true, tags: true } },
} as const

// See app/church/[slug]/page.tsx for why this falls back to previousSlugs.
async function findChurchBySlug(slug: string) {
  const direct = await prisma.church.findUnique({ where: { slug }, include: churchInclude })
  if (direct) return { record: direct, redirectTo: null as string | null }

  const renamed = await prisma.church.findFirst({ where: { previousSlugs: { has: slug } }, include: churchInclude })
  if (renamed) return { record: renamed, redirectTo: renamed.slug }

  return { record: null, redirectTo: null }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { record: church } = await findChurchBySlug(slug)
  return { title: church ? `Manage ${church.name} · Open Doors Admin` : "Manage church · Open Doors Admin" }
}

export default async function ManageChurchPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) redirect(`/signin?callbackUrl=/admin/churches`)
  if (session.user.role !== "ADMIN") redirect("/")

  const { slug } = await params
  const [{ record: church, redirectTo }, denominations] = await Promise.all([
    findChurchBySlug(slug),
    prisma.denomination.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])
  if (redirectTo) permanentRedirect(`/admin/churches/${redirectTo}/verify`)
  if (!church) notFound()

  const factsInitial: ChurchFactsFormValues = {
    id: church.id,
    name: church.name,
    slug: church.slug,
    address: church.address,
    city: church.city,
    state: church.state ?? "",
    zip: church.zip ?? "",
    lat: String(church.lat),
    lng: String(church.lng),
    website: church.website ?? "",
    serviceTimesText: church.serviceTimes.join("\n"),
    attendance: church.attendance ?? "",
    coverImage: church.coverImage ?? "",
    logoImage: church.logoImage ?? "",
    summary: church.summary ?? "",
    denomination: church.denomination,
    denominationId: church.denominationRef?.id ?? "",
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <Link href={`/church/${church.slug}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
        &larr; Back to {church.name}
      </Link>

      <div className="mt-4 flex flex-col gap-6">
        <ChurchFactsForm mode="edit" initial={factsInitial} />

        <ChurchDenominationForm
          churchId={church.id}
          churchName={church.name}
          currentDenomination={church.denomination}
          currentDenominationId={church.denominationRef?.id ?? null}
          denominations={denominations}
        />

        <ChurchVerificationForm
          churchId={church.id}
          churchName={church.name}
          initial={
            church.verification
              ? {
                  lgbtqClergy: church.verification.lgbtqClergy,
                  sameSexMarriage: church.verification.sameSexMarriage,
                  requiresChurchesSameSexMarriage: church.verification.requiresChurchesSameSexMarriage,
                  womenPastors: church.verification.womenPastors,
                  womenBishops: church.verification.womenBishops,
                  sourceUrl: church.verification.sourceUrl,
                  note: church.verification.note,
                }
              : null
          }
        />
        {church.denominationRef && (
          <p className="text-xs text-muted-foreground">
            Linked denomination: {church.denominationRef.name}. Fields left blank above fall back to this
            denomination&apos;s data, then to visitor reports.
          </p>
        )}

        <ChurchDeleteSection
          churchId={church.id}
          churchName={church.name}
          counts={{
            experiences: church._count.experiences,
            savedBy: church._count.savedBy,
            tags: church._count.tags,
          }}
        />
      </div>
    </div>
  )
}
