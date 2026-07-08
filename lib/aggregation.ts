import type { LgbtqExperience, TriState } from "@prisma/client"

/**
 * Everything here is a pure function over already-approved Experience rows.
 * Nothing is stored as a precomputed "score" — the Community Snapshot,
 * transparency counts, and map pin color are always derived fresh from
 * individual submissions, so they stay traceable to real reports and can't
 * drift out of sync with them.
 */

export type AggregatableExperience = {
  createdAt: Date
  feltSafe: boolean | null
  feltRespected: boolean | null
  wouldReturn: boolean | null
  lgbtqExperience: LgbtqExperience | null
  womenInLeadership: TriState | null
  accessibilityRating: number | null
  mentalHealthRating: number | null
  identities: { identity: { label: string } }[]
}

export type SnapshotMetric = {
  key: string
  label: string
  value: number
  display?: string
  tooltip: string
}

const LGBTQ_IDENTITY_LABELS = new Set([
  "Gay",
  "Lesbian",
  "Bi",
  "Trans",
  "Nonbinary",
  "Questioning",
])

function percentTrue(values: (boolean | null)[]) {
  const answered = values.filter((v): v is boolean => v !== null)
  if (answered.length === 0) return null
  return Math.round((answered.filter(Boolean).length / answered.length) * 100)
}

function average(values: (number | null)[]) {
  const answered = values.filter((v): v is number => v !== null)
  if (answered.length === 0) return null
  return answered.reduce((a, b) => a + b, 0) / answered.length
}

export function majority<T extends string>(values: (T | null)[]): T | null {
  const counts = new Map<T, number>()
  for (const v of values) {
    if (v === null) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let best: T | null = null
  let bestCount = 0
  for (const [v, count] of counts) {
    if (count > bestCount) {
      best = v
      bestCount = count
    }
  }
  return best
}

export function computeSnapshot(experiences: AggregatableExperience[]): SnapshotMetric[] {
  const safety = percentTrue(experiences.map((e) => e.feltSafe))
  const respect = percentTrue(experiences.map((e) => e.feltRespected))

  const lgbtqMajority = majority(experiences.map((e) => e.lgbtqExperience))
  const lgbtqDisplay =
    lgbtqMajority === "AFFIRMING"
      ? "Affirming"
      : lgbtqMajority === "MIXED"
        ? "Mixed"
        : lgbtqMajority === "NOT_AFFIRMING"
          ? "Not affirming"
          : "Not reported"
  const lgbtqValue = lgbtqMajority === "AFFIRMING" ? 90 : lgbtqMajority === "MIXED" ? 55 : lgbtqMajority === "NOT_AFFIRMING" ? 20 : 30

  const womenMajority = majority(experiences.map((e) => e.womenInLeadership))
  const womenDisplay =
    womenMajority === "YES" ? "Yes" : womenMajority === "SOME" ? "Some" : womenMajority === "NO" ? "No" : "Not reported"
  const womenValue = womenMajority === "YES" ? 100 : womenMajority === "SOME" ? 55 : womenMajority === "NO" ? 15 : 30

  const accessAvg = average(experiences.map((e) => e.accessibilityRating))
  const accessValue = accessAvg === null ? 30 : Math.round((accessAvg / 5) * 100)
  const accessDisplay = accessAvg === null ? "Limited info" : accessValue >= 85 ? "Excellent" : accessValue >= 65 ? "Good" : "Limited"

  const mentalAvg = average(experiences.map((e) => e.mentalHealthRating))
  const mentalValue = mentalAvg === null ? 30 : Math.round((mentalAvg / 5) * 100)
  const mentalDisplay = mentalAvg === null ? "Limited info" : mentalValue >= 85 ? "Excellent" : mentalValue >= 65 ? "Good" : "Emerging"

  return [
    {
      key: "safety",
      label: "Safety",
      value: safety ?? 0,
      display: safety === null ? "Not enough reports" : undefined,
      tooltip:
        "How often visitors reported feeling physically and emotionally safe during and after their visit.",
    },
    {
      key: "respect",
      label: "Respect",
      value: respect ?? 0,
      display: respect === null ? "Not enough reports" : undefined,
      tooltip:
        "How often visitors reported feeling personally respected regardless of their background or beliefs.",
    },
    {
      key: "lgbtq",
      label: "LGBTQ Experiences",
      value: lgbtqValue,
      display: lgbtqDisplay,
      tooltip:
        "A summary of experiences shared by LGBTQ visitors and members. Reflects reported experiences, not an endorsement.",
    },
    {
      key: "women",
      label: "Women in Leadership",
      value: womenValue,
      display: womenDisplay,
      tooltip:
        "Whether women serve in visible leadership or pastoral roles, based on reported and public information.",
    },
    {
      key: "accessibility",
      label: "Accessibility",
      value: accessValue,
      display: accessDisplay,
      tooltip: "How well the building and services accommodate different physical and sensory needs.",
    },
    {
      key: "mental",
      label: "Mental Health",
      value: mentalValue,
      display: mentalDisplay,
      tooltip: "How openly mental health is discussed and supported within the community.",
    },
  ]
}

export type Transparency = {
  total: number
  recent: number
  respected: number | null
  wouldReturn: number | null
  lgbtq: number | null
  updated: string | null
}

export function computeTransparency(experiences: AggregatableExperience[]): Transparency {
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const total = experiences.length
  const recent = experiences.filter((e) => e.createdAt >= twoYearsAgo).length
  const respected = percentTrue(experiences.map((e) => e.feltRespected))
  const wouldReturn = percentTrue(experiences.map((e) => e.wouldReturn))

  const lgbtqCount = experiences.filter((e) =>
    e.identities.some((i) => LGBTQ_IDENTITY_LABELS.has(i.identity.label)),
  ).length
  const lgbtq = total === 0 ? null : Math.round((lgbtqCount / total) * 100)

  const latest = experiences.reduce<Date | null>(
    (max, e) => (max === null || e.createdAt > max ? e.createdAt : max),
    null,
  )

  return {
    total,
    recent,
    respected,
    wouldReturn,
    lgbtq,
    updated: latest ? formatRelativeTime(latest) : null,
  }
}

export type MapStatus = "positive" | "mixed" | "limited"

const MIN_EXPERIENCES_FOR_SIGNAL = 5

/**
 * Pin color reflects volume + consistency of reports, never a verdict.
 * Below the signal threshold it's always "limited" regardless of how
 * positive the few reports are — a single glowing story shouldn't outrank
 * "we don't really know yet".
 */
export function computeMapStatus(experiences: AggregatableExperience[]): MapStatus {
  if (experiences.length < MIN_EXPERIENCES_FOR_SIGNAL) return "limited"

  const respected = percentTrue(experiences.map((e) => e.feltRespected))
  const safe = percentTrue(experiences.map((e) => e.feltSafe))
  const combined = [respected, safe].filter((v): v is number => v !== null)
  if (combined.length === 0) return "limited"

  const avg = combined.reduce((a, b) => a + b, 0) / combined.length
  return avg >= 80 ? "positive" : "mixed"
}

export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" })
  for (const [unit, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit)
    if (value >= 1) {
      return rtf.format(-value, unit)
    }
  }
  return "just now"
}
