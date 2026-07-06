import {
  computeSnapshot,
  computeTransparency,
  computeMapStatus,
  type AggregatableExperience,
} from "@/lib/aggregation"

type TagRelation = { tag: { label: string; category: string; icon: string | null } }

export type ChurchWithRelations = {
  id: string
  slug: string
  name: string
  denomination: string
  address: string
  city: string
  state: string | null
  zip: string | null
  lat: number
  lng: number
  website: string | null
  serviceTimes: string[]
  attendance: string | null
  coverImage: string | null
  logoImage: string | null
  summary: string | null
  tags: TagRelation[]
  experiences: AggregatableExperience[]
}

function tagsByCategory(church: ChurchWithRelations, category: string) {
  return church.tags.filter((t) => t.tag.category === category).map((t) => t.tag.label)
}

export function toChurchSummary(church: ChurchWithRelations) {
  const status = computeMapStatus(church.experiences)
  const transparency = computeTransparency(church.experiences)
  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination,
    address: church.address,
    city: church.city,
    lat: church.lat,
    lng: church.lng,
    cover: church.coverImage,
    summary: church.summary,
    status,
    theology: tagsByCategory(church, "THEOLOGY"),
    accessibility: tagsByCategory(church, "ACCESSIBILITY"),
    worship: tagsByCategory(church, "WORSHIP"),
    community: tagsByCategory(church, "COMMUNITY"),
    mentalHealth: tagsByCategory(church, "MENTAL_HEALTH"),
    transparency,
  }
}

export function toChurchDetail(church: ChurchWithRelations) {
  const snapshot = computeSnapshot(church.experiences)
  const transparency = computeTransparency(church.experiences)
  const status = computeMapStatus(church.experiences)

  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination,
    address: church.address,
    city: church.city,
    website: church.website,
    serviceTimes: church.serviceTimes,
    attendance: church.attendance,
    cover: church.coverImage,
    logo: church.logoImage,
    summary: church.summary,
    lat: church.lat,
    lng: church.lng,
    status,
    snapshot,
    transparency,
    theology: church.tags
      .filter((t) => t.tag.category === "THEOLOGY")
      .map((t) => ({ label: t.tag.label, icon: t.tag.icon })),
    accessibility: tagsByCategory(church, "ACCESSIBILITY"),
    worship: tagsByCategory(church, "WORSHIP"),
    community: tagsByCategory(church, "COMMUNITY"),
    mentalHealth: tagsByCategory(church, "MENTAL_HEALTH"),
  }
}

export const churchIncludeForShaping = {
  tags: { include: { tag: true } },
  experiences: {
    where: { moderationStatus: "APPROVED" as const },
    select: {
      createdAt: true,
      feltSafe: true,
      feltRespected: true,
      wouldReturn: true,
      lgbtqExperience: true,
      womenInLeadership: true,
      accessibilityRating: true,
      mentalHealthRating: true,
      identities: { select: { identity: { select: { label: true } } } },
    },
  },
} as const
