/**
 * Free-text address -> coordinates, via Nominatim (OpenStreetMap's public
 * geocoder — already the project's source of geo data for OSM imports).
 * Only for sources that don't supply their own coordinates, like
 * scripts/import-church-finder.ts. Callers must space requests at least
 * 1.1s apart per Nominatim's usage policy
 * (https://operations.osmfoundation.org/policies/nominatim/) — this module
 * does one request per call and leaves pacing to the caller so a batch
 * import can log progress between requests.
 */
const NOMINATIM_USER_AGENT = "OpenDoorsChurchDirectory/1.0 (contact: lilyggustafson13@gmail.com)"

// A single transient retry — DNS/connection hiccups happen mid-batch and
// shouldn't abort an entire import over one address; a real "no results"
// response is not retried, since retrying that wouldn't change anything.
export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } })
      if (!res.ok) return null

      const results = (await res.json()) as { lat: string; lon: string }[]
      if (!Array.isArray(results) || results.length === 0) return null

      const lat = Number(results[0].lat)
      const lng = Number(results[0].lon)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null
      return { lat, lng }
    } catch (err) {
      if (attempt === 1) {
        console.log(`  Geocode request failed (${err instanceof Error ? err.message : err}), giving up on this address.`)
        return null
      }
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }
  return null
}
