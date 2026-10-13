/**
 * CARTO Voyager raster tiles (OpenStreetMap data). CARTO requires an API
 * key as a `key` query param on every basemaps.cartocdn.com URL. It's
 * NEXT_PUBLIC_ because tiles load in the browser, so it's visible to
 * anyone viewing the page — restrict it to our domains in the CARTO console.
 */
const key = process.env.NEXT_PUBLIC_CARTO_API_KEY ?? ""

/** Leaflet TileLayer URL template. */
export const BASEMAP_TILE_URL = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${key}`

/** URL for a single tile, for use outside Leaflet. */
export function basemapTileUrl(z: number, x: number, y: number) {
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png?key=${key}`
}
