"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, X, UserRound, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ChurchEditRow = {
  id: string
  church: {
    name: string
    slug: string
    website: string | null
    address: string
    city: string
    serviceTimes: string[]
    summary: string | null
  }
  submitterDisplayName: string | null
  submitterRole: "VISITOR" | "CHURCH_REPRESENTATIVE"
  website: string | null
  address: string | null
  city: string | null
  serviceTimes: string[]
  summary: string | null
  addedTagLabels: string[]
  note: string | null
  createdAt: string
}

function DiffRow({ label, current, proposed }: { label: string; current: string; proposed: string }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div>
        <span className="text-muted-foreground line-through">{current || "—"}</span>
        <span className="mx-1.5 text-muted-foreground">→</span>
        <span className="font-medium text-foreground">{proposed}</span>
      </div>
    </div>
  )
}

export function ChurchEditQueue({ rows: initialRows }: { rows: ChurchEditRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function decide(id: string, decision: "ACCEPT" | "REJECT") {
    setPendingId(id)
    try {
      const res = await fetch(`/api/admin/church-edit-suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      }
    } finally {
      setPendingId(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">Queue is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">Nothing waiting for review right now.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <article key={row.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/church/${row.church.slug}`}
              className="font-serif text-lg font-semibold text-foreground hover:underline"
            >
              {row.church.name}
            </Link>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                row.submitterRole === "CHURCH_REPRESENTATIVE"
                  ? "border border-primary/25 bg-primary/10 text-primary"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {row.submitterRole === "CHURCH_REPRESENTATIVE" ? (
                <Building2 className="size-3.5" />
              ) : (
                <UserRound className="size-3.5" />
              )}
              {row.submitterRole === "CHURCH_REPRESENTATIVE"
                ? `Says they're affiliated with this church`
                : "Visitor / community member"}
              {row.submitterDisplayName ? ` · ${row.submitterDisplayName}` : ""}
            </span>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4">
            {row.website && <DiffRow label="Website" current={row.church.website ?? ""} proposed={row.website} />}
            {row.address && <DiffRow label="Address" current={row.church.address} proposed={row.address} />}
            {row.city && <DiffRow label="City" current={row.church.city} proposed={row.city} />}
            {row.serviceTimes.length > 0 && (
              <DiffRow
                label="Service times"
                current={row.church.serviceTimes.join(", ")}
                proposed={row.serviceTimes.join(", ")}
              />
            )}
            {row.summary && <DiffRow label="Summary" current={row.church.summary ?? ""} proposed={row.summary} />}
            {row.addedTagLabels.length > 0 && (
              <div className="grid grid-cols-[100px_1fr] gap-3 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Add tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {row.addedTagLabels.map((label, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!row.website &&
              !row.address &&
              !row.city &&
              row.serviceTimes.length === 0 &&
              !row.summary &&
              row.addedTagLabels.length === 0 && (
                <p className="text-sm text-muted-foreground">No structured changes proposed — see note only.</p>
              )}
          </div>

          {row.note && (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-background p-3 text-sm leading-relaxed text-foreground">
              &quot;{row.note}&quot;
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={pendingId === row.id}
              onClick={() => decide(row.id, "ACCEPT")}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="size-4" />
              Accept &amp; apply
            </button>
            <button
              type="button"
              disabled={pendingId === row.id}
              onClick={() => decide(row.id, "REJECT")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <X className="size-4" />
              Reject
            </button>
            <Link
              href={`/admin/churches/${row.church.slug}/verify`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Edit directly instead
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
