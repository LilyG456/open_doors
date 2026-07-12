import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// adminOnly links are hidden for MODERATOR — deleting a church and managing
// the denomination taxonomy stay ADMIN-only (see lib/api-utils.ts's
// requireAdmin vs requireModerator), so there's no point showing a
// moderator a link they'd just get redirect-bounced from.
const LINKS = [
  { href: "/admin/moderation", label: "Story Moderation", adminOnly: false },
  { href: "/admin/church-edit-queue", label: "Church Edit Queue", adminOnly: false },
  { href: "/admin/verification-queue", label: "Verification Queue", adminOnly: false },
  { href: "/admin/merge-queue", label: "Merge Queue", adminOnly: false },
  { href: "/admin/deletion-requests", label: "Deletion Requests", adminOnly: true },
  { href: "/admin/denominations", label: "Denominations", adminOnly: true },
  { href: "/admin/users", label: "Users", adminOnly: true },
]

export function AdminNav({ active, role }: { active: string; role: string }) {
  const links = LINKS.filter((link) => !link.adminOnly || role === "ADMIN")
  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-2" aria-label="Admin">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
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
