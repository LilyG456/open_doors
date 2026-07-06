import { experienceMeta } from "@/lib/data"
import type { ExperienceLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ExperienceDot({
  status,
  showLabel = false,
  className,
}: {
  status: ExperienceLevel
  showLabel?: boolean
  className?: string
}) {
  const meta = experienceMeta[status]
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="size-2.5 shrink-0 rounded-full ring-2 ring-background"
        style={{ backgroundColor: meta.color }}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
      )}
    </span>
  )
}
