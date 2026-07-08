"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Church = {
  slug: string
  name: string
  website: string | null
  address: string
  city: string
  serviceTimes: string[]
  summary: string | null
}

type TagOption = { id: string; label: string }

type TagCategory = "ACCESSIBILITY" | "WORSHIP" | "COMMUNITY" | "MENTAL_HEALTH" | "THEOLOGY"

const CATEGORY_LABEL: Record<TagCategory, string> = {
  THEOLOGY: "Beliefs & Community",
  ACCESSIBILITY: "Accessibility",
  WORSHIP: "Worship Style",
  COMMUNITY: "Community",
  MENTAL_HEALTH: "Mental Health",
}

const FIELD_KEY: Record<TagCategory, string> = {
  ACCESSIBILITY: "addAccessibilityTagIds",
  WORSHIP: "addWorshipTagIds",
  COMMUNITY: "addCommunityTagIds",
  MENTAL_HEALTH: "addMentalHealthTagIds",
  THEOLOGY: "addTheologyTagIds",
}

const inputClass =
  "h-11 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
const textareaClass =
  "rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

export function SuggestEditForm({
  church,
  availableTagsByCategory,
}: {
  church: Church
  availableTagsByCategory: Record<TagCategory, TagOption[]>
}) {
  const router = useRouter()
  const [submitterRole, setSubmitterRole] = useState<"VISITOR" | "CHURCH_REPRESENTATIVE">("VISITOR")
  const [website, setWebsite] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [serviceTimesText, setServiceTimesText] = useState("")
  const [summary, setSummary] = useState("")
  const [tagSelections, setTagSelections] = useState<Record<TagCategory, string[]>>({
    ACCESSIBILITY: [],
    WORSHIP: [],
    COMMUNITY: [],
    MENTAL_HEALTH: [],
    THEOLOGY: [],
  })
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function toggleTag(category: TagCategory, id: string) {
    setTagSelections((prev) => ({
      ...prev,
      [category]: prev[category].includes(id) ? prev[category].filter((t) => t !== id) : [...prev[category], id],
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const serviceTimes = serviceTimesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    setSubmitting(true)
    try {
      const res = await fetch(`/api/churches/${church.slug}/suggest-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterRole,
          website: website.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          serviceTimes,
          summary: summary.trim() || null,
          addAccessibilityTagIds: tagSelections.ACCESSIBILITY,
          addWorshipTagIds: tagSelections.WORSHIP,
          addCommunityTagIds: tagSelections.COMMUNITY,
          addMentalHealthTagIds: tagSelections.MENTAL_HEALTH,
          addTheologyTagIds: tagSelections.THEOLOGY,
          note: note.trim() || null,
        }),
      })

      if (res.status === 401) {
        router.push(`/signin?callbackUrl=/church/${church.slug}/suggest-edit`)
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
        <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">Thanks for the suggestion</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          An admin will review it before anything changes on {church.name}&apos;s page.
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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Your relationship to this church</label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: "VISITOR", label: "Visitor / community member" },
              { value: "CHURCH_REPRESENTATIVE", label: "I'm affiliated with this church" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSubmitterRole(opt.value)}
              aria-pressed={submitterRole === opt.value}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                submitterRole === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Leave anything blank that you&apos;re not correcting — only filled-in fields will be suggested.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Website</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={church.website ?? "https://…"}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={church.address}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={church.city} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">
            Service times <span className="font-normal text-muted-foreground">(one per line)</span>
          </label>
          <textarea
            value={serviceTimesText}
            onChange={(e) => setServiceTimesText(e.target.value)}
            rows={3}
            placeholder={church.serviceTimes.join("\n") || "e.g. Sunday 9:30 AM"}
            className={textareaClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Summary blurb</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            maxLength={600}
            placeholder={church.summary ?? "A short, factual description of this community…"}
            className={textareaClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground">
          Add tags <span className="font-normal text-muted-foreground">(only shown below if not already listed)</span>
        </p>
        {(Object.keys(availableTagsByCategory) as TagCategory[]).map((category) => {
          const options = availableTagsByCategory[category]
          if (options.length === 0) return null
          return (
            <div key={category} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[category]}
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((tag) => {
                  const active = tagSelections[category].includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(category, tag.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-5">
        <label className="text-sm font-medium text-foreground">
          Note <span className="font-normal text-muted-foreground">(context, sources, or anything that doesn't fit above)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. Their new accessible entrance opened in June, see their Facebook post…"
          className={textareaClass}
        />
      </div>

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
        {submitting ? "Submitting…" : "Submit suggestion"}
      </button>
    </form>
  )
}
