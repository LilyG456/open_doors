import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/admin/moderation", label: "Story Moderation" },
  { href: "/admin/church-edit-queue", label: "Church Edit Queue" },
  { href: "/admin/denominations", label: "Denominations" },
  { href: "/admin/verification-queue", label: "Verification Queue" },
]

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-2" aria-label="Admin">
      <div className="flex flex-wrap gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              link.href === active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-secondary",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <Link
        href="/admin/churches/new"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add a church
      </Link>
    </nav>
  )
}
