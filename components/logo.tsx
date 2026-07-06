import Link from "next/link"
import { Bird } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2", className)}
      aria-label="Open Doors home"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-sage-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Bird className="size-5" aria-hidden="true" />
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
        Open Doors
      </span>
    </Link>
  )
}
