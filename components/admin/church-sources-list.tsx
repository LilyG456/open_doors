import { SOURCE_TYPE_LABEL, FIELD_LABEL } from "@/lib/church-sources"

export type SourceRow = {
  id: string
  sourceType: string
  confidence: string
  externalId: string
  fetchedAt: string
}

export type FieldSourceRow = {
  field: string
  sourceType: string
  confidence: string
  setAt: string
}

export function ChurchSourcesList({ sources, fieldSources }: { sources: SourceRow[]; fieldSources: FieldSourceRow[] }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">Data sources</h2>

      {fieldSources.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Which source currently supplies each field</p>
          <div className="flex flex-col gap-1.5">
            {fieldSources.map((f) => (
              <div key={f.field} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{FIELD_LABEL[f.field as keyof typeof FIELD_LABEL] ?? f.field}</span>
                <span className="text-xs text-muted-foreground">
                  {SOURCE_TYPE_LABEL[f.sourceType as keyof typeof SOURCE_TYPE_LABEL] ?? f.sourceType} ·{" "}
                  {f.confidence.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-xs font-medium text-muted-foreground">All records on file for this church</p>
      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No source records yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((s) => (
            <li key={s.id} className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">
                  {SOURCE_TYPE_LABEL[s.sourceType as keyof typeof SOURCE_TYPE_LABEL] ?? s.sourceType}
                </span>
                <span className="text-xs text-muted-foreground">{s.confidence.toLowerCase()} confidence</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.externalId}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
