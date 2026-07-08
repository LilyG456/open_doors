/**
 * Data-driven matching from a raw denomination string (an OSM `denomination`
 * tag, a church's own self-description, free text typed by an admin) to a
 * Denomination record — via the DenominationAlias table, not a hardcoded JS
 * lookup, so coverage can be extended from the admin panel without a deploy.
 *
 * No PrismaClient is imported at module scope here on purpose: this module
 * is shared between the Next.js app (which uses the shared adapter client in
 * lib/prisma.ts) and one-off scripts under scripts/ (which construct their
 * own PrismaClient). Callers pass in whichever client they already have.
 */
import type { PrismaClient } from "@prisma/client"
import { NON_DENOMINATIONAL_MARKERS } from "../prisma/denominations"

export type DenominationMatch =
  | { kind: "matched"; denominationId: string }
  // Raw string explicitly says "no denomination" (e.g. "Non-denominational")
  // — there is nothing to match, and this should never show up as an
  // outstanding item in the admin triage queue.
  | { kind: "non-denominational" }
  // Didn't recognize the string at all. Surfaced for admin triage: either
  // add an alias pointing at an existing Denomination, or create a new one.
  | { kind: "unmatched" }

export function normalizeDenominationString(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s()]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

const NORMALIZED_NON_DENOMINATIONAL_MARKERS = new Set(
  NON_DENOMINATIONAL_MARKERS.map(normalizeDenominationString),
)

export function isNonDenominationalRaw(raw: string): boolean {
  return NORMALIZED_NON_DENOMINATIONAL_MARKERS.has(normalizeDenominationString(raw))
}

/** In-memory alias index, for matching many churches (import/backfill scripts) without one query per church. */
export type DenominationIndex = {
  aliasToId: ReadonlyMap<string, string>
}

export async function loadDenominationIndex(prisma: PrismaClient): Promise<DenominationIndex> {
  const aliases = await prisma.denominationAlias.findMany({
    select: { alias: true, denominationId: true },
  })
  return { aliasToId: new Map(aliases.map((a) => [a.alias, a.denominationId])) }
}

// Splits a raw string like "Episcopal;Lutheran" or "Episcopal/Anglican" into
// candidate denomination names. Source data (mainly OSM) sometimes lists
// more than one this way for a church formally tied to multiple
// denominations at once — see the multi-value handling below.
const MULTI_VALUE_SEPARATOR = /[;/,&|]| and /i

function splitMultiValue(raw: string): string[] {
  return raw
    .split(MULTI_VALUE_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** The alias reserved for the "formally affiliated with more than one denomination" placeholder — see prisma/denominations.ts. */
const ECUMENICAL_ALIAS = "ecumenical"

export function matchDenominationWithIndex(
  raw: string | null | undefined,
  index: DenominationIndex,
): DenominationMatch {
  if (!raw || !raw.trim()) return { kind: "unmatched" }
  if (isNonDenominationalRaw(raw)) return { kind: "non-denominational" }

  const denominationId = index.aliasToId.get(normalizeDenominationString(raw))
  if (denominationId) return { kind: "matched", denominationId }

  const segments = splitMultiValue(raw)
  if (segments.length >= 2) {
    const matchedIds = new Set<string>()
    for (const segment of segments) {
      if (isNonDenominationalRaw(segment)) continue
      const id = index.aliasToId.get(normalizeDenominationString(segment))
      if (id) matchedIds.add(id)
    }
    // Exactly one distinct match means the segments were redundant labels for
    // the same body (e.g. "Episcopal;Anglican") — a confident single match,
    // not an ecumenical case. Two or more distinct matches means the church
    // is genuinely tied to multiple denominations at once.
    if (matchedIds.size === 1) {
      return { kind: "matched", denominationId: [...matchedIds][0] }
    }
    if (matchedIds.size >= 2) {
      const ecumenicalId = index.aliasToId.get(ECUMENICAL_ALIAS)
      if (ecumenicalId) return { kind: "matched", denominationId: ecumenicalId }
    }
  }

  return { kind: "unmatched" }
}

/** Convenience one-off lookup (single church, e.g. an admin action). For bulk matching, load an index once instead. */
export async function matchDenomination(
  raw: string | null | undefined,
  prisma: PrismaClient,
): Promise<DenominationMatch> {
  const index = await loadDenominationIndex(prisma)
  return matchDenominationWithIndex(raw, index)
}
