"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

type Alias = { id: string; alias: string }

export function DenominationAliases({ denominationId, aliases }: { denominationId: string; aliases: Alias[] }) {
  const router = useRouter()
  const [alias, setAlias] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addAlias(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!alias.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/denominations/${denominationId}/aliases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: alias.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Couldn't add that alias.")
        return
      }
      setAlias("")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function removeAlias(aliasId: string) {
    await fetch(`/api/admin/denominations/${denominationId}/aliases/${aliasId}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Raw strings (from OSM tags, church websites, or free text) that should resolve to this denomination — e.g.
        &quot;umc&quot; or &quot;united methodist.&quot; Matching is case-insensitive.
      </p>
      {aliases.length === 0 ? (
        <p className="text-sm text-muted-foreground">No aliases yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {aliases.map((a) => (
            <li
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pl-3 pr-1.5 text-sm text-foreground"
            >
              {a.alias}
              <button
                type="button"
                onClick={() => removeAlias(a.id)}
                className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                aria-label={`Remove alias ${a.alias}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addAlias} className="flex gap-2">
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="e.g. southern baptist"
          className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-10 shrink-0 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          Add alias
        </button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
