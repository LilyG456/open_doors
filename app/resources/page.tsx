import Link from "next/link"
import { resources } from "@/lib/data"
import { TagIcon } from "@/components/tag-icon"
import { ArrowRight, LifeBuoy, Heart } from "lucide-react"

export const metadata = {
  title: "Resources · Open Doors",
  description:
    "Guides and resources to help you explore churches with confidence, from first visits to finding community.",
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6">
        <div className="mb-8 text-center">
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            Resources
          </span>
          <h1 className="mt-2 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Gentle guides for your journey
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Whether you&apos;re visiting for the first time or discerning where you belong, these
            resources meet you where you are.
          </p>
        </div>

        <div className="mx-auto mb-10 flex max-w-3xl items-start gap-4 rounded-3xl border border-primary/25 bg-primary/5 p-6 text-left sm:p-7">
          <Heart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">A note before you begin</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              These guides come from my own experiences, conversations with others, and research. They are
              not written by a pastor, therapist, lawyer, or other professional, and they aren&apos;t meant to
              tell you what decisions you should make.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Everyone&apos;s faith journey is different. My hope is simply to offer gentle ideas, questions,
              and resources that might make the path feel a little less lonely.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If you&apos;re in crisis or need professional support, please reach out to a trusted mental
              health professional, emergency services, or one of the organizations linked in the{" "}
              <Link
                href="/resources/mental-health-resources"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Mental Health Resources
              </Link>{" "}
              guide.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((r) => (
            <Link
              key={r.slug}
              href={`/resources/${r.slug}`}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                <TagIcon name={r.icon} className="size-5 text-primary" />
              </div>
              <span className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {r.category}
              </span>
              <h2 className="font-serif text-lg font-semibold text-foreground">{r.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {r.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Read more
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-3xl border border-blue/30 bg-blue/5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue/15">
            <LifeBuoy className="size-6 text-blue" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Need to talk to someone now?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              If you&apos;re in crisis, you don&apos;t have to wait. Call or text 988 (Suicide
              &amp; Crisis Lifeline) or reach the Trevor Project at 1-866-488-7386 for LGBTQ
              support, any time.
            </p>
          </div>
        </div>
    </div>
  )
}
