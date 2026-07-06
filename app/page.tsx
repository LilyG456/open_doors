import Link from "next/link"
import { ArrowRight, ShieldCheck, HandHeart, MapPin } from "lucide-react"
import { Hero } from "@/components/home/hero"
import { ChurchCard } from "@/components/church-card"
import { ExperienceDot } from "@/components/experience-dot"
import { experienceMeta } from "@/lib/data"
import { prisma } from "@/lib/prisma"
import { churchIncludeForShaping, toChurchSummary, type ChurchWithRelations } from "@/lib/church-shapes"

// Featured churches and their stats change as new experiences are approved,
// so this page can't be frozen at build time — revalidate it periodically.
export const revalidate = 60

const values = [
  {
    icon: ShieldCheck,
    title: "Experiences, not verdicts",
    body: "We describe what people reported feeling—safe, respected, welcomed—rather than declaring any church good or bad.",
  },
  {
    icon: HandHeart,
    title: "Honesty with care",
    body: "Stories are shared gently and anonymously, so you get an honest picture without conflict or pile-ons.",
  },
  {
    icon: MapPin,
    title: "Context before you visit",
    body: "Theology, accessibility, leadership, and community details—so you can walk in informed and at ease.",
  },
]

export default async function HomePage() {
  const churches = await prisma.church.findMany({
    take: 3,
    orderBy: { name: "asc" },
    include: churchIncludeForShaping,
  })
  const featured = churches.map((c) => toChurchSummary(c as unknown as ChurchWithRelations))
  return (
    <>
      <Hero />

      {/* Belonging question */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            The question we help you answer
          </p>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-2xl font-medium leading-snug text-balance text-foreground sm:text-3xl">
            "Would I feel safe, respected, and able to belong here?"
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Open Doors is a trusted guide, not a review platform. We prioritize empathy
            over ratings and curiosity over judgment.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-sage-soft text-primary">
                <v.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                {v.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured churches */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Communities to explore
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              A few nearby communities with recent, shared experiences.
            </p>
          </div>
          <Link
            href="/explore"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary sm:inline-flex"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((church) => (
            <ChurchCard key={church.id} church={church} />
          ))}
        </div>
      </section>

      {/* How pins work */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-secondary/40 px-6 py-10 sm:px-10">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            What the map colors mean
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pins never imply a "good" or "bad" church. They only reflect the amount and
            consistency of reported experiences.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {(["positive", "mixed", "limited"] as const).map((status) => {
              const meta = experienceMeta[status]
              return (
                <div
                  key={status}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5"
                >
                  <ExperienceDot status={status} className="mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center sm:px-10 sm:py-16">
          <h2 className="mx-auto max-w-xl font-serif text-2xl font-semibold text-balance text-primary-foreground sm:text-3xl">
            Your experience could help someone feel less alone.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/85">
            Share what a visit was like for you—anonymously and on your own terms.
          </p>
          <Link
            href="/share"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
          >
            <HandHeart className="size-4 text-primary" />
            Share Your Experience
          </Link>
        </div>
      </section>
    </>
  )
}
