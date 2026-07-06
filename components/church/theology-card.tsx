import type { ChurchDetail } from "@/lib/types"
import { TagIcon } from "@/components/tag-icon"

function TagRow({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm font-medium text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export function TheologyCard({ church }: { church: ChurchDetail }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <h2 className="mb-1 font-serif text-xl font-semibold text-foreground">
        Beliefs &amp; Community
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Factual information shared by the community and public sources—not scores.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {church.theology.map((tag) => (
          <span
            key={tag.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm font-medium text-foreground"
          >
            <TagIcon name={tag.icon} className="size-4 text-primary" />
            {tag.label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-5">
        <TagRow title="Accessibility" items={church.accessibility} />
        <TagRow title="Worship Style" items={church.worship} />
        <TagRow title="Community" items={church.community} />
        <TagRow title="Mental Health" items={church.mentalHealth} />
      </div>
    </section>
  )
}
