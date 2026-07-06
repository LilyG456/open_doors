"use client"

import dynamic from "next/dynamic"
import { MapPin } from "lucide-react"

const ThumbMap = dynamic(() => import("@/components/church-location-thumb-map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-secondary/40">
      <MapPin className="size-5 text-muted-foreground" />
    </div>
  ),
})

/**
 * Drop-in replacement for a church's cover photo when it doesn't have one —
 * a small map of the church's location instead of a generic placeholder
 * image, so every church shows *something* specific to it.
 */
export function ChurchLocationThumb({
  lat,
  lng,
  showAttribution,
  className,
}: {
  lat: number
  lng: number
  showAttribution?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <ThumbMap lat={lat} lng={lng} showAttribution={showAttribution} />
    </div>
  )
}
