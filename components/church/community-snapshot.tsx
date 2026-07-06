import type { SnapshotMetric } from "@/lib/types"
import { InfoTooltip } from "@/components/info-tooltip"

function barColor(value: number) {
  if (value >= 80) return "bg-primary"
  if (value >= 55) return "bg-muted-blue"
  return "bg-amber"
}

export function CommunitySnapshot({ metrics }: { metrics: SnapshotMetric[] }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="font-serif text-xl font-semibold text-foreground">Community Snapshot</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        A summary of reported experiences—not a rating or a verdict.
      </p>

      <div className="flex flex-col gap-5">
        {metrics.map((m) => (
          <div key={m.key}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">{m.label}</span>
                <InfoTooltip text={m.tooltip} />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {m.display ?? `${m.value}%`}
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
              role="meter"
              aria-valuenow={m.value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${m.label}: ${m.display ?? `${m.value}%`}`}
            >
              <div
                className={`h-full rounded-full ${barColor(m.value)} transition-all`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
