"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
import { SOURCE_TYPE_LABEL } from "@/lib/church-sources"

export type MergeSourceInfo = {
  id: string
  sourceType: string
  confidence: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  website: string | null
  phone: string | null
  denomination: string | null
  serviceTimes: string[]
  churchSlug: string | null
}

export type MergeCandidateRow = {
  id: string
  score: number
  sourceA: MergeSourceInfo
  sourceB: MergeSourceInfo
}

function SourceColumn({ source }: { source: MergeSourceInfo }) {
  const rows: [string, string | null][] = [
    ["Address", source.address],
    ["City", [source.city, source.state, source.zip].filter(Boolean).join(", ") || null],
    ["Website", source.website],
    ["Phone", source.phone],
    ["Denomination", source.denomination],
    ["Service times", source.serviceTimes.length > 0 ? source.serviceTimes.join(", ") : null],
  ]

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground">{source.name}</p>
        {source.churchSlug && (
          <a href={`/church/${source.churchSlug}`} target="_blank" rel="noreferrer" className="text-xs text-blue underline-offset-2 hover:underline">
            existing church
          </a>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {SOURCE_TYPE_LABEL[source.sourceType as keyof typeof SOURCE_TYPE_LABEL] ?? source.sourceType} ·{" "}
        {source.confidence.toLowerCase()} confidence
      </p>
      <div className="mt-1 flex flex-col gap-1 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([label, v]) => (
            <div key={label} className="grid grid-cols-[90px_1fr] gap-2">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <span className="text-foreground">{v}</span>
            </div>
          ))}
        {rows.every(([, v]) => !v) && <p className="text-xs text-muted-foreground">No additional fields.</p>}
      </div>
    </div>
  )
}

export function MergeCandidateQueue({ rows: initialRows }: { rows: MergeCandidateRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(id: string, decision: "ACCEPT" | "REJECT") {
    setPendingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/merge-candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Something went wrong.")
      }
    } finally {
      setPendingId(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">Queue is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">No possible duplicates waiting for review right now.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">{error}</p>
      )}
      {rows.map((row) => (
        <article key={row.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Possible duplicate</p>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              Match score: {row.score}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SourceColumn source={row.sourceA} />
            <SourceColumn source={row.sourceB} />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={pendingId === row.id}
              onClick={() => decide(row.id, "ACCEPT")}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="size-4" />
              Same church — merge
            </button>
            <button
              type="button"
              disabled={pendingId === row.id}
              onClick={() => decide(row.id, "REJECT")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <X className="size-4" />
              Not the same — dismiss
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
