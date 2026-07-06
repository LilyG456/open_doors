import Link from "next/link"
import { Logo } from "@/components/logo"

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/explore", label: "Find a Church" },
      { href: "/explore", label: "Interactive Map" },
      { href: "/stories", label: "Visitor Stories" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/resources", label: "Resources" },
      { href: "/about", label: "About Open Doors" },
      { href: "/resources", label: "Questions to Ask" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/share", label: "Share Your Experience" },
      { href: "/resources", label: "Mental Health Resources" },
      { href: "/about", label: "Our Approach" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              A gentle guide for exploring churches through real experiences—so you can
              answer, "Would I feel safe, respected, and able to belong here?"
            </p>
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Open Doors. Experiences are personal and may differ.</p>
          <p className="max-w-md text-pretty">
            Open Doors describes reported experiences and does not rank or endorse
            churches. No single perspective represents every visitor.
          </p>
        </div>
      </div>
    </footer>
  )
}
