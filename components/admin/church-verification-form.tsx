"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type PolicyStatus = "YES" | "NO" | "VARIES" | "UNKNOWN" | "NOT_APPLICABLE"

type VerificationFields = {
  lgbtqClergy: PolicyStatus | null
  sameSexMarriage: PolicyStatus | null
  requiresChurchesSameSexMarriage: PolicyStatus | null
  womenPastors: PolicyStatus | null
  womenBishops: PolicyStatus | null
}

type Verification = (VerificationFields & { sourceUrl: string; note: string | null }) | null

const TOPICS: { key: keyof VerificationFields; label: string }[] = [
  { key: "lgbtqClergy", label: "LGBTQ clergy" },
  { key: "sameSexMarriage", label: "Same-sex marriage" },
  { key: "requiresChurchesSameSexMarriage", label: "Requires performing same-sex marriages" },
  { key: "womenPastors", label: "Women pastors" },
  { key: "womenBishops", label: "Women bishops / highest office" },
]

const POLICY_OPTIONS: { value: PolicyStatus | ""; label: string }[] = [
  { value: "", label: "No verified override — use denomination/visitor data" },
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "VARIES", label: "Varies" },
  { value: "NOT_APPLICABLE", label: "Not applicable" },
]

const selectClass =
  "h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
const inputClass =
  "h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

const EMPTY_FIELDS: Record<keyof VerificationFields, PolicyStatus | ""> = {
  lgbtqClergy: "",
  sameSexMarriage: "",
  requiresChurchesSameSexMarriage: "",
  womenPastors: "",
  womenBishops: "",
}

export function ChurchVerificationForm({
  churchId,
  churchName,
  initial,
}: {
  churchId: string
  churchName: string
  initial: Verification
}) {
  const router = useRouter()
  const [fields, setFields] = useState<Record<keyof VerificationFields, PolicyStatus | "">>(
    initial
      ? {
          lgbtqClergy: initial.lgbtqClergy ?? "",
          sameSexMarriage: initial.sameSexMarriage ?? "",
          requiresChurchesSameSexMarriage: initial.requiresChurchesSameSexMarriage ?? "",
          womenPastors: initial.womenPastors ?? "",
          womenBishops: initial.womenBishops ?? "",
        }
      : EMPTY_FIELDS,
  )
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? "")
  const [note, setNote] = useState(initial?.note ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function setField(key: keyof VerificationFields, value: PolicyStatus | "") {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (!sourceUrl.trim()) {
      setError("A source URL is required — this church's own website or a public statement, not a guess.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/churches/${churchId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lgbtqClergy: fields.lgbtqClergy || null,
          sameSexMarriage: fields.sameSexMarriage || null,
          requiresChurchesSameSexMarriage: fields.requiresChurchesSameSexMarriage || null,
          womenPastors: fields.womenPastors || null,
          womenBishops: fields.womenBishops || null,
          sourceUrl: sourceUrl.trim(),
          note: note.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.fieldErrors?.sourceUrl?.[0] ?? data.error ?? "Something went wrong.")
        return
      }
      setSaved(true)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function clearVerification() {
    setSubmitting(true)
    try {
      await fetch(`/api/admin/churches/${churchId}/verification`, { method: "DELETE" })
      setFields(EMPTY_FIELDS)
      setSourceUrl("")
      setNote("")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">Verify {churchName}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Only fill in a field here if you&apos;ve personally confirmed it from {churchName}&apos;s own website or a
          public statement — not from assuming the denomination default applies. Any field you set here overrides
          the denomination fallback and visitor reports for this church specifically, and shows as &quot;Verified
          from church website&quot; on its page. Leave a field blank if you didn&apos;t find anything specific to
          this church about it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <div key={t.key} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{t.label}</label>
            <select
              value={fields[t.key]}
              onChange={(e) => setField(t.key, e.target.value as PolicyStatus | "")}
              className={selectClass}
            >
              {POLICY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Source URL</label>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          className="rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-primary">Saved.</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save verification"}
        </button>
        {initial && (
          <button
            type="button"
            disabled={submitting}
            onClick={clearVerification}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            Remove verification
          </button>
        )}
      </div>
    </form>
  )
}
