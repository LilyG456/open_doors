"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, X, ExternalLink } from "lucide-react"

export type SuggestionRow = {
  id: string
  church: { name: string; slug: string; denomination: string }
  suggestedDenomination: { id: string; name: string } | null
  confidence: number | null
  evidence: string | null
  sourceUrl: string | null
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence === null) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  return (
    <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
      {confidence}%
    </span>
  )
}

export function VerificationQueue({ rows: initialRows }: { rows: SuggestionRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function decide(id: string, decision: "ACCEPT" | "REJECT") {
    setPendingId(id)
    try {
      const res = await fetch(`/api/admin/denomination-suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      }
    } finally {
      setPendingId(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">Queue is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing waiting for review. Run <code className="rounded bg-muted px-1 py-0.5">scripts/scan-church-websites.ts</code> to
          generate more suggestions.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <article key={row.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/church/${row.church.slug}`}
                className="font-serif text-lg font-semibold text-foreground hover:underline"
              >
                {row.church.name}
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium text-foreground">{row.church.denomination}</span>
                <span className="text-muted-foreground">→ Suggested:</span>
                <span className="font-medium text-foreground">{row.suggestedDenomination?.name ?? "Unknown"}</span>
                <ConfidenceBadge confidence={row.confidence} />
              </div>
              {row.evidence && (
                <p className="mt-3 rounded-2xl border border-border bg-background p-3 text-xs italic leading-relaxed text-muted-foreground">
                  &quot;{row.evidence}&quot;
                </p>
              )}
              {row.sourceUrl && (
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue underline-offset-2 hover:underline"
                >
                  {row.sourceUrl}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={pendingId === row.id || !row.suggestedDenomination}
                onClick={() => decide(row.id, "ACCEPT")}
                title={row.suggestedDenomination ? "Accept" : "Nothing to accept — no denomination was suggested"}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <Check className="size-4" />
                Accept
              </button>
              <button
                type="button"
                disabled={pendingId === row.id}
                onClick={() => decide(row.id, "REJECT")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <X className="size-4" />
                Reject
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
