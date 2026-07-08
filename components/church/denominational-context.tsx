import Link from "next/link"
import type { ChurchDetail } from "@/lib/types"
import type { BeliefValue, ResolvedBelief } from "@/lib/denomination-context"
import { TRADITION_LABEL, TRADITION_DESCRIPTION, GOVERNANCE_LABEL, GOVERNANCE_DESCRIPTION } from "@/lib/denomination-labels"
import { InfoTooltip } from "@/components/info-tooltip"
import { cn } from "@/lib/utils"
import { Info, ExternalLink, Pencil } from "lucide-react"

const VALUE_LABEL: Record<BeliefValue, string> = {
  YES: "Yes",
  NO: "No",
  VARIES: "Varies",
  UNKNOWN: "Unknown",
  NOT_APPLICABLE: "Not applicable",
}

// Deliberately not "good/bad" colors — these differentiate *how sure we are*,
// not whether the answer is one a visitor would like.
const CONFIDENCE_LABEL: Record<ResolvedBelief["confidence"], string> = {
  DENOMINATION_ONLY: "Denomination-level only",
  VERIFIED_CHURCH_WEBSITE: "Verified from church website",
  VISITOR_REPORTED: "Reported by visitors",
  UNKNOWN: "Unknown",
}

const CONFIDENCE_STYLE: Record<ResolvedBelief["confidence"], string> = {
  DENOMINATION_ONLY: "bg-accent text-accent-foreground",
  VERIFIED_CHURCH_WEBSITE: "border border-primary/25 bg-primary/10 text-primary",
  VISITOR_REPORTED: "bg-secondary text-secondary-foreground",
  UNKNOWN: "bg-muted text-muted-foreground",
}

function Fact({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-muted-foreground">
        {label}
        {tooltip && <InfoTooltip text={tooltip} label={label} />}
      </div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function BeliefRow({ label, belief }: { label: string; belief: ResolvedBelief }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-1 text-sm font-medium text-foreground sm:w-[42%]">
        {label}
        <InfoTooltip text={belief.description} label={label} />
      </div>
      <div className="flex items-center gap-2.5 sm:flex-1 sm:justify-end">
        <span className="text-sm font-semibold text-foreground">{VALUE_LABEL[belief.value]}</span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
            CONFIDENCE_STYLE[belief.confidence],
          )}
        >
          {CONFIDENCE_LABEL[belief.confidence]}
        </span>
      </div>
    </div>
  )
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export function DenominationalContextCard({
  church,
  isAdmin = false,
}: {
  church: ChurchDetail
  isAdmin?: boolean
}) {
  const ctx = church.denominationalContext
  const d = ctx.denomination

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-foreground">Denominational Context</h2>
        {isAdmin && (
          <Link
            href={`/admin/churches/${church.slug}/verify`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="size-3" />
            Verify this church
          </Link>
        )}
      </div>
      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
        Background on {d ? d.name : "this congregation's wider tradition"}, drawn from public denominational
        sources — not a description of {church.name}&apos;s own beliefs or practices. Local churches, pastors, and
        members often differ from official denominational positions.
      </p>

      {!d ? (
        ctx.isNonDenominational ? (
          <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground">
            {church.name}{" "}
            identifies as non-denominational or independent, so there&apos;s no wider denominational body to
            summarize here. Any beliefs and practices described on this page are specific to this congregation —
            see Community Insights and Visitor Stories for firsthand accounts.
            {isAdmin && (
              <>
                {" "}
                Found a specific affiliation on this church&apos;s own site?{" "}
                <Link
                  href={`/admin/churches/${church.slug}/verify`}
                  className="text-blue underline-offset-2 hover:underline"
                >
                  Link a denomination
                </Link>
                .
              </>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground">
            We don&apos;t yet have denominational background matched for &quot;{church.denomination}.&quot;
            That&apos;s a gap in our records, not a statement about this church — see Community Insights and
            Visitor Stories below for what people have actually reported.
            {isAdmin && (
              <>
                {" "}
                <Link href="/admin/denominations" className="text-blue underline-offset-2 hover:underline">
                  Resolve in admin
                </Link>
                .
              </>
            )}
          </div>
        )
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Fact
              label="Tradition"
              value={TRADITION_LABEL[d.tradition] ?? d.tradition}
              tooltip={TRADITION_DESCRIPTION[d.tradition]}
            />
            <Fact
              label="Governance"
              value={GOVERNANCE_LABEL[d.governance] ?? d.governance}
              tooltip={GOVERNANCE_DESCRIPTION[d.governance]}
            />
            {d.headquarters && <Fact label="Headquarters" value={d.headquarters} />}
          </div>

          {(d.originsNote || d.founded !== null) && (
            <div className="mb-5 rounded-2xl border border-border bg-background p-3">
              <div className="text-[11px] font-medium tracking-wide text-muted-foreground">Origins</div>
              <p className="mt-0.5 text-sm leading-relaxed text-foreground">
                {d.originsNote ?? `Founded in ${d.founded}.`}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background px-4">
            <BeliefRow label="LGBTQ clergy" belief={ctx.topics.lgbtqClergy} />
            <BeliefRow label="Same-sex marriage" belief={ctx.topics.sameSexMarriage} />
            <BeliefRow
              label="Requires churches to perform same-sex marriages"
              belief={ctx.topics.requiresChurchesSameSexMarriage}
            />
            <BeliefRow label="Women pastors" belief={ctx.topics.womenPastors} />
            <BeliefRow label="Women bishops / highest office" belief={ctx.topics.womenBishops} />
          </div>

          {d.notes && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{d.notes}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span>Last checked {formatDate(d.lastUpdated)}</span>
            {isAdmin && (
              <Link href={`/admin/denominations/${d.id}`} className="text-blue underline-offset-2 hover:underline">
                Edit denomination
              </Link>
            )}
            {d.sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue underline-offset-2 hover:underline"
              >
                {s.label ?? "Source"}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-border bg-background p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          This section describes {d ? `${d.name}'s` : "the wider tradition's"} official positions or common
          practice — it is not a guarantee about {church.name}{" "}
          specifically, and it isn&apos;t a judgment of whether this community is a good fit for you. Individual
          congregations, pastors, and members can and do differ from denomination-level positions.
        </p>
      </div>
    </section>
  )
}
