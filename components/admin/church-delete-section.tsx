"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, TriangleAlert } from "lucide-react"

export function ChurchDeleteSection({
  churchId,
  churchName,
  counts,
}: {
  churchId: string
  churchName: string
  counts: { experiences: number; savedBy: number; tags: number }
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/churches/${churchId}/delete`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Something went wrong.")
        setDeleting(false)
        return
      }
      router.push("/explore")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setDeleting(false)
    }
  }

  const hasRelatedData = counts.experiences > 0 || counts.savedBy > 0

  return (
    <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 sm:p-7">
      <h2 className="font-serif text-xl font-semibold text-foreground">Danger zone</h2>

      {!confirming ? (
        <>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Permanently remove {churchName} from the directory — for example, if it was imported by mistake
            and isn&apos;t actually a church.
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
            Delete this church
          </button>
        </>
      ) : (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-background p-4">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <div className="text-sm leading-relaxed text-foreground">
              <p>
                This permanently deletes <strong className="font-semibold">{churchName}</strong> and cannot
                be undone.
              </p>
              {hasRelatedData ? (
                <p className="mt-1.5 text-muted-foreground">
                  It will also delete {counts.experiences} visitor{" "}
                  {counts.experiences === 1 ? "experience" : "experiences"}
                  {counts.savedBy > 0 &&
                    `, and remove it from ${counts.savedBy} saved ${counts.savedBy === 1 ? "list" : "lists"}`}
                  .
                </p>
              ) : (
                <p className="mt-1.5 text-muted-foreground">
                  It has no visitor experiences or saves yet, so nothing else will be lost.
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={confirmDelete}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-60"
            >
              <Trash2 className="size-4" />
              {deleting ? "Deleting…" : "Yes, permanently delete"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirming(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
