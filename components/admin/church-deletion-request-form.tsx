"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TriangleAlert } from "lucide-react"

const textareaClass =
  "rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

// The MODERATOR-facing half of church deletion — unlike ChurchDeleteSection
// (ADMIN-only, deletes immediately), this only ever creates a
// ChurchDeletionRequest for an admin to review at /admin/deletion-requests.
export function ChurchDeletionRequestForm({
  churchId,
  churchName,
  counts,
}: {
  churchId: string
  churchName: string
  counts: { experiences: number; savedBy: number }
}) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/churches/${churchId}/request-deletion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const fieldError = data?.error?.fieldErrors ? (Object.values(data.error.fieldErrors)[0] as string[] | undefined)?.[0] : undefined
        setError(fieldError ?? data?.error ?? "Something went wrong.")
        return
      }
      setSubmitted(true)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 sm:p-7">
        <h2 className="font-serif text-xl font-semibold text-foreground">Deletion requested</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          An admin will review this and either delete {churchName} or dismiss the request.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 sm:p-7">
      <h2 className="font-serif text-xl font-semibold text-foreground">Request deletion</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        You can&apos;t delete a church directly — an admin reviews every deletion request first. Explain why{" "}
        {churchName} should be removed (for example, it isn&apos;t actually a church, or it&apos;s a duplicate).
      </p>
      {(counts.experiences > 0 || counts.savedBy > 0) && (
        <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          It has {counts.experiences} {counts.experiences === 1 ? "experience" : "experiences"} and is saved by{" "}
          {counts.savedBy} {counts.savedBy === 1 ? "person" : "people"} — deleting it would remove all of that too.
        </p>
      )}

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Why should this church be deleted?"
        className={`mt-4 w-full ${textareaClass}`}
      />

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-destructive px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-destructive/90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Request deletion"}
      </button>
    </form>
  )
}
