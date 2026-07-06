"use client"

import { MapContainer, TileLayer, Marker } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

function dotIcon() {
  return L.divIcon({
    className: "op-pin",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `
      <span style="
        display:flex;align-items:center;justify-content:center;
        width:18px;height:18px;border-radius:9999px;
        background:var(--pin-limited, #9ca3af);
        box-shadow:0 0 0 3px rgba(255,255,255,0.9), 0 2px 6px rgba(51,50,46,0.25);
      ">
        <span style="width:6px;height:6px;border-radius:9999px;background:rgba(255,255,255,0.95)"></span>
      </span>`,
  })
}

/**
 * A small, non-interactive map centered on a church, used wherever we'd
 * otherwise show a generic placeholder image for a church with no cover
 * photo — see components/church-location-thumb.tsx.
 */
export default function ChurchLocationThumbMap({
  lat,
  lng,
  showAttribution = false,
}: {
  lat: number
  lng: number
  showAttribution?: boolean
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="size-full"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={showAttribution}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Marker position={[lat, lng]} icon={dotIcon()} />
    </MapContainer>
  )
}
