import { Info } from "lucide-react"
import { describeSource, FIELD_LABEL } from "@/lib/church-sources"
import type { ChurchSourceType, SourceConfidence, ChurchFieldName } from "@prisma/client"

export type DataSourceFieldRow = {
  field: ChurchFieldName
  sourceType: ChurchSourceType
  confidence: SourceConfidence
}

// Which fields are worth explaining to a visitor — internal bookkeeping
// fields (lat/lng, image URLs) aren't shown even though they're tracked.
const PUBLIC_FIELDS: ChurchFieldName[] = [
  "ADDRESS",
  "WEBSITE",
  "PHONE",
  "SERVICE_TIMES",
  "DENOMINATION",
  "SUMMARY",
  "WORSHIP_TAGS",
  "COMMUNITY_TAGS",
] as ChurchFieldName[]

export function DataSourcesPanel({ fieldSources }: { fieldSources: DataSourceFieldRow[] }) {
  const rows = fieldSources.filter((f) => PUBLIC_FIELDS.includes(f.field))
  if (rows.length === 0) return null

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <h2 className="mb-1 font-serif text-lg font-semibold text-foreground">Where this information comes from</h2>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        We pull church details from several places and keep track of which one supplied each fact, so you can judge
        how solid it is.
      </p>

      <div className="flex flex-col gap-1.5">
        {rows.map((f) => (
          <div key={f.field} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{FIELD_LABEL[f.field]}</span>
            <span className="text-xs text-muted-foreground">{describeSource(f.sourceType, f.confidence)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-border bg-background p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-blue" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          A denomination directory or the wider denomination&apos;s own materials describe official positions, not
          necessarily this specific congregation&apos;s practice — see the Denominational Context section above for
          more on that distinction. User-submitted details are reviewed by a moderator before appearing here.
        </p>
      </div>
    </section>
  )
}
