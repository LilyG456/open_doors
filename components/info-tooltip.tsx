"use client"

import { useState } from "react"
import { Info } from "lucide-react"

export function InfoTooltip({ text, label }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={label ? `About ${label}` : "More information"}
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-xl border border-border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  )
}
