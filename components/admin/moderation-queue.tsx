"use client"

import { useState } from "react"
import { Check, X, ShieldAlert, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

type PendingExperience = {
  id: string
  queueReason: "auto-held" | "reported"
  autoHoldReason: string | null
  church: { name: string; slug: string }
  displayName: string
  visitLabel: string
  memberStatus: string
  text: string
  identities: string[]
  reports: string[]
}

export function ModerationQueue({ experiences }: { experiences: PendingExperience[] }) {
  const [items, setItems] = useState(experiences)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setPendingId(id)
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((e) => e.id !== id))
      }
    } finally {
      setPendingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">Queue is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">Nothing waiting for review right now.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((e) => (
        <article key={e.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            {e.queueReason === "auto-held" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-2.5 py-1 text-xs font-medium text-foreground">
                <ShieldAlert className="size-3.5" />
                Auto-held{e.autoHoldReason ? ` — ${e.autoHoldReason}` : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-2.5 py-1 text-xs font-medium text-foreground">
                <Flag className="size-3.5" />
                Reported {e.reports.length} {e.reports.length === 1 ? "time" : "times"} · currently public
              </span>
            )}
            <span className="text-xs font-medium text-primary">{e.church.name}</span>
          </div>

          {e.queueReason === "reported" && e.reports.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {e.reports.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {r}
                </span>
              ))}
            </div>
          )}

          <div className="mb-2">
            <span className="text-sm font-semibold text-foreground">{e.displayName}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {e.memberStatus} · {e.visitLabel}
            </span>
          </div>

          {e.identities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {e.identities.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center rounded-full bg-secondary/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {id}
                </span>
              ))}
            </div>
          )}

          <p className="mb-4 text-sm leading-relaxed text-foreground">{e.text}</p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pendingId === e.id}
              onClick={() => decide(e.id, "APPROVED")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
              )}
            >
              <Check className="size-4" />
              {e.queueReason === "reported" ? "Keep public, dismiss reports" : "Approve, publish"}
            </button>
            <button
              type="button"
              disabled={pendingId === e.id}
              onClick={() => decide(e.id, "REJECTED")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <X className="size-4" />
              {e.queueReason === "reported" ? "Remove from site" : "Reject"}
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
