"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin } from "lucide-react"

type Result = { slug: string; name: string; city: string; denomination: string }

export function ChurchPicker() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      fetch(`/api/churches?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => setResults(data.churches ?? []))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          autoFocus
          placeholder="Search churches or cities..."
          className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {loading && <p className="px-1 text-sm text-muted-foreground">Searching…</p>}
        {!loading && results.length === 0 && (
          <p className="px-1 text-sm text-muted-foreground">
            No churches found. Try a different search.
          </p>
        )}
        {results.map((church) => (
          <button
            key={church.slug}
            type="button"
            onClick={() => router.push(`/share?church=${church.slug}`)}
            className="flex w-full flex-col items-start rounded-2xl border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50"
          >
            <span className="font-serif text-base font-semibold text-foreground">
              {church.name}
            </span>
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {church.city} · {church.denomination}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
