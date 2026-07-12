"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type SourceType = "SHEPHERDS_STREAM" | "DENOMINATION_DIRECTORY" | "CHURCH_WEBSITE" | "ADMIN"
type Confidence = "UNVERIFIED" | "LOW" | "MEDIUM" | "HIGH"

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string; defaultConfidence: Confidence }[] = [
  { value: "SHEPHERDS_STREAM", label: "Shepherd's Stream", defaultConfidence: "MEDIUM" },
  { value: "DENOMINATION_DIRECTORY", label: "Denomination directory", defaultConfidence: "MEDIUM" },
  { value: "CHURCH_WEBSITE", label: "Church's own website (checked by hand)", defaultConfidence: "HIGH" },
  { value: "ADMIN", label: "Other / admin research", defaultConfidence: "HIGH" },
]

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "UNVERIFIED", label: "Unverified — just a guess" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High — directly confirmed" },
]

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

type TargetedProps = { mode: "targeted"; churchId: string; churchName: string }
type UntargetedProps = { mode: "untargeted"; churchId?: undefined; churchName?: undefined }

export function ChurchSourceForm(props: TargetedProps | UntargetedProps) {
  const { mode } = props
  const router = useRouter()
  const [sourceType, setSourceType] = useState<SourceType>("SHEPHERDS_STREAM")
  const [confidence, setConfidence] = useState<Confidence>("MEDIUM")
  const [externalId, setExternalId] = useState("")
  const [name, setName] = useState(mode === "targeted" ? props.churchName : "")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [website, setWebsite] = useState("")
  const [phone, setPhone] = useState("")
  const [serviceTimesText, setServiceTimesText] = useState("")
  const [denomination, setDenomination] = useState("")
  const [worshipStyleRaw, setWorshipStyleRaw] = useState("")
  const [ministryTagsText, setMinistryTagsText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    updatedFields?: string[]
    skippedFields?: { field: string; reason: string }[]
    outcome?: string
    churchSlug?: string | null
  } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!externalId.trim()) {
      setError("A listing URL (or other stable identifier) is required, so re-entering this later updates it instead of duplicating it.")
      return
    }
    if (mode === "untargeted" && (!lat.trim() || !lng.trim())) {
      setError("Latitude and longitude are required so the matching pipeline can compare this against nearby churches — look the address up on Google Maps and copy the coordinates.")
      return
    }

    const payload = {
      sourceType,
      confidence,
      externalId: externalId.trim(),
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      zip: zip.trim() || null,
      ...(mode === "untargeted" ? { lat: Number(lat), lng: Number(lng) } : {}),
      website: website.trim() || null,
      phone: phone.trim() || null,
      serviceTimes: serviceTimesText.split("\n").map((s) => s.trim()).filter(Boolean),
      denomination: denomination.trim() || null,
      worshipStyleRaw: worshipStyleRaw.trim() || null,
      ministryTagsRaw: ministryTagsText.split("\n").map((s) => s.trim()).filter(Boolean),
    }

    setSubmitting(true)
    try {
      const res = await fetch(mode === "targeted" ? `/api/admin/churches/${props.churchId}/sources` : "/api/admin/sources", {
        method: "POST",
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
      setResult(data)
      router.refresh()
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
          {mode === "targeted" ? "Add a data source" : "Add an unmatched listing"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {mode === "targeted" ? (
            <>
              For anything without an API we can pull from automatically — a Shepherd&apos;s Stream listing, a
              denomination directory entry, or what you found checking the church&apos;s own site by hand. This is
              targeted directly at {props.churchName}, so it applies immediately field-by-field — but only where
              this source&apos;s confidence is higher than whatever&apos;s currently recorded for that field.
              Nothing is ever silently overwritten by an equal-or-lower-confidence source.
            </>
          ) : (
            <>
              Use this when you&apos;re not sure yet whether a listing is a new church or a duplicate of one we
              already have. It won&apos;t touch any Church record directly — instead it runs through the same
              fuzzy-matching pipeline as a bulk import: a close match gets suggested in the{" "}
              <Link href="/admin/merge-queue" className="text-blue underline-offset-2 hover:underline">
                Merge Queue
              </Link>{" "}
              for review (or auto-linked if the match is unmistakable), and no match becomes a brand-new church.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source">
          <select
            value={sourceType}
            onChange={(e) => {
              const next = e.target.value as SourceType
              setSourceType(next)
              setConfidence(SOURCE_TYPE_OPTIONS.find((o) => o.value === next)!.defaultConfidence)
            }}
            className={selectClass}
          >
            {SOURCE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Confidence">
          <select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)} className={selectClass}>
            {CONFIDENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Listing URL" hint="Or any other stable identifier for this specific record — re-entering the same one later updates it instead of duplicating it.">
        <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="https://…" className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name as listed">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Denomination as listed" hint="Optional.">
          <input value={denomination} onChange={(e) => setDenomination(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Address" hint="Optional.">
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </Field>
        <Field label="City" hint="Optional.">
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </Field>
        <Field label="State" hint="Optional.">
          <input value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
        </Field>
        <Field label="ZIP" hint="Optional.">
          <input value={zip} onChange={(e) => setZip(e.target.value)} className={inputClass} />
        </Field>
        {mode === "untargeted" && (
          <>
            <Field label="Latitude">
              <input value={lat} onChange={(e) => setLat(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Longitude">
              <input value={lng} onChange={(e) => setLng(e.target.value)} className={inputClass} />
            </Field>
          </>
        )}
        <Field label="Website" hint="Optional.">
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={inputClass} />
        </Field>
        <Field label="Phone" hint="Optional.">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Service times" hint="One per line. Optional.">
        <textarea value={serviceTimesText} onChange={(e) => setServiceTimesText(e.target.value)} rows={2} className={textareaClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Worship style" hint="e.g. Contemporary, Traditional, Liturgical, Blended.">
          <input value={worshipStyleRaw} onChange={(e) => setWorshipStyleRaw(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Ministries / programs" hint="One per line, e.g. Kids Ministry, Youth Ministry.">
          <textarea value={ministryTagsText} onChange={(e) => setMinistryTagsText(e.target.value)} rows={2} className={textareaClass} />
        </Field>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      {result && mode === "targeted" && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
          {result.updatedFields && result.updatedFields.length > 0 ? (
            <p>Updated: {result.updatedFields.join(", ")}</p>
          ) : (
            <p>Source recorded, but nothing was updated — every field already has equal or higher confidence data.</p>
          )}
          {result.skippedFields && result.skippedFields.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Left unchanged: {result.skippedFields.map((f) => f.field).join(", ")} (already higher confidence).
            </p>
          )}
        </div>
      )}

      {result && mode === "untargeted" && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
          {result.outcome === "auto-matched" && (
            <p>
              Recorded and auto-matched to an existing church —{" "}
              {result.churchSlug ? (
                <Link href={`/church/${result.churchSlug}`} className="underline-offset-2 hover:underline">
                  view it
                </Link>
              ) : (
                "view it in the Merge Queue history"
              )}
              .
            </p>
          )}
          {result.outcome === "review" && (
            <p>
              Recorded — a possible match was found and sent to the{" "}
              <Link href="/admin/merge-queue" className="underline-offset-2 hover:underline">
                Merge Queue
              </Link>{" "}
              for review.
            </p>
          )}
          {result.outcome === "no-match" && (
            <p>Recorded — no likely match found yet. Run the merge candidate generator, or it may become a new church later.</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center self-start rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Add source"}
      </button>
    </form>
  )
}
