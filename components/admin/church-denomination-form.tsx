"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type DenominationOption = { id: string; name: string }

const inputClass =
  "h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
const selectClass =
  "h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"

export function ChurchDenominationForm({
  churchId,
  churchName,
  currentDenomination,
  currentDenominationId,
  denominations,
}: {
  churchId: string
  churchName: string
  currentDenomination: string
  currentDenominationId: string | null
  denominations: DenominationOption[]
}) {
  const router = useRouter()
  const [denomination, setDenomination] = useState(currentDenomination)
  const [denominationId, setDenominationId] = useState(currentDenominationId ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (!denomination.trim()) {
      setError("The denomination label can't be empty.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/churches/${churchId}/denomination`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          denomination: denomination.trim(),
          denominationId: denominationId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.fieldErrors?.denomination?.[0] ?? data.error ?? "Something went wrong.")
        return
      }
      setSaved(true)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">{churchName}&apos;s denomination</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          A direct, one-off correction for this church — use it when the automatic matching missed something,
          e.g. it&apos;s labeled &quot;Non-denominational&quot; from an import but this church&apos;s own website
          actually names a specific affiliation. This doesn&apos;t affect any other church.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Denomination label</label>
          <input
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
            placeholder="e.g. Southern Baptist Convention"
            maxLength={200}
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">Shown on the church&apos;s page. Use &quot;Non-denominational&quot; if that&apos;s genuinely accurate.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Linked denomination record</label>
          <select value={denominationId} onChange={(e) => setDenominationId(e.target.value)} className={selectClass}>
            <option value="">— Not linked —</option>
            {denominations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Drives the Denominational Context section. Leave unlinked if none of these fit yet — add a new one at{" "}
            <a href="/admin/denominations/new" className="text-blue underline-offset-2 hover:underline">
              /admin/denominations/new
            </a>
            .
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-primary">Saved.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center self-start rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  )
}
