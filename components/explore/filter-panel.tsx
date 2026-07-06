"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { filterGroups } from "@/lib/data"
import { cn } from "@/lib/utils"

export function FilterPanel({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[]
  onToggle: (option: string) => void
  onClear: () => void
}) {
  const [openGroups, setOpenGroups] = useState<string[]>(["Experience", "Theology"])

  const toggleGroup = (title: string) =>
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="font-serif text-lg font-semibold text-foreground">Filters</h2>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-sage-soft"
          >
            <X className="size-3" />
            Clear ({selected.length})
          </button>
        )}
      </div>

      <div className="mt-2 flex-1 overflow-y-auto px-5 pb-6">
        {filterGroups.map((group) => {
          const isOpen = openGroups.includes(group.title)
          return (
            <div key={group.title} className="border-b border-border/70 py-4 last:border-0">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-foreground">{group.title}</span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="mt-3 flex flex-col gap-1">
                  {group.options.map((option) => {
                    const checked = selected.includes(option)
                    return (
                      <label
                        key={option}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
                          checked && "text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card",
                          )}
                        >
                          {checked && (
                            <svg viewBox="0 0 12 12" className="size-3" fill="none">
                              <path
                                d="M2.5 6.5L5 9l4.5-5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(option)}
                          className="sr-only"
                        />
                        <span className={checked ? "text-foreground" : "text-muted-foreground"}>
                          {option}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
