/**
 * Automatic spam/abuse screen run at submission time. This is what decides
 * whether a story publishes immediately (the default) or gets auto-held as
 * PENDING for a moderator to look at — see prisma/schema.prisma. It is
 * intentionally narrow (obvious hate speech, spam patterns, submission rate)
 * so it doesn't become a backdoor way to suppress real stories. Reports from
 * other users never feed into this — see the Report model's comment.
 *
 * This is a minimal starting filter for a small deployment. A production
 * deployment handling real traffic should route submissions through a real
 * moderation service (e.g. an LLM-based moderation endpoint or Google's
 * Perspective API) in addition to, or instead of, these heuristics.
 */

const BLOCKED_PATTERNS: RegExp[] = [
  // Slurs and explicit hate speech. Deliberately not exhaustive — a longer,
  // maintained list belongs in a real moderation service, not hardcoded here.
  /\bf[a@4]g{1,2}(ot|s)?\b/i,
  /\btr[a@4]nn(y|ies)\b/i,
  /\bd[iy]ke[s]?\b/i,
  /\bk[i1]ke[s]?\b/i,
  /\bsp[i1]c[s]?\b/i,
  /\bch[i1]nk[s]?\b/i,
  /\bn[i1]gg(er|a)[s]?\b/i,
  /\bretard(ed)?\b/i,
]

const SPAM_SIGNS: { test: (text: string) => boolean; reason: string }[] = [
  { test: (t) => /(https?:\/\/|www\.)\S+/i.test(t), reason: "contains a link" },
  { test: (t) => /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(t), reason: "contains a phone number" },
  { test: (t) => /(.)\1{6,}/.test(t), reason: "repeated-character spam" },
  {
    test: (t) => {
      const letters = t.replace(/[^a-zA-Z]/g, "")
      if (letters.length < 20) return false
      const upper = letters.replace(/[^A-Z]/g, "").length
      return upper / letters.length > 0.7
    },
    reason: "excessive capitalization",
  },
  {
    test: (t) =>
      /\b(buy now|click here|limited time offer|act now|subscribe now|check out my|dm me|message me on whatsapp)\b/i.test(
        t,
      ),
    reason: "promotional spam phrasing",
  },
]

const RATE_LIMIT_WINDOW_MINUTES = 10
const RATE_LIMIT_MAX_SUBMISSIONS = 3

export { RATE_LIMIT_WINDOW_MINUTES, RATE_LIMIT_MAX_SUBMISSIONS }

export type ModerationResult = { autoHold: boolean; reason: string | null }

export function evaluateSubmission(text: string, recentSubmissionCount: number): ModerationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { autoHold: true, reason: "auto-held: matched the abuse/hate-speech filter" }
    }
  }
  for (const sign of SPAM_SIGNS) {
    if (sign.test(text)) {
      return { autoHold: true, reason: `auto-held: possible spam (${sign.reason})` }
    }
  }
  if (recentSubmissionCount >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return {
      autoHold: true,
      reason: `auto-held: ${RATE_LIMIT_MAX_SUBMISSIONS}+ submissions within ${RATE_LIMIT_WINDOW_MINUTES} minutes`,
    }
  }
  return { autoHold: false, reason: null }
}
