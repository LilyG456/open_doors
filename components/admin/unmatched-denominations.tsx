"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type UnmatchedRow = { rawDenomination: string; count: number }
type DenominationOption = { id: string; name: string }

export function UnmatchedDenominations({
  rows,
  denominations,
}: {
  rows: UnmatchedRow[]
  denominations: DenominationOption[]
}) {
  const router = useRouter()
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function resolve(raw: string) {
    const denominationId = selections[raw]
    if (!denominationId) return
    setPending(raw)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/denominations/resolve-unmatched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDenomination: raw, denominationId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error ?? "Couldn't link that just now.")
        return
      }
      setMessage(`Linked ${data.churchesLinked} church${data.churchesLinked === 1 ? "" : "es"} carrying "${raw}."`)
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nothing waiting on a match right now.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="text-sm text-foreground">{message}</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.rawDenomination}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <span className="font-medium text-foreground">&quot;{row.rawDenomination}&quot;</span>
              <span className="ml-2 text-muted-foreground">
                {row.count} church{row.count === 1 ? "" : "es"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selections[row.rawDenomination] ?? ""}
                onChange={(e) =>
                  setSelections((prev) => ({ ...prev, [row.rawDenomination]: e.target.value }))
                }
                className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Link to…</option>
                {denominations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selections[row.rawDenomination] || pending === row.rawDenomination}
                onClick={() => resolve(row.rawDenomination)}
                className="h-9 shrink-0 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {pending === row.rawDenomination ? "Linking…" : "Link"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
