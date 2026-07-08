import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DenominationForm, type DenominationFormValues } from "@/components/admin/denomination-form"
import { DenominationSources } from "@/components/admin/denomination-sources"
import { DenominationAliases } from "@/components/admin/denomination-aliases"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await prisma.denomination.findUnique({ where: { id }, select: { name: true } })
  return { title: d ? `${d.name} · Open Doors Admin` : "Denomination · Open Doors Admin" }
}

export default async function EditDenominationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/denominations")
  if (session.user.role !== "ADMIN") redirect("/")

  const { id } = await params
  const denomination = await prisma.denomination.findUnique({
    where: { id },
    include: { sources: { orderBy: { retrievedAt: "desc" } }, aliases: { orderBy: { alias: "asc" } } },
  })
  if (!denomination) notFound()

  const initial: DenominationFormValues = {
    id: denomination.id,
    name: denomination.name,
    tradition: denomination.tradition,
    governance: denomination.governance,
    originsNote: denomination.originsNote ?? "",
    founded: denomination.founded?.toString() ?? "",
    headquarters: denomination.headquarters ?? "",
    membershipApprox: denomination.membershipApprox ?? "",
    website: denomination.website ?? "",
    beliefsUrl: denomination.beliefsUrl ?? "",
    allowsLgbtqClergy: denomination.allowsLgbtqClergy,
    allowsSameSexMarriage: denomination.allowsSameSexMarriage,
    requiresChurchesSameSexMarriage: denomination.requiresChurchesSameSexMarriage,
    allowsWomenPastors: denomination.allowsWomenPastors,
    allowsWomenBishops: denomination.allowsWomenBishops,
    communionPractice: denomination.communionPractice ?? "",
    baptismPractice: denomination.baptismPractice ?? "",
    notes: denomination.notes ?? "",
    lastUpdated: denomination.lastUpdated.toISOString().slice(0, 10),
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">{denomination.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last checked {new Date(denomination.lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        . Editable at the bottom of the form below.
      </p>

      <div className="mt-6">
        <DenominationForm initial={initial} />
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-card p-6 sm:p-7">
        <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">Sources</h2>
        <DenominationSources denominationId={denomination.id} sources={denomination.sources} />
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-card p-6 sm:p-7">
        <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">Aliases</h2>
        <DenominationAliases denominationId={denomination.id} aliases={denomination.aliases} />
      </section>
    </div>
  )
}
