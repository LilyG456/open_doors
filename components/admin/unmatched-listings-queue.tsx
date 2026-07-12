"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, X } from "lucide-react"
import { SOURCE_TYPE_LABEL } from "@/lib/church-sources"

export type UnmatchedRow = {
  id: string
  name: string
  city: string | null
  state: string | null
  sourceType: string
  hasCoords: boolean
}

export function UnmatchedListingsQueue({ rows: initialRows }: { rows: UnmatchedRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createdSlug, setCreatedSlug] = useState<{ id: string; slug: string } | null>(null)

  async function resolve(id: string, action: "promote" | "dismiss") {
    setPendingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/sources/${id}/${action}`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.")
        return
      }
      if (action === "promote" && data?.churchSlug) {
        setCreatedSlug({ id, slug: data.churchSlug })
      }
      setRows((prev) => prev.filter((r) => r.id !== id))
      router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing unresolved right now.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">{error}</p>
      )}
      {createdSlug && (
        <p className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Created a new church —{" "}
          <Link href={`/church/${createdSlug.slug}`} className="underline-offset-2 hover:underline">
            view it
          </Link>
          .
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm"
          >
            <div>
              <span className="font-medium text-foreground">{row.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {[row.city, row.state].filter(Boolean).join(", ")} ·{" "}
                {SOURCE_TYPE_LABEL[row.sourceType as keyof typeof SOURCE_TYPE_LABEL] ?? row.sourceType}
                {!row.hasCoords && " · no coordinates"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pendingId === row.id || !row.hasCoords}
                onClick={() => resolve(row.id, "promote")}
                title={row.hasCoords ? undefined : "This listing has no coordinates — edit it with a location first."}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Building2 className="size-3.5" />
                Create church
              </button>
              <button
                type="button"
                disabled={pendingId === row.id}
                onClick={() => resolve(row.id, "dismiss")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <X className="size-3.5" />
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
