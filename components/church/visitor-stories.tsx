"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import type { Story } from "@/lib/types"
import { identities as allIdentities } from "@/lib/data"
import { ThumbsUp, Users, Check, Sparkles, HandHeart, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment or hate speech" },
  { value: "NOT_GENUINE", label: "Doesn't seem genuine" },
  { value: "OTHER", label: "Other" },
]

function StoryCard({
  story,
  matched,
}: {
  story: Story
  matched: boolean
}) {
  const { status: sessionStatus } = useSession()
  const router = useRouter()
  const [helpful, setHelpful] = useState(story.helpful)
  const [voted, setVoted] = useState(story.votedByMe)
  const [similar, setSimilar] = useState(false)
  const [pending, setPending] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const [reportPending, setReportPending] = useState(false)

  async function toggleHelpful() {
    if (sessionStatus !== "authenticated") {
      router.push("/signin")
      return
    }
    if (pending) return
    setPending(true)
    const previousVoted = voted
    const previousHelpful = helpful
    setVoted(!previousVoted)
    setHelpful((h) => (previousVoted ? h - 1 : h + 1))
    try {
      const res = await fetch(`/api/stories/${story.id}/helpful`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to vote")
      const data = await res.json()
      setVoted(data.votedByMe)
      setHelpful(data.helpful)
    } catch {
      setVoted(previousVoted)
      setHelpful(previousHelpful)
    } finally {
      setPending(false)
    }
  }

  async function submitReport(reason: string) {
    if (sessionStatus !== "authenticated") {
      router.push("/signin")
      return
    }
    setReportPending(true)
    try {
      const res = await fetch(`/api/stories/${story.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        setReported(true)
        setReportOpen(false)
      }
    } finally {
      setReportPending(false)
    }
  }

  return (
    <article
      className={cn(
        "rounded-3xl border bg-card p-5 sm:p-6 transition-colors",
        matched ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
      )}
    >
      {matched && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          Similar to you
        </div>
      )}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
            {story.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{story.name}</div>
            <div className="text-xs text-muted-foreground">
              {story.status} · {story.visits}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{story.timeAgo}</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {story.identities.map((id) => (
          <span
            key={id}
            className="inline-flex items-center rounded-full bg-secondary/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {id}
          </span>
        ))}
      </div>

      <p className="mb-4 text-sm leading-relaxed text-foreground">{story.text}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleHelpful}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            voted
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-secondary",
          )}
          aria-pressed={voted}
        >
          <ThumbsUp className="size-3.5" />
          Helpful · {helpful}
        </button>
        <button
          type="button"
          onClick={() => setSimilar((s) => !s)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            similar
              ? "border-muted-blue/50 bg-muted-blue/10 text-muted-blue"
              : "border-border bg-background text-muted-foreground hover:bg-secondary",
          )}
          aria-pressed={similar}
        >
          {similar ? <Check className="size-3.5" /> : <Users className="size-3.5" />}
          Similar Experience
        </button>

        <button
          type="button"
          onClick={() => (reported ? undefined : setReportOpen((v) => !v))}
          disabled={reported}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            reported
              ? "border-border bg-background text-muted-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-secondary",
          )}
          aria-pressed={reportOpen}
        >
          <Flag className="size-3.5" />
          {reported ? "Reported" : "Report"}
        </button>
      </div>

      {reportOpen && !reported && (
        <div className="mt-3 flex flex-wrap gap-1.5 rounded-2xl border border-dashed border-border bg-background p-3">
          <span className="w-full text-xs font-medium text-muted-foreground">
            Why are you reporting this story?
          </span>
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={reportPending}
              onClick={() => submitReport(r.value)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export function VisitorStories({
  stories,
  churchSlug,
}: {
  stories: Story[]
  churchSlug: string
}) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const sorted = useMemo(() => {
    if (selected.length === 0) return stories.map((s) => ({ story: s, matched: false }))
    const scored = stories.map((s) => {
      const matched = s.identities.some((i) => selected.includes(i))
      return { story: s, matched }
    })
    return [...scored].sort((a, b) => Number(b.matched) - Number(a.matched))
  }, [stories, selected])

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-7">
        <h2 className="mb-1 font-serif text-xl font-semibold text-foreground">People Like Me</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose what describes you to prioritize stories from similar visitors. All experiences
          stay visible.
        </p>
        <div className="flex flex-wrap gap-2">
          {allIdentities.map((id) => {
            const active = selected.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={active}
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

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Visitor Stories
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {stories.length}
          </span>
        </h2>
        <Link
          href={`/share?church=${churchSlug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <HandHeart className="size-3.5 text-primary" />
          Share your experience
        </Link>
      </div>

      {stories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No stories yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Be the first to share what a visit here was like.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {sorted.map(({ story, matched }) => (
          <StoryCard key={story.id} story={story} matched={matched} />
        ))}
      </div>
    </section>
  )
}
