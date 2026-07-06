import { z } from "zod"

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
