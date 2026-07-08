/**
 * Pure text-matching logic for the website-scanning half of the
 * Verification Queue (see scripts/scan-church-websites.ts). Deliberately not
 * an LLM call: it's a deterministic, explainable heuristic — look for an
 * explicit affiliation phrase ("affiliated with...", "cooperating with...")
 * followed closely by a denomination name/alias, or failing that, any
 * denomination name/alias mentioned anywhere on the page. Every suggestion
 * carries the exact snippet that triggered it, so a reviewer never has to
 * take the confidence number on faith.
 *
 * Kept free of network/DB calls so it can be unit-tested and reused by the
 * script without either dragging the other in.
 */

export type ScanCandidate = {
  denominationId: string
  denominationName: string
  /** Normalized (lowercase) alias text to search for — see lib/denomination-matching.ts. */
  alias: string
}

export type ScanMatch = {
  matched: true
  denominationId: string
  denominationName: string
  /** 0-100. 95 for an explicit affiliation phrase, 70 for a bare mention with no such phrase nearby. */
  confidence: number
  evidence: string
}

export type ScanResult = ScanMatch | { matched: false }

const AFFILIATION_PHRASES = [
  "affiliated with",
  "affiliated to",
  "cooperating with",
  "a cooperating church of",
  "cooperates with",
  "member of",
  "member church of",
  "a ministry of",
  "part of the",
  "belongs to",
  "proud member of",
  "credentialed with",
  "ordained in",
  "denomination:",
]

const AFFILIATION_MATCH_WINDOW = 120

// "The holy catholic Church" (Apostles' Creed) / "one holy catholic and
// apostolic Church" (Nicene Creed) are recited across nearly every
// Christian tradition — Protestant, Orthodox, Catholic alike — as a
// statement about the universal Church, not a denominational affiliation
// claim. Without this guard, "catholic" as a bare-mention alias flags
// almost any church with a doctrinal statement page as Roman Catholic —
// confirmed against a real non-Catholic church's "beliefs" page in testing.
const CREED_GUARD_PATTERNS = [/holy catholic/i, /catholic and apostolic/i]

function isCreedRecitation(window: string): boolean {
  return CREED_GUARD_PATTERNS.some((p) => p.test(window))
}

export function extractPageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#0?39;|&rsquo;|&#8217;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;|&#8220;|&#8221;/gi, '"')
    .replace(/\s+/g, " ")
    .trim()
}

/** Candidate links worth following one level deep — beliefs/about/missions/affiliation pages tend to state this more explicitly than a homepage. */
export function extractRelevantLinks(html: string, baseUrl: string, max = 2): string[] {
  const found: string[] = []
  const anchorRegex = /<a\b[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi
  const relevantPattern = /about|belief|doctrin|mission|affiliat|denomination|who-we-are|statement-of-faith/i

  let match: RegExpExecArray | null
  while ((match = anchorRegex.exec(html)) !== null && found.length < max * 3) {
    const [, href, text] = match
    if (!relevantPattern.test(href) && !relevantPattern.test(text)) continue
    try {
      const resolved = new URL(href, baseUrl).toString()
      if (new URL(resolved).origin !== new URL(baseUrl).origin) continue
      if (!found.includes(resolved)) found.push(resolved)
    } catch {
      // Malformed href — skip it.
    }
  }
  return found.slice(0, max)
}

function wordBoundaryIndexOf(haystackLower: string, needleLower: string): number {
  const escaped = needleLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i")
  const m = re.exec(haystackLower)
  return m ? m.index : -1
}

export function scanTextForDenomination(text: string, candidates: ScanCandidate[]): ScanResult {
  if (candidates.length === 0) return { matched: false }
  const lower = text.toLowerCase()
  // Longest alias first, so "southern baptist convention" wins over a bare "baptist" match.
  const sorted = [...candidates].sort((a, b) => b.alias.length - a.alias.length)

  for (const phrase of AFFILIATION_PHRASES) {
    let searchFrom = 0
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(phrase, searchFrom)
      if (idx === -1) break
      const windowEnd = Math.min(lower.length, idx + phrase.length + AFFILIATION_MATCH_WINDOW)
      const window = lower.slice(idx, windowEnd)
      const hit = !isCreedRecitation(window) && sorted.find((c) => wordBoundaryIndexOf(window, c.alias) !== -1)
      if (hit) {
        const snippetStart = Math.max(0, idx - 20)
        return {
          matched: true,
          denominationId: hit.denominationId,
          denominationName: hit.denominationName,
          confidence: 95,
          evidence: text.slice(snippetStart, windowEnd).trim(),
        }
      }
      searchFrom = idx + phrase.length
    }
  }

  // Bare mention, no affiliation phrase nearby — meaningfully weaker
  // evidence than the phrase-adjacent tier above (a staff bio mentioning
  // where someone *used to* work reads identically to this church's own
  // affiliation to a keyword search). Confidence is capped well below the
  // "pretty sure" range specifically so reviewers read the snippet rather
  // than rubber-stamp it.
  for (const c of sorted) {
    const idx = wordBoundaryIndexOf(lower, c.alias)
    if (idx === -1) continue
    const snippetStart = Math.max(0, idx - 60)
    const snippetEnd = Math.min(text.length, idx + c.alias.length + 60)
    const window = text.slice(snippetStart, snippetEnd)
    if (isCreedRecitation(window)) continue
    return {
      matched: true,
      denominationId: c.denominationId,
      denominationName: c.denominationName,
      confidence: 55,
      evidence: window.trim(),
    }
  }

  return { matched: false }
}
