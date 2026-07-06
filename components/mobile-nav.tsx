"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, Map, Search, Bookmark, User } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Map", icon: Map },
  { href: "/explore", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/signin", label: "Profile", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map((item, i) => {
          const active = pathname === item.href
          return (
            <li key={i} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
