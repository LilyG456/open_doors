import { ChurchSourceType, SourceConfidence, ChurchFieldName } from "@prisma/client"

export const CONFIDENCE_RANK: Record<SourceConfidence, number> = {
  UNVERIFIED: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

/**
 * Starting confidence for a source that hasn't been given an explicit one —
 * a rough trust ordering, not a guarantee (a specific OSM tag can still be
 * right, a specific admin entry can still be a guess; this is just where to
 * start).
 */
export const DEFAULT_CONFIDENCE_BY_SOURCE_TYPE: Record<ChurchSourceType, SourceConfidence> = {
  OSM: SourceConfidence.LOW,
  SHEPHERDS_STREAM: SourceConfidence.MEDIUM,
  DENOMINATION_DIRECTORY: SourceConfidence.MEDIUM,
  CHURCH_WEBSITE: SourceConfidence.HIGH,
  USER_SUBMITTED: SourceConfidence.UNVERIFIED,
  ADMIN: SourceConfidence.HIGH,
  // scripts/import-church-finder.ts overrides this down to LOW for listings
  // the church hasn't claimed on ChurchFinder — this default represents the
  // claimed case.
  CHURCH_FINDER: SourceConfidence.MEDIUM,
}

export const SOURCE_TYPE_LABEL: Record<ChurchSourceType, string> = {
  OSM: "OpenStreetMap",
  SHEPHERDS_STREAM: "Shepherd's Stream",
  DENOMINATION_DIRECTORY: "Denomination directory",
  CHURCH_WEBSITE: "Church website",
  USER_SUBMITTED: "User-submitted",
  ADMIN: "Admin",
  CHURCH_FINDER: "ChurchFinder.com",
}

/** Short, UI-facing phrasing for a (sourceType, confidence, reviewed?) combination — see components for exact usage. */
export function describeSource(sourceType: ChurchSourceType, confidence: SourceConfidence): string {
  if (sourceType === "CHURCH_WEBSITE") return "Verified from church website"
  if (sourceType === "DENOMINATION_DIRECTORY") return "Verified by denomination directory"
  if (sourceType === "USER_SUBMITTED" && confidence === "UNVERIFIED") return "User-submitted, pending review"
  if (sourceType === "USER_SUBMITTED") return "User-submitted, reviewed"
  return `Source: ${SOURCE_TYPE_LABEL[sourceType]}`
}

export function outranks(a: SourceConfidence, b: SourceConfidence): boolean {
  return CONFIDENCE_RANK[a] > CONFIDENCE_RANK[b]
}

export const FIELD_LABEL: Record<ChurchFieldName, string> = {
  NAME: "Name",
  ADDRESS: "Address",
  CITY: "City",
  STATE: "State",
  ZIP: "ZIP",
  LAT: "Latitude",
  LNG: "Longitude",
  WEBSITE: "Website",
  PHONE: "Phone",
  SERVICE_TIMES: "Service times",
  ATTENDANCE: "Attendance",
  SUMMARY: "Summary",
  COVER_IMAGE: "Cover image",
  LOGO_IMAGE: "Logo image",
  DENOMINATION: "Denomination",
  ACCESSIBILITY_TAGS: "Accessibility tags",
  WORSHIP_TAGS: "Worship tags",
  COMMUNITY_TAGS: "Community tags",
  MENTAL_HEALTH_TAGS: "Mental health tags",
  THEOLOGY_TAGS: "Theology tags",
}
