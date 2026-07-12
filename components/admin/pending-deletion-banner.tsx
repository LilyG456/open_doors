"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TriangleAlert, X } from "lucide-react"

export function PendingDeletionBanner({
  requestId,
  reason,
  requestedByName,
  canDismiss,
}: {
  requestId: string
  reason: string
  requestedByName: string | null
  canDismiss: boolean
}) {
  const router = useRouter()
  const [dismissing, setDismissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  async function dismiss() {
    setDismissing(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/deletion-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "DISMISS" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Something went wrong.")
        return
      }
      setDismissed(true)
      router.refresh()
    } finally {
      setDismissing(false)
    }
  }

  if (dismissed) return null

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-destructive/40 bg-destructive/10 p-5">
      <div className="flex items-start gap-2.5">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <div className="text-sm leading-relaxed text-foreground">
          <p className="font-medium">Deletion requested by {requestedByName ?? "a moderator"}, pending admin review</p>
          <p className="mt-0.5 text-muted-foreground">&quot;{reason}&quot;</p>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {canDismiss && (
        <button
          type="button"
          disabled={dismissing}
          onClick={dismiss}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          <X className="size-3.5" />
          {dismissing ? "Dismissing…" : "Dismiss — keep the church"}
        </button>
      )}
    </div>
  )
}
