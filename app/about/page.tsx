import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, ShieldCheck, Scale, HandHeart } from "lucide-react"

export const metadata = {
  title: "About · Open Doors",
  description:
    "Open Doors helps LGBTQ people explore churches through shared experiences and transparent values—curiosity over judgment, empathy over ratings.",
}

const principles = [
  {
    icon: Heart,
    title: "Empathy over ratings",
    body: "We don't rank churches or crown winners. We share lived experiences so you can sense whether a place might feel like home.",
  },
  {
    icon: ShieldCheck,
    title: "Safety and honesty",
    body: "Stories are shared anonymously and with care. We surface what people actually experienced—warmth and friction alike.",
  },
  {
    icon: Scale,
    title: "Transparency, not verdicts",
    body: "We show confidence based on how many people shared, and we're clear that no single perspective represents everyone.",
  },
  {
    icon: HandHeart,
    title: "Curiosity over judgment",
    body: "Faith is personal and communities are complex. We help you ask good questions rather than hand you a label.",
  },
]

export default function AboutPage() {
  return (
    <div className="pb-16">
        <section className="mx-auto w-full max-w-3xl px-4 pt-12 text-center sm:px-6">
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            About Open Doors
          </span>
          <h1 className="mt-3 text-balance font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            A trusted guide, not a review platform
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Open Doors helps LGBTQ people—and anyone seeking belonging—explore churches through
            the honest experiences of real people. The goal isn&apos;t to declare churches
            &quot;good&quot; or &quot;bad,&quot; but to help you answer one question:
          </p>
          <p className="mx-auto mt-6 max-w-xl text-balance font-serif text-xl italic text-foreground sm:text-2xl">
            &ldquo;Would I feel safe, respected, and able to belong here?&rdquo;
          </p>
        </section>

        <section className="mx-auto mt-12 w-full max-w-5xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="rounded-3xl border border-border bg-card p-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                  <p.icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-foreground">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 w-full max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-foreground">How it works</h2>
            <div className="mt-5 flex flex-col gap-5">
              {[
                {
                  n: "1",
                  t: "People share experiences",
                  d: "Visitors and members describe what it was actually like—safety, respect, leadership, accessibility, and community.",
                },
                {
                  n: "2",
                  t: "We show patterns, not scores",
                  d: "Snapshots summarize reported experiences with clear confidence levels, never a single star rating.",
                },
                {
                  n: "3",
                  t: "You discern what fits",
                  d: "With 'People Like Me,' you can prioritize stories from visitors with similar identities while seeing every perspective.",
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{step.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Every experience is personal and may differ. Together, they help all of us explore
              with a little more hope and a lot less fear.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button nativeButton={false} render={<Link href="/explore" />}>
                Start exploring
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/stories" />}
              >
                Read stories
              </Button>
            </div>
          </div>
        </section>
    </div>
  )
}
