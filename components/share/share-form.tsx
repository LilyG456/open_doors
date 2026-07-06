"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { identities as allIdentities } from "@/lib/data"
import { cn } from "@/lib/utils"

type Church = { slug: string; name: string; city: string }

const MEMBER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "VISITOR", label: "Visitor" },
  { value: "REGULAR_ATTENDER", label: "Regular Attender" },
  { value: "CURRENT_MEMBER", label: "Current Member" },
  { value: "FORMER_MEMBER", label: "Former Member" },
]

function TriToggle({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  const options: { value: boolean | null; label: string }[] = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
    { value: null, label: "Prefer not to say" },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-secondary",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function ShareForm({ church }: { church: Church }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [visitLabel, setVisitLabel] = useState("")
  const [memberStatus, setMemberStatus] = useState("VISITOR")
  const [text, setText] = useState("")
  const [identities, setIdentities] = useState<string[]>([])
  const [feltSafe, setFeltSafe] = useState<boolean | null>(null)
  const [feltRespected, setFeltRespected] = useState<boolean | null>(null)
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null)
  const [lgbtqExperience, setLgbtqExperience] = useState("")
  const [womenInLeadership, setWomenInLeadership] = useState("")
  const [accessibilityRating, setAccessibilityRating] = useState("")
  const [mentalHealthRating, setMentalHealthRating] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [heldForReview, setHeldForReview] = useState(false)

  function toggleIdentity(id: string) {
    setIdentities((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (text.trim().length < 20) {
      setError("Please share a little more detail (at least 20 characters).")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/churches/${church.slug}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: isAnonymous ? undefined : displayName.trim() || "Anonymous",
          isAnonymous,
          visitLabel: visitLabel.trim() || "1 visit",
          memberStatus,
          text: text.trim(),
          identities,
          feltSafe,
          feltRespected,
          wouldReturn,
          lgbtqExperience: lgbtqExperience || null,
          womenInLeadership: womenInLeadership || null,
          accessibilityRating: accessibilityRating ? Number(accessibilityRating) : null,
          mentalHealthRating: mentalHealthRating ? Number(mentalHealthRating) : null,
        }),
      })

      if (res.status === 401) {
        router.push(`/signin?callbackUrl=/share?church=${church.slug}`)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        const fieldError = data.error?.fieldErrors
          ? (Object.values(data.error.fieldErrors)[0] as string[] | undefined)?.[0]
          : undefined
        setError(
          fieldError ?? data.error?.formErrors?.[0] ?? data.error ?? "Something went wrong. Please try again.",
        )
        return
      }

      setHeldForReview(data.moderationStatus === "PENDING")
      setDone(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto size-9 text-primary" />
        <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">
          Thank you for sharing
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {heldForReview
            ? `Your story was automatically held for a quick review before it appears on ${church.name}'s page — this happens for a small number of submissions our spam/abuse filter flags.`
            : `Your story is live now on ${church.name}'s page.`}
        </p>
        <Link
          href={`/church/${church.slug}`}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Back to {church.name}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Share your experience at {church.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your story publishes right away under a pseudonym you choose — never your account email
          or real name. It's only held for review if our automated spam/abuse filter flags it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              What should we call you?
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="size-3.5 rounded border-border"
              />
              Post as Anonymous
            </label>
          </div>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isAnonymous}
            placeholder={isAnonymous ? "Anonymous" : "e.g. River"}
            maxLength={40}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">How many visits?</label>
          <input
            value={visitLabel}
            onChange={(e) => setVisitLabel(e.target.value)}
            placeholder="e.g. 3 visits, Attending 2 years"
            maxLength={60}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Your relationship to this community</label>
        <Select value={memberStatus} onChange={setMemberStatus} options={MEMBER_STATUS_OPTIONS} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          I am... <span className="font-normal text-muted-foreground">(optional, shown as tags on your story)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {allIdentities.map((id) => {
            const active = identities.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleIdentity(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary",
                )}
              >
                {id}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Tell your story</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          minLength={20}
          maxLength={4000}
          rows={6}
          placeholder="What was it like to visit? What stood out, good or hard?"
          className="rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Did you feel safe?</label>
          <TriToggle value={feltSafe} onChange={setFeltSafe} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Did you feel respected?</label>
          <TriToggle value={feltRespected} onChange={setFeltRespected} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Would you attend again?</label>
          <TriToggle value={wouldReturn} onChange={setWouldReturn} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">LGBTQ experience</label>
          <Select
            value={lgbtqExperience}
            onChange={setLgbtqExperience}
            options={[
              { value: "", label: "Prefer not to say" },
              { value: "AFFIRMING", label: "Affirming" },
              { value: "MIXED", label: "Mixed" },
              { value: "NOT_AFFIRMING", label: "Not affirming" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Women in visible leadership?</label>
          <Select
            value={womenInLeadership}
            onChange={setWomenInLeadership}
            options={[
              { value: "", label: "Prefer not to say" },
              { value: "YES", label: "Yes" },
              { value: "SOME", label: "Some" },
              { value: "NO", label: "No" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Accessibility (1–5)</label>
          <Select
            value={accessibilityRating}
            onChange={setAccessibilityRating}
            options={[
              { value: "", label: "Prefer not to say" },
              { value: "1", label: "1 — Poor" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5 — Excellent" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Mental health openness (1–5)</label>
          <Select
            value={mentalHealthRating}
            onChange={setMentalHealthRating}
            options={[
              { value: "", label: "Prefer not to say" },
              { value: "1", label: "1 — Not discussed" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5 — Very open" },
            ]}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Sharing…" : "Share your experience"}
      </button>
    </form>
  )
}
