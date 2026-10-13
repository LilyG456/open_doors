import Image from "next/image"
import { cn } from "@/lib/utils"
import { basemapTileUrl } from "@/lib/basemap"

/**
 * Cheap, non-interactive stand-in for a church's cover photo in dense lists
 * (the explore list/sheet can render hundreds of rows at once) — a single
 * OSM/CARTO map tile covering the church's location, rendered as a plain
 * <img> instead of a live Leaflet map instance per row. See
 * components/church-location-thumb.tsx for the precisely-centered, live-map
 * version used where only a few instances render at once (cards, the detail
 * page hero).
 *
 * The marker dot is drawn at the thumbnail's center as a visual "you are
 * near here" cue — it's the tile containing the point, not a pixel-exact
 * projection, which is a fine tradeoff at this size.
 */
function latLngToTile(lat: number, lng: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180
  const n = 2 ** zoom
  const x = Math.floor(((lng + 180) / 360) * n)
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { x, y, z: zoom }
}

export function ChurchLocationStaticThumb({
  lat,
  lng,
  zoom = 14,
  className,
}: {
  lat: number
  lng: number
  zoom?: number
  className?: string
}) {
  const { x, y, z } = latLngToTile(lat, lng, zoom)
  const src = basemapTileUrl(z, x, y)

  return (
    <div className={cn("relative overflow-hidden bg-secondary/40", className)}>
      <Image src={src} alt="" fill unoptimized sizes="200px" className="object-cover" />
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
        style={{ background: "var(--pin-limited)", boxShadow: "0 1px 4px rgba(51,50,46,0.35)" }}
      />
    </div>
  )
}
