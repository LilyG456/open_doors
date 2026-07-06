"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Search, Menu, X, HandHeart, LogOut } from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/explore", label: "Interactive Map" },
  { href: "/stories", label: "Stories" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                pathname === link.href && "text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search"
              className="h-10 w-40 rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:w-56 focus:border-ring focus:ring-2 focus:ring-ring/30"
              aria-label="Search churches, cities, or ZIP codes"
            />
          </div>

          {session?.user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          ) : (
            <Link
              href="/signin"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/share"
            className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:translate-y-px sm:inline-flex"
          >
            <HandHeart className="size-4" />
            Share Your Experience
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border/70 pt-3">
              {session?.user ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    signOut()
                  }}
                  className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium"
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/share"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <HandHeart className="size-4" />
                Share Your Experience
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
