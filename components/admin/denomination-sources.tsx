"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Trash2 } from "lucide-react"

type Source = { id: string; url: string; label: string | null }

export function DenominationSources({ denominationId, sources }: { denominationId: string; sources: Source[] }) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [label, setLabel] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addSource(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!url.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/denominations/${denominationId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), label: label.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.fieldErrors?.url?.[0] ?? data.error ?? "Couldn't add that source.")
        return
      }
      setUrl("")
      setLabel("")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function removeSource(sourceId: string) {
    await fetch(`/api/admin/denominations/${denominationId}/sources/${sourceId}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sources yet — add at least one citation below.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-2.5"
            >
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1.5 text-sm text-blue underline-offset-2 hover:underline"
              >
                <span className="truncate">{s.label ?? s.url}</span>
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
              <button
                type="button"
                onClick={() => removeSource(s.id)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                aria-label="Remove source"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addSource} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="h-10 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 sm:w-56"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-10 shrink-0 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          Add source
        </button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
