import type {
  BeliefConfidence,
  Governance,
  LgbtqExperience,
  PolicyStatus,
  Tradition,
  TriState,
} from "@prisma/client"
import { majority, type AggregatableExperience } from "./aggregation"

/**
 * Combines three layers — in this priority order — into one confidence-
 * labeled value per belief topic, so the UI never has to guess where a
 * number came from:
 *
 *   1. ChurchVerification — an admin has confirmed this specific church's
 *      own website/statement says something (confidence: "Verified from
 *      church website").
 *   2. Aggregated visitor Experience reports (confidence: "Reported by
 *      visitor") — only for the two topics visitors are actually asked
 *      about (LGBTQ affirmation, women in leadership). Same-sex marriage and
 *      the denomination's own structure have no visitor-report analog.
 *   3. The linked Denomination record (confidence: "Denomination-level
 *      only") — background, not a claim about this congregation.
 *   4. Nothing at all (confidence: "Unknown").
 *
 * This mirrors lib/aggregation.ts: everything here is a pure function
 * computed at read time from already-stored facts, not a cached verdict.
 */

export type BeliefValue = PolicyStatus // reuse YES/NO/VARIES/UNKNOWN/NOT_APPLICABLE as the one shared vocabulary

export type ResolvedBelief = {
  value: BeliefValue
  confidence: BeliefConfidence
  /** Human-readable sentence explaining where `value` came from — always shown next to it, never just the raw enum. */
  description: string
}

export type DenominationSourceInfo = { url: string; label: string | null }

export type DenominationInfo = {
  id: string
  name: string
  tradition: Tradition
  governance: Governance
  originsNote: string | null
  founded: number | null
  headquarters: string | null
  membershipApprox: string | null
  website: string | null
  beliefsUrl: string | null
  notes: string | null
  lastUpdated: Date
  sources: DenominationSourceInfo[]
}

export type DenominationalContext = {
  /** Null if the church isn't linked to any denomination record — either unmatched (see admin triage) or genuinely non-denominational. */
  denomination: DenominationInfo | null
  /** True when the raw denomination string explicitly says "non-denominational"/"independent" — a real answer, not a gap in our data. */
  isNonDenominational: boolean
  topics: {
    lgbtqClergy: ResolvedBelief
    sameSexMarriage: ResolvedBelief
    requiresChurchesSameSexMarriage: ResolvedBelief
    womenPastors: ResolvedBelief
    womenBishops: ResolvedBelief
  }
}

export type ChurchVerificationInput = {
  lgbtqClergy: PolicyStatus | null
  sameSexMarriage: PolicyStatus | null
  requiresChurchesSameSexMarriage: PolicyStatus | null
  womenPastors: PolicyStatus | null
  womenBishops: PolicyStatus | null
  sourceUrl: string
  note: string | null
  verifiedAt: Date
} | null

export type DenominationRefInput = {
  id: string
  name: string
  tradition: Tradition
  governance: Governance
  originsNote: string | null
  founded: number | null
  headquarters: string | null
  membershipApprox: string | null
  website: string | null
  beliefsUrl: string | null
  notes: string | null
  lastUpdated: Date
  allowsLgbtqClergy: PolicyStatus
  allowsSameSexMarriage: PolicyStatus
  requiresChurchesSameSexMarriage: PolicyStatus
  allowsWomenPastors: PolicyStatus
  allowsWomenBishops: PolicyStatus
  sources: DenominationSourceInfo[]
} | null

function unknown(description = "Not enough information to say."): ResolvedBelief {
  return { value: "UNKNOWN", confidence: "UNKNOWN", description }
}

function fromDenominationOnly(status: PolicyStatus, denominationName: string, topicLabel: string): ResolvedBelief {
  if (status === "UNKNOWN") {
    return unknown(`${denominationName} doesn't have a clearly documented position on ${topicLabel} in our sources yet.`)
  }
  return {
    value: status,
    confidence: "DENOMINATION_ONLY",
    description: `${denominationName}'s denomination-level position. Individual ${denominationName} congregations may not all follow this in practice.`,
  }
}

function fromVerification(status: PolicyStatus, verifiedAt: Date): ResolvedBelief {
  return {
    value: status,
    confidence: "VERIFIED_CHURCH_WEBSITE",
    description: `Confirmed directly from this church's own website or public statement (checked ${verifiedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}).`,
  }
}

function fromVisitorReports(value: BeliefValue, count: number): ResolvedBelief {
  return {
    value,
    confidence: "VISITOR_REPORTED",
    description: `Based on ${count} visitor-submitted report${count === 1 ? "" : "s"} about this specific church, not the denomination.`,
  }
}

/** LgbtqExperience -> the shared YES/NO/VARIES vocabulary. NOT_REPORTED means "no signal," same as null — excluded from the majority pool. */
function lgbtqExperienceSignal(experiences: AggregatableExperience[]): { value: BeliefValue; count: number } | null {
  const withSignal = experiences.filter(
    (e): e is AggregatableExperience & { lgbtqExperience: LgbtqExperience } =>
      e.lgbtqExperience !== null && e.lgbtqExperience !== "NOT_REPORTED",
  )
  if (withSignal.length === 0) return null
  const maj = majority(withSignal.map((e) => e.lgbtqExperience))
  if (maj === null) return null
  const value: BeliefValue = maj === "AFFIRMING" ? "YES" : maj === "NOT_AFFIRMING" ? "NO" : "VARIES"
  return { value, count: withSignal.length }
}

/** TriState -> the shared vocabulary. UNKNOWN means "no signal," same as null — excluded from the majority pool. */
function womenLeadershipSignal(experiences: AggregatableExperience[]): { value: BeliefValue; count: number } | null {
  const withSignal = experiences.filter(
    (e): e is AggregatableExperience & { womenInLeadership: TriState } =>
      e.womenInLeadership !== null && e.womenInLeadership !== "UNKNOWN",
  )
  if (withSignal.length === 0) return null
  const maj = majority(withSignal.map((e) => e.womenInLeadership))
  if (maj === null) return null
  const value: BeliefValue = maj === "YES" ? "YES" : maj === "NO" ? "NO" : "VARIES"
  return { value, count: withSignal.length }
}

export function computeDenominationalContext(
  isNonDenominationalRaw: boolean,
  denominationRef: DenominationRefInput,
  verification: ChurchVerificationInput,
  experiences: AggregatableExperience[],
): DenominationalContext {
  const denomination: DenominationInfo | null = denominationRef
    ? {
        id: denominationRef.id,
        name: denominationRef.name,
        tradition: denominationRef.tradition,
        governance: denominationRef.governance,
        originsNote: denominationRef.originsNote,
        founded: denominationRef.founded,
        headquarters: denominationRef.headquarters,
        membershipApprox: denominationRef.membershipApprox,
        website: denominationRef.website,
        beliefsUrl: denominationRef.beliefsUrl,
        notes: denominationRef.notes,
        lastUpdated: denominationRef.lastUpdated,
        sources: denominationRef.sources,
      }
    : null

  function resolve(
    topicLabel: string,
    verifiedStatus: PolicyStatus | null | undefined,
    visitorSignal: { value: BeliefValue; count: number } | null,
    denominationStatus: PolicyStatus | undefined,
  ): ResolvedBelief {
    if (verifiedStatus) return fromVerification(verifiedStatus, verification!.verifiedAt)
    if (visitorSignal) return fromVisitorReports(visitorSignal.value, visitorSignal.count)
    if (denominationRef && denominationStatus) return fromDenominationOnly(denominationStatus, denominationRef.name, topicLabel)
    if (isNonDenominationalRaw) {
      return unknown(`This congregation identifies as non-denominational or independent, so there's no denominational body to reference for ${topicLabel}.`)
    }
    return unknown()
  }

  return {
    denomination,
    isNonDenominational: isNonDenominationalRaw,
    topics: {
      lgbtqClergy: resolve(
        "LGBTQ clergy",
        verification?.lgbtqClergy,
        lgbtqExperienceSignal(experiences),
        denominationRef?.allowsLgbtqClergy,
      ),
      sameSexMarriage: resolve(
        "same-sex marriage",
        verification?.sameSexMarriage,
        null, // no visitor-report field captures this specifically
        denominationRef?.allowsSameSexMarriage,
      ),
      // Ordinarily this is purely structural — whether the *denomination*
      // mandates member churches perform same-sex weddings is a fact about
      // the denomination, not something visitors report on. But a specific
      // church's own website occasionally states its position on this
      // directly (e.g. explicitly opting in/out where the denomination
      // leaves it to local discretion), so an admin verification still
      // takes priority if one exists.
      requiresChurchesSameSexMarriage: resolve(
        "whether churches are required to perform same-sex marriages",
        verification?.requiresChurchesSameSexMarriage,
        null,
        denominationRef?.requiresChurchesSameSexMarriage,
      ),
      womenPastors: resolve(
        "women pastors",
        verification?.womenPastors,
        womenLeadershipSignal(experiences),
        denominationRef?.allowsWomenPastors,
      ),
      // Also ordinarily structural — whether women may hold the
      // denomination's highest office is usually a fact about the
      // denomination as a whole — but again, an admin's direct verification
      // from the church's own site takes priority if one has been recorded.
      womenBishops: resolve(
        "women in the denomination's highest office",
        verification?.womenBishops,
        null,
        denominationRef?.allowsWomenBishops,
      ),
    },
  }
}
