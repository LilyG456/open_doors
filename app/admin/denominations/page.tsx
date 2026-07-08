import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isNonDenominationalRaw } from "@/lib/denomination-matching"
import { UnmatchedDenominations } from "@/components/admin/unmatched-denominations"
import { AdminNav } from "@/components/admin/admin-nav"
import { Plus } from "lucide-react"

export const metadata = {
  title: "Denominations · Open Doors Admin",
}

export default async function AdminDenominationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/denominations")
  if (session.user.role !== "ADMIN") redirect("/")

  const [denominations, unmatchedGroups] = await Promise.all([
    prisma.denomination.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        tradition: true,
        governance: true,
        lastUpdated: true,
        _count: { select: { churches: true, aliases: true } },
      },
    }),
    prisma.church.groupBy({
      by: ["denomination"],
      where: { denominationId: null },
      _count: { denomination: true },
      orderBy: { _count: { denomination: "desc" } },
    }),
  ])

  const unmatchedRows = unmatchedGroups
    .filter((g) => !isNonDenominationalRaw(g.denomination))
    .map((g) => ({ rawDenomination: g.denomination, count: g._count.denomination }))

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="/admin/denominations" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Denominations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Denomination-level reference data shown as &quot;Denominational Context&quot; on every linked church&apos;s
            page — background, never a claim about a specific congregation.
          </p>
        </div>
        <Link
          href="/admin/denominations/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add denomination
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">Needs matching</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Raw denomination strings on church records that don&apos;t resolve to any denomination yet. Linking one
          creates a reusable alias, so future imports match automatically.
        </p>
        <UnmatchedDenominations rows={unmatchedRows} denominations={denominations.map((d) => ({ id: d.id, name: d.name }))} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">All denominations</h2>
        <ul className="flex flex-col gap-2">
          {denominations.map((d) => (
            <li key={d.id}>
              <Link
                href={`/admin/denominations/${d.id}`}
                className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {d._count.churches} church{d._count.churches === 1 ? "" : "es"} · {d._count.aliases} alias
                    {d._count.aliases === 1 ? "" : "es"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Checked {new Date(d.lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
