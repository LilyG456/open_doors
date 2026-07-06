import type { ChurchDetail } from "@/lib/types"
import { Info } from "lucide-react"

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="font-serif text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{label}</div>
    </div>
  )
}

function pct(value: number | null) {
  return value === null ? "—" : `${value}%`
}

export function TransparencySection({ church }: { church: ChurchDetail }) {
  const t = church.transparency
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-foreground">Community Insights</h2>
        <span className="text-xs text-muted-foreground">
          {t.updated ? `Updated ${t.updated}` : "No experiences yet"}
        </span>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Confidence comes from how many people shared, not from a single score.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value={t.total.toLocaleString()} label="Submitted experiences" />
        <Stat value={t.recent.toLocaleString()} label="In the past two years" />
        <Stat value={pct(t.respected)} label="Reported feeling respected" />
        <Stat value={pct(t.wouldReturn)} label="Would attend again" />
        <Stat value={pct(t.lgbtq)} label="Identified as LGBTQ" />
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-border bg-background p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-blue" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Experiences are personal and may differ. No single perspective represents every
          visitor, and this snapshot is meant to inform your own discernment—not to declare a
          community &quot;good&quot; or &quot;bad.&quot;
        </p>
      </div>
    </section>
  )
}
