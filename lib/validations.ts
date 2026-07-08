import { z } from "zod"
import { TRADITION_OPTIONS, GOVERNANCE_OPTIONS } from "./denomination-labels"

export const memberStatusValues = [
  "VISITOR",
  "REGULAR_ATTENDER",
  "CURRENT_MEMBER",
  "FORMER_MEMBER",
] as const

export const lgbtqExperienceValues = ["AFFIRMING", "MIXED", "NOT_AFFIRMING", "NOT_REPORTED"] as const
export const triStateValues = ["YES", "SOME", "NO", "UNKNOWN"] as const

export const experienceSubmitSchema = z.object({
  displayName: z.string().trim().max(40).optional(),
  isAnonymous: z.boolean().default(false),
  visitLabel: z.string().trim().min(1).max(60),
  memberStatus: z.enum(memberStatusValues),
  text: z.string().trim().min(20, "Please share a little more detail (at least 20 characters).").max(4000),
  identities: z.array(z.string().trim().min(1)).max(8).default([]),
  feltSafe: z.boolean().nullable().optional(),
  feltRespected: z.boolean().nullable().optional(),
  wouldReturn: z.boolean().nullable().optional(),
  lgbtqExperience: z.enum(lgbtqExperienceValues).nullable().optional(),
  womenInLeadership: z.enum(triStateValues).nullable().optional(),
  accessibilityRating: z.number().int().min(1).max(5).nullable().optional(),
  mentalHealthRating: z.number().int().min(1).max(5).nullable().optional(),
})

export type ExperienceSubmitInput = z.infer<typeof experienceSubmitSchema>

export const churchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
  north: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  west: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Up to 500 so a full map viewport (potentially hundreds of pins in a dense
  // metro area) can load in one request — see components/explore/church-map.tsx.
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
})

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(60).nullable().optional(),
  identities: z.array(z.string().trim().min(1)).max(10).optional(),
})

export const moderationDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
})

export const reportReasonValues = ["SPAM", "HARASSMENT", "NOT_GENUINE", "OTHER"] as const

export const reportSchema = z.object({
  reason: z.enum(reportReasonValues),
  details: z.string().trim().max(500).optional(),
})

// ---------- Denominational Context (admin) ----------

export const policyStatusValues = ["YES", "NO", "VARIES", "UNKNOWN", "NOT_APPLICABLE"] as const
// Single source of truth is lib/denomination-labels.ts — re-exported here so
// existing imports of these two names from lib/validations.ts keep working.
export const traditionValues = TRADITION_OPTIONS
export const governanceValues = GOVERNANCE_OPTIONS

export const denominationUpsertSchema = z.object({
  name: z.string().trim().min(1).max(200),
  tradition: z.enum(traditionValues),
  governance: z.enum(governanceValues),
  originsNote: z.string().trim().max(600).nullable().optional(),
  founded: z.number().int().min(0).max(3000).nullable().optional(),
  headquarters: z.string().trim().max(200).nullable().optional(),
  membershipApprox: z.string().trim().max(200).nullable().optional(),
  website: z.string().trim().url().max(500).nullable().optional().or(z.literal("").transform(() => null)),
  beliefsUrl: z.string().trim().url().max(500).nullable().optional().or(z.literal("").transform(() => null)),
  allowsLgbtqClergy: z.enum(policyStatusValues),
  allowsSameSexMarriage: z.enum(policyStatusValues),
  requiresChurchesSameSexMarriage: z.enum(policyStatusValues),
  allowsWomenPastors: z.enum(policyStatusValues),
  allowsWomenBishops: z.enum(policyStatusValues),
  communionPractice: z.string().trim().max(500).nullable().optional(),
  baptismPractice: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  // yyyy-mm-dd from a native date input — when the admin last checked the
  // belief fields against their sources. Optional so existing API callers
  // that don't send it still work; defaults to today server-side.
  lastUpdated: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional(),
})

export const denominationSourceSchema = z.object({
  url: z.string().trim().url().max(500),
  label: z.string().trim().max(200).nullable().optional(),
})

export const denominationAliasSchema = z.object({
  alias: z.string().trim().min(1).max(200),
})

// Links every church currently carrying this exact raw `denomination` string
// to the given Denomination — see app/api/admin/denominations/[id]/aliases.
export const resolveUnmatchedSchema = z.object({
  rawDenomination: z.string().trim().min(1).max(200),
  denominationId: z.string().trim().min(1),
})

export const churchVerificationSchema = z.object({
  lgbtqClergy: z.enum(policyStatusValues).nullable().optional(),
  sameSexMarriage: z.enum(policyStatusValues).nullable().optional(),
  requiresChurchesSameSexMarriage: z.enum(policyStatusValues).nullable().optional(),
  womenPastors: z.enum(policyStatusValues).nullable().optional(),
  womenBishops: z.enum(policyStatusValues).nullable().optional(),
  sourceUrl: z.string().trim().url().max(500),
  note: z.string().trim().max(1000).nullable().optional(),
})

export const suggestionDecisionSchema = z.object({
  decision: z.enum(["ACCEPT", "REJECT"]),
})

// A direct, one-off correction for a single church — e.g. its raw
// `denomination` string (often from OSM) says "Non-denominational" but an
// admin found a specific affiliation stated on the church's own website.
// Bypasses the alias table entirely, unlike scripts/match-denominations.ts.
export const churchDenominationEditSchema = z.object({
  denomination: z.string().trim().min(1).max(200),
  denominationId: z.string().trim().min(1).nullable(),
})

// Every other admin-editable fact about a church — deliberately separate
// from churchDenominationEditSchema so the denomination-linking form and
// the general facts form can save independently on the same admin page.
export const churchFactsSchema = z.object({
  name: z.string().trim().min(1).max(300),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and single hyphens only."),
  address: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(200),
  state: z.string().trim().max(10).nullable().optional(),
  zip: z.string().trim().max(20).nullable().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  website: z.string().trim().url().max(500).nullable().optional().or(z.literal("").transform(() => null)),
  serviceTimes: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  attendance: z.string().trim().max(100).nullable().optional(),
  coverImage: z.string().trim().max(500).nullable().optional(),
  logoImage: z.string().trim().max(500).nullable().optional(),
  summary: z.string().trim().max(600).nullable().optional(),
})

// Same fields as churchFactsSchema, plus what's needed to create the row in
// the first place (denomination is required on Church; denominationId is
// optional, same as the edit-time denomination-linking flow).
export const churchCreateSchema = churchFactsSchema.extend({
  denomination: z.string().trim().min(1).max(200),
  denominationId: z.string().trim().min(1).nullable().optional(),
})

// ---------- Church Edit Suggestions (community-submitted corrections) ----------

export const churchEditSubmitterRoleValues = ["VISITOR", "CHURCH_REPRESENTATIVE"] as const

export const churchEditSuggestionSchema = z
  .object({
    submitterRole: z.enum(churchEditSubmitterRoleValues),
    website: z.string().trim().url().max(500).nullable().optional().or(z.literal("").transform(() => null)),
    address: z.string().trim().max(300).nullable().optional(),
    city: z.string().trim().max(200).nullable().optional(),
    serviceTimes: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    summary: z.string().trim().max(600).nullable().optional(),
    addAccessibilityTagIds: z.array(z.string().trim().min(1)).max(20).default([]),
    addWorshipTagIds: z.array(z.string().trim().min(1)).max(20).default([]),
    addCommunityTagIds: z.array(z.string().trim().min(1)).max(20).default([]),
    addMentalHealthTagIds: z.array(z.string().trim().min(1)).max(20).default([]),
    addTheologyTagIds: z.array(z.string().trim().min(1)).max(20).default([]),
    note: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (v) =>
      Boolean(
        v.website ||
          v.address?.trim() ||
          v.city?.trim() ||
          v.serviceTimes.length > 0 ||
          v.summary?.trim() ||
          v.addAccessibilityTagIds.length > 0 ||
          v.addWorshipTagIds.length > 0 ||
          v.addCommunityTagIds.length > 0 ||
          v.addMentalHealthTagIds.length > 0 ||
          v.addTheologyTagIds.length > 0 ||
          v.note?.trim(),
      ),
    { message: "Suggest at least one change." },
  )
