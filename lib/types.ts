import type { MapStatus, SnapshotMetric, Transparency } from "@/lib/aggregation"

export type ExperienceLevel = MapStatus
export type { SnapshotMetric }

export type Tag = {
  label: string
  icon: string | null
}

/** Card/map/list shape — everything needed without loading a church's full story history. */
export type ChurchListing = {
  id: string
  slug: string
  name: string
  denomination: string
  address: string
  city: string
  lat: number
  lng: number
  cover: string | null
  summary: string | null
  status: ExperienceLevel
  theology: string[]
  accessibility: string[]
  worship: string[]
  community: string[]
  mentalHealth: string[]
  transparency: Transparency
}

/** Full church detail page shape. */
export type ChurchDetail = {
  id: string
  slug: string
  name: string
  denomination: string
  address: string
  city: string
  website: string | null
  serviceTimes: string[]
  attendance: string | null
  cover: string | null
  logo: string | null
  summary: string | null
  lat: number
  lng: number
  status: ExperienceLevel
  snapshot: SnapshotMetric[]
  theology: Tag[]
  accessibility: string[]
  worship: string[]
  community: string[]
  mentalHealth: string[]
  transparency: Transparency
}

export type Story = {
  id: string
  name: string
  visits: string
  identities: string[]
  status: "Current Member" | "Former Member" | "Visitor" | "Regular Attender"
  text: string
  helpful: number
  votedByMe: boolean
  timeAgo: string
}
