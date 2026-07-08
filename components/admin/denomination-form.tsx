"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  TRADITION_OPTIONS,
  GOVERNANCE_OPTIONS,
  TRADITION_LABEL,
  GOVERNANCE_LABEL,
  GOVERNANCE_DESCRIPTION,
} from "@/lib/denomination-labels"

type PolicyStatus = "YES" | "NO" | "VARIES" | "UNKNOWN" | "NOT_APPLICABLE"

export type DenominationFormValues = {
  id?: string
  name: string
  tradition: string
  governance: string
  originsNote: string
  founded: string
  headquarters: string
  membershipApprox: string
  website: string
  beliefsUrl: string
  allowsLgbtqClergy: PolicyStatus
  allowsSameSexMarriage: PolicyStatus
  requiresChurchesSameSexMarriage: PolicyStatus
  allowsWomenPastors: PolicyStatus
  allowsWomenBishops: PolicyStatus
  communionPractice: string
  baptismPractice: string
  notes: string
  /** yyyy-mm-dd, matching the native date input. */
  lastUpdated: string
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export const EMPTY_DENOMINATION_FORM: DenominationFormValues = {
  name: "",
  tradition: "UNKNOWN",
  governance: "UNKNOWN",
  originsNote: "",
  founded: "",
  headquarters: "",
  membershipApprox: "",
  website: "",
  beliefsUrl: "",
  allowsLgbtqClergy: "UNKNOWN",
  allowsSameSexMarriage: "UNKNOWN",
  requiresChurchesSameSexMarriage: "UNKNOWN",
  allowsWomenPastors: "UNKNOWN",
  allowsWomenBishops: "UNKNOWN",
  communionPractice: "",
  baptismPractice: "",
  notes: "",
  lastUpdated: todayIsoDate(),
}

const POLICY_OPTIONS: { value: PolicyStatus; label: string }[] = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "VARIES", label: "Varies" },
  { value: "NOT_APPLICABLE", label: "Not applicable" },
  { value: "UNKNOWN", label: "Unknown" },
]

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputClass =
  "h-11 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
const selectClass =
  "h-11 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
const textareaClass =
  "rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

export function DenominationForm({ initial }: { initial: DenominationFormValues }) {
  const router = useRouter()
  const isEditing = Boolean(initial.id)
  const [values, setValues] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof DenominationFormValues>(key: K, value: DenominationFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!values.name.trim()) {
      setError("Name is required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(isEditing ? `/api/admin/denominations/${values.id}` : "/api/admin/denominations", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          tradition: values.tradition,
          governance: values.governance,
          originsNote: values.originsNote.trim() || null,
          founded: values.founded.trim() ? Number(values.founded) : null,
          headquarters: values.headquarters.trim() || null,
          membershipApprox: values.membershipApprox.trim() || null,
          website: values.website.trim() || null,
          beliefsUrl: values.beliefsUrl.trim() || null,
          allowsLgbtqClergy: values.allowsLgbtqClergy,
          allowsSameSexMarriage: values.allowsSameSexMarriage,
          requiresChurchesSameSexMarriage: values.requiresChurchesSameSexMarriage,
          allowsWomenPastors: values.allowsWomenPastors,
          allowsWomenBishops: values.allowsWomenBishops,
          communionPractice: values.communionPractice.trim() || null,
          baptismPractice: values.baptismPractice.trim() || null,
          notes: values.notes.trim() || null,
          lastUpdated: values.lastUpdated,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const fieldError = data.error?.fieldErrors
          ? (Object.values(data.error.fieldErrors)[0] as string[] | undefined)?.[0]
          : undefined
        setError(fieldError ?? data.error?.formErrors?.[0] ?? data.error ?? "Something went wrong.")
        return
      }

      router.push(`/admin/denominations/${isEditing ? values.id : data.id}`)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Official name">
          <input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. United Methodist Church"
            maxLength={200}
            className={inputClass}
          />
        </Field>
        <Field label="Tradition">
          <select value={values.tradition} onChange={(e) => set("tradition", e.target.value)} className={selectClass}>
            {TRADITION_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TRADITION_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Governance" hint={GOVERNANCE_DESCRIPTION[values.governance]}>
          <select value={values.governance} onChange={(e) => set("governance", e.target.value)} className={selectClass}>
            {GOVERNANCE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {GOVERNANCE_LABEL[g]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Organizational founding (year)" hint="When this body was formally organized/merged — not necessarily when its tradition began. Use Origins below for the fuller story.">
          <input
            value={values.founded}
            onChange={(e) => set("founded", e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="e.g. 1968"
            className={inputClass}
          />
        </Field>
        <Field label="Headquarters">
          <input
            value={values.headquarters}
            onChange={(e) => set("headquarters", e.target.value)}
            placeholder="e.g. Nashville, TN"
            className={inputClass}
          />
        </Field>
        <Field label="Approximate membership">
          <input
            value={values.membershipApprox}
            onChange={(e) => set("membershipApprox", e.target.value)}
            placeholder="e.g. ~4.4 million (U.S.)"
            className={inputClass}
          />
        </Field>
        <Field label="Official website">
          <input
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>
        <Field label="Official beliefs page" hint="If different from the general website.">
          <input
            value={values.beliefsUrl}
            onChange={(e) => set("beliefsUrl", e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Origins"
        hint="A sentence or two of descriptive context — e.g. &quot;Traditionally traces its origins to the early Christian Church in the 1st century AD (approximately AD 33).&quot; or &quot;Formed in 1968 by the merger of the Methodist Church and the Evangelical United Brethren Church.&quot; Falls back to a plain &quot;Founded in {year}&quot; if left blank."
      >
        <textarea
          value={values.originsNote}
          onChange={(e) => set("originsNote", e.target.value)}
          rows={2}
          maxLength={600}
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <p className="text-xs text-muted-foreground sm:col-span-2">
          These five fields are shown on every linked church&apos;s page under &quot;Denominational Context,&quot;
          labeled as denomination-level background — never as a fact about any specific congregation. Leave a
          field &quot;Unknown&quot; rather than guessing if you don&apos;t have a source for it.
        </p>
        <Field label="Allows LGBTQ clergy">
          <select
            value={values.allowsLgbtqClergy}
            onChange={(e) => set("allowsLgbtqClergy", e.target.value as PolicyStatus)}
            className={selectClass}
          >
            {POLICY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Allows same-sex marriage">
          <select
            value={values.allowsSameSexMarriage}
            onChange={(e) => set("allowsSameSexMarriage", e.target.value as PolicyStatus)}
            className={selectClass}
          >
            {POLICY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Requires churches to perform same-sex marriages">
          <select
            value={values.requiresChurchesSameSexMarriage}
            onChange={(e) => set("requiresChurchesSameSexMarriage", e.target.value as PolicyStatus)}
            className={selectClass}
          >
            {POLICY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Allows women pastors">
          <select
            value={values.allowsWomenPastors}
            onChange={(e) => set("allowsWomenPastors", e.target.value as PolicyStatus)}
            className={selectClass}
          >
            {POLICY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Allows women bishops / equivalent highest office">
          <select
            value={values.allowsWomenBishops}
            onChange={(e) => set("allowsWomenBishops", e.target.value as PolicyStatus)}
            className={selectClass}
          >
            {POLICY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <Field label="Communion practice" hint="Optional.">
          <input
            value={values.communionPractice}
            onChange={(e) => set("communionPractice", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Baptism practice" hint="Optional.">
          <input
            value={values.baptismPractice}
            onChange={(e) => set("baptismPractice", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes" hint="Nuance the fixed fields above can't capture — always paired with a source, never asserted alone.">
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={4}
          maxLength={4000}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Last checked"
        hint="Defaults to today. Set this to whenever you actually verified the belief fields above against their sources — not necessarily today, if you're backfilling older research."
      >
        <input
          type="date"
          value={values.lastUpdated}
          onChange={(e) => set("lastUpdated", e.target.value)}
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Saving…" : isEditing ? "Save changes" : "Create denomination"}
      </button>
    </form>
  )
}
