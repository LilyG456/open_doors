"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { Search, SlidersHorizontal, X, MapPin, Users, ArrowRight } from "lucide-react"
import { FilterPanel } from "@/components/explore/filter-panel"
import { MobileMapSheet } from "@/components/explore/mobile-map-sheet"
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

function ChurchListItem({
  church,
  active,
  onSelect,
}: {
  church: ChurchListing
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3 rounded-2xl border p-3 text-left transition-all",
        active
          ? "border-primary/50 bg-sage-soft/40 shadow-sm"
          : "border-border bg-card hover:border-border hover:bg-secondary/50",
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
        {church.cover ? (
          <Image
            src={church.cover}
            alt={`${church.name} building`}
            fill
            sizes="80px"
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
        <p className="truncate text-xs text-muted-foreground">{church.denomination}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
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
  )
}

export function ExploreClient() {
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [churches, setChurches] = useState<ChurchListing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const listItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Searching or filtering looks at the whole catalog and re-frames the map to
  // the matches. Otherwise — the common case, with thousands of churches in
  // the catalog — we fetch only what's in the current map viewport, the way
  // Airbnb/Zillow-style map browsing works, instead of an arbitrary page of 50.
  const searchMode = query.trim().length > 0 || selected.length > 0

  useEffect(() => {
    if (!searchMode && !bounds) return // map hasn't reported its viewport yet

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams()
      const q = query.trim()
      if (q) params.set("q", q)
      for (const tag of selected) params.append("tags", tag)

      if (searchMode) {
        params.set("pageSize", "200")
      } else if (bounds) {
        params.set("north", String(bounds.north))
        params.set("south", String(bounds.south))
        params.set("east", String(bounds.east))
        params.set("west", String(bounds.west))
        params.set("pageSize", "300")
      }

      fetch(`/api/churches?${params.toString()}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setChurches(data.churches ?? [])
          setTotal(data.total ?? 0)
        })
        .catch((err) => {
          if (err.name !== "AbortError") setChurches([])
        })
        .finally(() => setLoading(false))
    }, 200)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, selected, searchMode, bounds])

  const filtered = churches

  // Clicking a pin selects a church that may be far down the (often
  // hundred-plus item) list — bring it into view instead of leaving the user
  // to scroll and hunt for the highlighted card.
  useEffect(() => {
    if (!activeId) return
    listItemRefs.current.get(activeId)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [activeId])

  const toggle = (option: string) =>
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    )

  const activeChurch = filtered.find((c) => c.id === activeId)

  return (
    <div className="mx-auto max-w-[1600px] px-0 sm:px-4">
      {/* Mobile: full-screen map with draggable bottom sheet */}
      <MobileMapSheet
        churches={filtered}
        query={query}
        onQuery={setQuery}
        activeId={activeId}
        onSelect={setActiveId}
        onOpenFilters={() => setFiltersOpen(true)}
        filterCount={selected.length}
        onBoundsChange={setBounds}
        fitToChurches={searchMode}
      />

      {/* Desktop search bar row */}
      <div className="hidden items-center gap-2 px-4 py-4 sm:px-0 lg:flex">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search churches, cities, ZIP codes..."
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-label="Search churches"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {selected.length > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
              {selected.length}
            </span>
          )}
        </button>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
        {/* Sticky filter panel - desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-border bg-card">
            <FilterPanel
              selected={selected}
              onToggle={toggle}
              onClear={() => setSelected([])}
            />
          </div>
        </aside>

        {/* Map + sidebar */}
        <div className="grid gap-4 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          {/* Map ~70% */}
          <div className="relative order-2 h-[420px] overflow-hidden rounded-2xl border border-border lg:order-1 lg:h-[calc(100dvh-9rem)] lg:sticky lg:top-20">
            <ChurchMap
              churches={filtered}
              activeId={activeId}
              onSelect={setActiveId}
              onBoundsChange={setBounds}
              fitToChurches={searchMode}
            />
            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[500] rounded-2xl border border-border bg-background/90 px-3 py-2.5 text-[11px] shadow-md backdrop-blur-sm">
              <p className="mb-1.5 font-semibold text-foreground">Reported experiences</p>
              {(["positive", "mixed", "limited"] as const).map((s) => (
                <div key={s} className="flex items-center gap-2 py-0.5">
                  <ExperienceDot status={s} />
                  <span className="text-muted-foreground">{experienceMeta[s].label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Church list */}
          <div className="order-1 lg:order-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-medium text-foreground">
                {searchMode
                  ? `${total} ${total === 1 ? "community" : "communities"}${total > filtered.length ? ` (showing ${filtered.length})` : ""}`
                  : `${filtered.length} in this area`}
              </p>
              {selected.length > 0 && (
                <div className="flex flex-wrap justify-end gap-1">
                  {selected.slice(0, 2).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[11px] text-primary"
                    >
                      {s}
                    </span>
                  ))}
                  {selected.length > 2 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{selected.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:pr-1">
              {loading && filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">Loading communities…</p>
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <p className="text-sm font-medium text-foreground">No matches yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchMode
                      ? "Try removing a filter or searching something broader."
                      : "Try zooming out or panning to a different area."}
                  </p>
                </div>
              )}
              {filtered.map((church) => (
                <div
                  key={church.id}
                  ref={(el) => {
                    if (el) listItemRefs.current.set(church.id, el)
                    else listItemRefs.current.delete(church.id)
                  }}
                >
                  <ChurchListItem
                    church={church}
                    active={church.id === activeId}
                    onSelect={() => setActiveId(church.id)}
                  />
                  {church.id === activeId && (
                    <Link
                      href={`/church/${church.slug}`}
                      className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      View {activeChurch?.name.split(" ")[0]} details
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-serif text-lg font-semibold">Filters</span>
              <button
                onClick={() => setFiltersOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-secondary"
                aria-label="Close filters"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FilterPanel
                selected={selected}
                onToggle={toggle}
                onClear={() => setSelected([])}
              />
            </div>
            <div className="border-t border-border p-4">
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
              >
                Show {filtered.length} communities
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
