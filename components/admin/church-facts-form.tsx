"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export type ChurchFactsFormValues = {
  id?: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  zip: string
  lat: string
  lng: string
  website: string
  serviceTimesText: string
  attendance: string
  coverImage: string
  logoImage: string
  summary: string
  // Only used in "create" mode — an existing church's denomination is
  // managed separately by ChurchDenominationForm.
  denomination: string
  denominationId: string
}

export const EMPTY_CHURCH_FACTS: ChurchFactsFormValues = {
  name: "",
  slug: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  lat: "",
  lng: "",
  website: "",
  serviceTimesText: "",
  attendance: "",
  coverImage: "",
  logoImage: "",
  summary: "",
  denomination: "",
  denominationId: "",
}

const inputClass =
  "h-11 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
const selectClass =
  "h-11 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
const textareaClass =
  "rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ChurchFactsForm({
  mode,
  initial,
  denominations,
}: {
  mode: "edit" | "create"
  initial: ChurchFactsFormValues
  /** Only needed in "create" mode. */
  denominations?: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof ChurchFactsFormValues>(key: K, value: ChurchFactsFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const lat = Number(values.lat)
    const lng = Number(values.lng)
    if (!values.name.trim() || !values.slug.trim() || !values.address.trim() || !values.city.trim()) {
      setError("Name, URL slug, address, and city are required.")
      return
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Latitude and longitude must be numbers — look the address up on Google Maps and copy the coordinates.")
      return
    }
    if (mode === "create" && !values.denomination.trim()) {
      setError("Denomination label is required (use \"Non-denominational\" if that's accurate).")
      return
    }

    const serviceTimes = values.serviceTimesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      state: values.state.trim() || null,
      zip: values.zip.trim() || null,
      lat,
      lng,
      website: values.website.trim() || null,
      serviceTimes,
      attendance: values.attendance.trim() || null,
      coverImage: values.coverImage.trim() || null,
      logoImage: values.logoImage.trim() || null,
      summary: values.summary.trim() || null,
    }
    if (mode === "create") {
      payload.denomination = values.denomination.trim()
      payload.denominationId = values.denominationId || null
    }

    setSubmitting(true)
    try {
      const res = await fetch(mode === "edit" ? `/api/admin/churches/${values.id}` : "/api/admin/churches", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        const fieldError = data.error?.fieldErrors
          ? (Object.values(data.error.fieldErrors)[0] as string[] | undefined)?.[0]
          : undefined
        setError(fieldError ?? data.error?.formErrors?.[0] ?? data.error ?? "Something went wrong.")
        return
      }

      if (mode === "create") {
        router.push(`/admin/churches/${data.slug}/verify`)
      } else {
        if (data.slug !== values.slug) router.push(`/admin/churches/${data.slug}/verify`)
        setSaved(true)
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          {mode === "create" ? "Add a church" : "Church details"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {mode === "create"
            ? "Use this when a church you found (e.g. on its own website) isn't in the directory yet."
            : "Direct edits — useful when reviewing a suggestion, or when you found a more accurate name/address on the church's own site."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input value={values.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="URL slug" hint={mode === "edit" ? "Changing this changes the church's page URL — existing links will break." : "Used in the page URL, e.g. /church/your-slug."}>
          <input
            value={values.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            className={inputClass}
          />
        </Field>
        <Field label="Address">
          <input value={values.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
        </Field>
        <Field label="City">
          <input value={values.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
        </Field>
        <Field label="State" hint="Optional.">
          <input value={values.state} onChange={(e) => set("state", e.target.value)} className={inputClass} />
        </Field>
        <Field label="ZIP" hint="Optional.">
          <input value={values.zip} onChange={(e) => set("zip", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Latitude">
          <input value={values.lat} onChange={(e) => set("lat", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Longitude">
          <input value={values.lng} onChange={(e) => set("lng", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Website" hint="Optional.">
          <input value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" className={inputClass} />
        </Field>
        <Field label="Attendance" hint="Optional, free text, e.g. ~450 weekly.">
          <input value={values.attendance} onChange={(e) => set("attendance", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Cover image" hint="Optional. A path like /images/church-1.png or a full URL.">
          <input value={values.coverImage} onChange={(e) => set("coverImage", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Logo image" hint="Optional.">
          <input value={values.logoImage} onChange={(e) => set("logoImage", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Service times" hint="One per line, e.g. Sunday 9:30 AM.">
        <textarea
          value={values.serviceTimesText}
          onChange={(e) => set("serviceTimesText", e.target.value)}
          rows={3}
          className={textareaClass}
        />
      </Field>

      <Field label="Summary blurb" hint="A short, factual description — not a review.">
        <textarea value={values.summary} onChange={(e) => set("summary", e.target.value)} rows={2} maxLength={600} className={textareaClass} />
      </Field>

      {mode === "create" && (
        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <Field label="Denomination label">
            <input
              value={values.denomination}
              onChange={(e) => set("denomination", e.target.value)}
              placeholder="e.g. Southern Baptist Convention"
              className={inputClass}
            />
          </Field>
          <Field label="Linked denomination record" hint="Optional — leave unlinked if unsure.">
            <select value={values.denominationId} onChange={(e) => set("denominationId", e.target.value)} className={selectClass}>
              <option value="">— Not linked —</option>
              {denominations?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

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
        {submitting ? "Saving…" : mode === "create" ? "Create church" : "Save changes"}
      </button>
    </form>
  )
}
