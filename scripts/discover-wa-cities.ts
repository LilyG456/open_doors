/**
 * One-off: fetches ChurchFinder.com's Washington state index page and
 * extracts every /churches/wa/<city-slug> link it lists — the authoritative
 * source of which city pages actually exist (and their exact slugs), rather
 * than guessing. Writes scripts/wa-cities.json, which
 * scripts/import-church-finder-wa.ts reads to work through the whole state
 * a batch at a time without ever re-deriving the list.
 *
 * Usage: npx tsx scripts/discover-wa-cities.ts
 */
import { writeFileSync } from "fs"
import { join } from "path"

const INDEX_URL = "https://www.churchfinder.com/churches/wa"
const USER_AGENT = "OpenDoorsChurchDirectory/1.0 (contact: lilyggustafson13@gmail.com)"

async function main() {
  const res = await fetch(INDEX_URL, { headers: { "User-Agent": USER_AGENT } })
  if (!res.ok) throw new Error(`Failed to fetch ${INDEX_URL}: ${res.status}`)
  const html = await res.text()

  const slugs = new Set<string>()
  const linkPattern = /\/churches\/wa\/([a-z0-9-]+)/gi
  let match: RegExpExecArray | null
  while ((match = linkPattern.exec(html))) {
    slugs.add(match[1].toLowerCase())
  }

  const sorted = [...slugs].sort()
  console.log(`Found ${sorted.length} WA city slugs.`)
  console.log(sorted.slice(0, 20).join(", "), sorted.length > 20 ? "..." : "")

  const outPath = join(__dirname, "wa-cities.json")
  writeFileSync(outPath, JSON.stringify(sorted, null, 2) + "\n")
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
