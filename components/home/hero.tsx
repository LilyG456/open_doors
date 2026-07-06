"use client"

import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"
import { TagIcon } from "@/components/tag-icon"
import { quickFilters } from "@/lib/data"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-16">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Experiences, not ratings
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.4rem]">
            Find a church where you can belong.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            Explore churches through the experiences of real people—not just labels.
            Learn about safety, accessibility, theology, leadership, and community before
            you visit.
          </p>

          <form
            action="/explore"
            className="mt-7 flex items-center gap-2 rounded-full border border-border bg-card p-2 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
          >
            <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Search churches, cities, ZIP codes..."
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search churches, cities, or ZIP codes"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {quickFilters.map((f, i) => (
              <Link
                key={i}
                href="/explore"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-sage-soft/60"
              >
                <TagIcon name={f.icon} className="size-4 text-primary" />
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <Image
              src="/images/hero-illustration.png"
              alt="Diverse people walking toward and entering different welcoming churches"
              width={720}
              height={640}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-4 hidden items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-md sm:flex">
            <div className="flex -space-x-2">
              {["#7ba67f", "#7f9db3", "#d9b45c"].map((c) => (
                <span
                  key={c}
                  className="size-7 rounded-full border-2 border-card"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <p className="text-xs leading-tight text-muted-foreground">
              <span className="font-semibold text-foreground">500+ experiences</span>
              <br />
              shared this year
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
