"use client"

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect, useRef } from "react"
import { experienceMeta } from "@/lib/data"
import type { ChurchListing } from "@/lib/types"

export type MapBounds = { north: number; south: number; east: number; west: number }

// Washington State centroid — most of the current catalog lives here (see
// scripts/import-osm-churches.ts). As the catalog grows to other states,
// viewport-driven fetching (BoundsWatcher below) takes over from here.
const DEFAULT_CENTER: [number, number] = [47.3826, -120.4472]
const DEFAULT_ZOOM = 7

function pinIcon(color: string, active: boolean) {
  const size = active ? 34 : 26
  return L.divIcon({
    className: "op-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <span style="
        display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${color};
        box-shadow:0 0 0 ${active ? 5 : 3}px rgba(255,255,255,0.9), 0 4px 12px rgba(51,50,46,0.25);
        transition:all .2s ease;
      ">
        <span style="width:8px;height:8px;border-radius:9999px;background:rgba(255,255,255,0.95)"></span>
      </span>`,
  })
}

function FitBounds({ churches }: { churches: ChurchListing[] }) {
  const map = useMap()
  useEffect(() => {
    if (churches.length === 0) return
    const bounds = L.latLngBounds(churches.map((c) => [c.lat, c.lng]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
  }, [churches, map])
  return null
}

/** Reports the current viewport so the parent can fetch churches within it. */
function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (bounds: MapBounds) => void }) {
  const map = useMap()
  // Suppress the moveend that Leaflet fires right after mount/programmatic
  // fitBounds so it doesn't look like a user-driven pan for a brief moment.
  const settled = useRef(false)

  function reportBounds() {
    // The desktop and mobile layouts both keep a ChurchMap mounted at all
    // times — CSS `hidden` just hides whichever doesn't match the current
    // breakpoint (see ExploreClient). A hidden map's container collapses to
    // 0x0, and Leaflet's getBounds() on a zero-size container returns a
    // degenerate box that would otherwise clobber the *other* map's shared
    // bounds state. Skip reporting until this map actually has real size.
    const size = map.getSize()
    if (size.x === 0 || size.y === 0) return
    const b = map.getBounds()
    onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() })
  }

  useEffect(() => {
    // A couple of retries in case layout (e.g. a flex/grid container sizing
    // pass) hasn't settled on the very first tick — but a map that's
    // genuinely CSS-hidden will still be 0x0 after these and simply never
    // reports, which is the point.
    reportBounds()
    const retries = [50, 200, 450].map((delay) => setTimeout(reportBounds, delay))
    const t = setTimeout(() => {
      settled.current = true
    }, 500)
    return () => {
      retries.forEach(clearTimeout)
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMapEvents({
    moveend: () => {
      if (!settled.current) return
      reportBounds()
    },
  })
  return null
}

function ResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const invalidate = () => map.invalidateSize()
    // Ensure correct tile coverage after the container has its final size.
    const t1 = setTimeout(invalidate, 100)
    const t2 = setTimeout(invalidate, 400)
    const ro = new ResizeObserver(invalidate)
    ro.observe(el)
    window.addEventListener("resize", invalidate)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
      window.removeEventListener("resize", invalidate)
    }
  }, [map])
  return null
}

export default function ChurchMap({
  churches,
  activeId,
  onSelect,
  onBoundsChange,
  fitToChurches = false,
}: {
  churches: ChurchListing[]
  activeId: string | null
  onSelect: (id: string) => void
  /** Called with the current viewport on mount and after every pan/zoom. */
  onBoundsChange?: (bounds: MapBounds) => void
  /** Auto-fit the map to `churches` — turn on only while actively searching/filtering, otherwise it fights the user's own panning. */
  fitToChurches?: boolean
}) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="size-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {fitToChurches && <FitBounds churches={churches} />}
      {onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}
      <ResizeHandler />
      {churches.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={pinIcon(experienceMeta[c.status].color, c.id === activeId)}
          eventHandlers={{ click: () => onSelect(c.id) }}
          zIndexOffset={c.id === activeId ? 1000 : 0}
        />
      ))}
    </MapContainer>
  )
}
