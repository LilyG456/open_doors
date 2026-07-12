"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, X } from "lucide-react"

export type DeletionRequestRow = {
  id: string
  church: { name: string; slug: string }
  reason: string
  requestedByName: string | null
  counts: { experiences: number; savedBy: number }
  createdAt: string
}

export function DeletionRequestQueue({ rows: initialRows }: { rows: DeletionRequestRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(id: string, decision: "APPROVE" | "DISMISS") {
    if (decision === "APPROVE" && !window.confirm("This permanently deletes the church. Are you sure?")) return
    setPendingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/deletion-requests/${id}`, {
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
        <p className="mt-1 text-sm text-muted-foreground">No deletion requests waiting for review.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">{error}</p>
      )}
      {rows.map((row) => (
        <article key={row.id} className="rounded-3xl border border-destructive/30 bg-card p-5 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <Link href={`/church/${row.church.slug}`} className="font-serif text-lg font-semibold text-foreground hover:underline">
              {row.church.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              Requested by {row.requestedByName ?? "a moderator"}
            </span>
          </div>

          <p className="rounded-2xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground">
            &quot;{row.reason}&quot;
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {row.counts.experiences} {row.counts.experiences === 1 ? "experience" : "experiences"} · saved by{" "}
            {row.counts.savedBy} {row.counts.savedBy === 1 ? "person" : "people"} — deleting will remove all of it.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={pendingId === row.id}
              onClick={() => decide(row.id, "APPROVE")}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Approve &amp; delete
            </button>
            <button
              type="button"
              disabled={pendingId === row.id}
              onClick={() => decide(row.id, "DISMISS")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <X className="size-4" />
              Dismiss — keep the church
            </button>
            <Link
              href={`/admin/churches/${row.church.slug}/verify`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Review the church first
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
