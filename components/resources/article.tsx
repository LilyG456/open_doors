import Link from "next/link"
import { ArrowLeft, ExternalLink as ExternalLinkIcon, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ArticleShell({
  category,
  title,
  dek,
  children,
}: {
  category: string
  title: string
  dek?: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <Link
        href="/resources"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All resources
      </Link>

      <span className="text-xs font-medium uppercase tracking-wide text-primary">{category}</span>
      <h1 className="mt-2 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        {title}
      </h1>
      {dek && <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">{dek}</p>}

      <div className="mt-8">{children}</div>
    </div>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-10 font-serif text-xl font-semibold text-foreground first:mt-0">{children}</h2>
  )
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-6 text-base font-semibold text-foreground">{children}</h3>
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-foreground/90">{children}</p>
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 flex flex-col gap-1.5 pl-5 text-sm leading-relaxed text-foreground/90 marker:text-primary">{children}</ul>
}

export function Li({ children }: { children: React.ReactNode }) {
  return <li className="list-disc">{children}</li>
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
    >
      {children}
      <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" />
    </a>
  )
}

export function Callout({
  icon: Icon,
  title,
  tone = "neutral",
  children,
}: {
  icon?: LucideIcon
  title?: string
  tone?: "neutral" | "warm" | "urgent"
  children: React.ReactNode
}) {
  const toneClass =
    tone === "warm"
      ? "border-primary/25 bg-primary/5"
      : tone === "urgent"
        ? "border-destructive/30 bg-destructive/5"
        : "border-border bg-secondary/40"
  return (
    <div className={cn("my-6 rounded-2xl border p-5", toneClass)}>
      {title && (
        <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon && <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />}
          {title}
        </h3>
      )}
      <div className="text-sm leading-relaxed text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}
