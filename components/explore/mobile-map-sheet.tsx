"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { Search, SlidersHorizontal, MapPin, Users, ArrowRight } from "lucide-react"
import { ExperienceDot } from "@/components/experience-dot"
import { ChurchLocationStaticThumb } from "@/components/church-location-static-thumb"
import { experienceMeta } from "@/lib/data"
import type { ChurchListing } from "@/lib/types"
import type { MapBounds } from "@/components/explore/church-map"
import { cn } from "@/lib/utils"

const ChurchMap = dynamic(() => import("@/components/explore/church-map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-secondary/40 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
})

type SheetState = "peek" | "full"

export function MobileMapSheet({
  churches,
  query,
  onQuery,
  activeId,
  onSelect,
  onOpenFilters,
  filterCount,
  onBoundsChange,
  fitToChurches,
}: {
  churches: ChurchListing[]
  query: string
  onQuery: (v: string) => void
  activeId: string | null
  onSelect: (id: string) => void
  onOpenFilters: () => void
  filterCount: number
  onBoundsChange?: (bounds: MapBounds) => void
  fitToChurches?: boolean
}) {
  const [sheet, setSheet] = useState<SheetState>("peek")
  const dragStart = useRef<number | null>(null)
  const listItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Tapping a pin selects a church that may be far down the list — bring it
  // into view within the sheet instead of leaving the user to scroll for it.
  useEffect(() => {
    if (!activeId) return
    listItemRefs.current.get(activeId)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [activeId])

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientY
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragStart.current === null) return
    const delta = e.clientY - dragStart.current
    if (delta < -40) setSheet("full")
    else if (delta > 40) setSheet("peek")
    dragStart.current = null
  }

  return (
    <div className="relative lg:hidden">
      {/* Full-screen map beneath the header and above bottom nav */}
      <div className="relative h-[calc(100dvh-8.5rem)] w-full overflow-hidden">
        <ChurchMap
          churches={churches}
          activeId={activeId}
          onSelect={onSelect}
          onBoundsChange={onBoundsChange}
          fitToChurches={fitToChurches}
        />

        {/* Floating search + filters */}
        <div className="absolute inset-x-0 top-0 z-[500] flex items-center gap-2 p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              type="search"
              placeholder="Search churches, cities..."
              className="h-11 w-full rounded-full border border-border bg-background/95 pl-10 pr-4 text-sm shadow-md outline-none backdrop-blur placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
              aria-label="Search churches"
            />
          </div>
          <button
            onClick={onOpenFilters}
            className="relative inline-flex size-11 items-center justify-center rounded-full border border-border bg-background/95 shadow-md backdrop-blur"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="size-4" />
            {filterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Draggable bottom sheet */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-[600] flex flex-col rounded-t-3xl border border-border bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-[height] duration-300 ease-out",
          sheet === "peek" ? "h-[42%]" : "h-[calc(100%-4rem)]",
        )}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2.5 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          role="button"
          tabIndex={0}
          aria-label={sheet === "peek" ? "Expand list" : "Collapse list"}
          onClick={() => setSheet((s) => (s === "peek" ? "full" : "peek"))}
        >
          <span className="h-1.5 w-10 rounded-full bg-border" />
          <p className="mt-2 pb-2 text-sm font-medium text-foreground">
            {churches.length} {churches.length === 1 ? "community" : "communities"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-3">
            {churches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm font-medium text-foreground">No matches yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try removing a filter to see more communities.
                </p>
              </div>
            )}
            {churches.map((church) => (
              <div
                key={church.id}
                ref={(el) => {
                  if (el) listItemRefs.current.set(church.id, el)
                  else listItemRefs.current.delete(church.id)
                }}
              >
                <button
                  onClick={() => {
                    onSelect(church.id)
                    setSheet("peek")
                  }}
                  className={cn(
                    "flex w-full gap-3 rounded-2xl border p-3 text-left transition-all",
                    church.id === activeId
                      ? "border-primary/50 bg-sage-soft/40"
                      : "border-border bg-card",
                  )}
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                    {church.cover ? (
                      <Image
                        src={church.cover}
                        alt={`${church.name} building`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <ChurchLocationStaticThumb lat={church.lat} lng={church.lng} className="size-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ExperienceDot status={church.status} />
                      <span className="truncate text-[11px] font-medium text-muted-foreground">
                        {experienceMeta[church.status].label}
                      </span>
                    </div>
                    <h3 className="mt-0.5 truncate font-serif text-base font-semibold text-foreground">
                      {church.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {church.city}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        {church.transparency.total}
                      </span>
                    </div>
                  </div>
                </button>
                {church.id === activeId && (
                  <Link
                    href={`/church/${church.slug}`}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    View details
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
