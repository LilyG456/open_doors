/**
 * Pure scoring logic for "do these two ChurchSource records describe the
 * same real-world church?" — no database or network access here, so it can
 * be unit-tested and reused identically by scripts/generate-merge-candidates.ts
 * (bulk) and any one-off admin action (single pair) without drift.
 *
 * Every sub-score is 0-100 and independently optional: if a field is
 * missing on either side, that comparison is simply excluded and the
 * overall score is renormalized across whatever *was* comparable, rather
 * than penalizing incomplete records (OSM in particular is often missing
 * fields another source has — punishing that would defeat the point).
 */

export type MatchableRecord = {
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  lat: number | null
  lng: number | null
  website: string | null
}

export type ScoreBreakdown = {
  name: number | null
  address: number | null
  cityStateZip: number | null
  geo: number | null
  website: number | null
}

export type MatchResult = {
  /** 0-100, renormalized across whichever categories were actually comparable. */
  score: number
  breakdown: ScoreBreakdown
}

/** A pair scoring at or above this is safe to merge without a human looking at it. */
export const AUTO_MERGE_THRESHOLD = 90
/** Below this, two records aren't similar enough to be worth a review queue entry at all. */
export const REVIEW_THRESHOLD = 60

const WEIGHTS = { name: 35, address: 20, cityStateZip: 15, geo: 20, website: 10 } as const

// ---------- string normalization ----------

const STOPWORDS = new Set(["the", "a", "an", "of"])

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ")
    .trim()
}

const STREET_ABBREVIATIONS: Record<string, string> = {
  st: "street",
  ave: "avenue",
  blvd: "boulevard",
  dr: "drive",
  rd: "road",
  ln: "lane",
  ct: "court",
  pl: "place",
  ter: "terrace",
  cir: "circle",
  hwy: "highway",
  pkwy: "parkway",
  n: "north",
  s: "south",
  e: "east",
  w: "west",
  ne: "northeast",
  nw: "northwest",
  se: "southeast",
  sw: "southwest",
}

function normalizeAddress(address: string): string {
  const words = address
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => STREET_ABBREVIATIONS[w] ?? w)
  return words.join(" ").trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prevRow = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const currRow = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      currRow.push(Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost))
    }
    prevRow = currRow
  }
  return prevRow[b.length]
}

/** 0-100 similarity from edit distance, relative to the longer string's length. */
function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 100
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 100
  return Math.round((1 - levenshtein(a, b) / maxLen) * 100)
}

/** 0-100 similarity from shared words, robust to reordering/abbreviation that trips up edit distance. */
function tokenJaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(/\s+/).filter(Boolean))
  const tokensB = new Set(b.split(/\s+/).filter(Boolean))
  if (tokensA.size === 0 && tokensB.size === 0) return 100
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length
  const union = new Set([...tokensA, ...tokensB]).size
  return union === 0 ? 100 : Math.round((intersection / union) * 100)
}

function nameScore(a: string, b: string): number {
  const normA = normalizeName(a)
  const normB = normalizeName(b)
  return Math.max(levenshteinSimilarity(normA, normB), tokenJaccardSimilarity(normA, normB))
}

function addressScore(a: string, b: string): number {
  const normA = normalizeAddress(a)
  const normB = normalizeAddress(b)

  const numA = normA.match(/^\d+/)?.[0]
  const numB = normB.match(/^\d+/)?.[0]
  // House number is the strongest single signal an address comparison has —
  // two different house numbers on the same street are two different
  // buildings, full stop. Weight it accordingly rather than letting a long
  // shared street name paper over a mismatched number.
  const houseNumberMatch = numA && numB ? numA === numB : null

  const streetA = normA.replace(/^\d+\s*/, "")
  const streetB = normB.replace(/^\d+\s*/, "")
  const streetSim = levenshteinSimilarity(streetA, streetB)

  if (houseNumberMatch === null) return streetSim
  return houseNumberMatch ? Math.round(streetSim * 0.4 + 60) : Math.round(streetSim * 0.4)
}

// Some records in this app store city as a combined "Austin, TX" string
// (see prisma/seed.ts) while others (the OSM importer) keep city and state
// as separate fields. Split the combined form so the two shapes compare
// equally instead of one legitimately-matching pair scoring as a mismatch.
function splitCityState(city: string): { city: string; state: string | null } {
  const match = city.match(/^(.*),\s*([A-Za-z]{2})$/)
  if (match) return { city: match[1].trim(), state: match[2].toUpperCase() }
  return { city: city.trim(), state: null }
}

function cityStateZipScore(rec1: MatchableRecord, rec2: MatchableRecord): number | null {
  const split1 = rec1.city ? splitCityState(rec1.city) : null
  const split2 = rec2.city ? splitCityState(rec2.city) : null
  const city1 = split1?.city ?? null
  const city2 = split2?.city ?? null
  const state1 = rec1.state?.trim() || split1?.state || null
  const state2 = rec2.state?.trim() || split2?.state || null

  const checks: boolean[] = []
  if (city1 && city2) checks.push(city1.toLowerCase() === city2.toLowerCase())
  if (state1 && state2) checks.push(state1.toLowerCase() === state2.toLowerCase())
  if (rec1.zip && rec2.zip) {
    checks.push(rec1.zip.trim().slice(0, 5) === rec2.zip.trim().slice(0, 5))
  }
  if (checks.length === 0) return null
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

const EARTH_RADIUS_METERS = 6371000
/** Beyond this distance, two records are treated as definitely different locations (score 0). */
const MAX_MEANINGFUL_DISTANCE_METERS = 3000

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

function geoScore(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const distance = haversineMeters(lat1, lng1, lat2, lng2)
  return Math.max(0, Math.round(100 - (distance / MAX_MEANINGFUL_DISTANCE_METERS) * 100))
}

function extractDomain(url: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}

function websiteScore(a: string, b: string): number | null {
  const domainA = extractDomain(a)
  const domainB = extractDomain(b)
  if (!domainA || !domainB) return null
  return domainA === domainB ? 100 : 0
}

export function scoreMatch(rec1: MatchableRecord, rec2: MatchableRecord): MatchResult {
  const breakdown: ScoreBreakdown = {
    name: nameScore(rec1.name, rec2.name),
    address: rec1.address && rec2.address ? addressScore(rec1.address, rec2.address) : null,
    cityStateZip: cityStateZipScore(rec1, rec2),
    geo:
      rec1.lat !== null && rec1.lng !== null && rec2.lat !== null && rec2.lng !== null
        ? geoScore(rec1.lat, rec1.lng, rec2.lat, rec2.lng)
        : null,
    website: rec1.website && rec2.website ? websiteScore(rec1.website, rec2.website) : null,
  }

  let weightedSum = 0
  let weightUsed = 0
  for (const [key, weight] of Object.entries(WEIGHTS) as [keyof ScoreBreakdown, number][]) {
    const value = breakdown[key]
    if (value === null) continue
    weightedSum += value * weight
    weightUsed += weight
  }

  const score = weightUsed === 0 ? 0 : Math.round(weightedSum / weightUsed)
  return { score, breakdown }
}
