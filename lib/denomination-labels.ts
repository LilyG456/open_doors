/**
 * Human-readable labels/descriptions for the Tradition and Governance enums —
 * shared between the public Denominational Context card and the admin forms
 * so the two never drift apart.
 *
 * Governance terms in particular get an explanatory tooltip: several of them
 * (Episcopal, Presbyterian, Congregational) are also the literal names of
 * specific denominations, and a governance *structure* shared by many bodies
 * is easy to misread as a claim about which specific denomination this is.
 */

// Ordered roughly by how commonly a US-based visitor would encounter each
// tradition, with general/fallback buckets last. ORTHODOX and CONFESSIONAL
// are deliberately excluded — see the "Deprecated" comment on the Tradition
// enum in schema.prisma. Nothing here should reference them going forward;
// EASTERN_ORTHODOX/ORIENTAL_ORTHODOX and LUTHERAN replace them respectively.
export const TRADITION_OPTIONS = [
  "CATHOLIC",
  "EASTERN_ORTHODOX",
  "ORIENTAL_ORTHODOX",
  "BAPTIST",
  "METHODIST",
  "LUTHERAN",
  "PRESBYTERIAN",
  "ANGLICAN",
  "PENTECOSTAL",
  "RESTORATION_MOVEMENT",
  "LATTER_DAY_SAINT",
  "SEVENTH_DAY_ADVENTIST",
  "NON_DENOMINATIONAL",
  "ECUMENICAL",
  "MAINLINE_PROTESTANT",
  "EVANGELICAL",
  "WESLEYAN_HOLINESS",
  "ANABAPTIST",
  "OTHER",
  "UNKNOWN",
] as const

export const GOVERNANCE_OPTIONS = [
  "EPISCOPAL",
  "PRESBYTERIAN",
  "CONGREGATIONAL",
  "CONNECTIONAL",
  "HIERARCHICAL",
  "REPRESENTATIVE",
  "SYNODICAL",
  "COOPERATIVE",
  "OTHER",
  "UNKNOWN",
] as const

export const TRADITION_LABEL: Record<string, string> = {
  CATHOLIC: "Catholic",
  EASTERN_ORTHODOX: "Eastern Orthodox",
  ORIENTAL_ORTHODOX: "Oriental Orthodox",
  BAPTIST: "Baptist",
  METHODIST: "Methodist",
  LUTHERAN: "Lutheran",
  PRESBYTERIAN: "Presbyterian",
  ANGLICAN: "Anglican",
  PENTECOSTAL: "Pentecostal",
  RESTORATION_MOVEMENT: "Restoration Movement",
  LATTER_DAY_SAINT: "Latter-day Saint Restoration Movement",
  SEVENTH_DAY_ADVENTIST: "Seventh-day Adventist",
  NON_DENOMINATIONAL: "Non-denominational",
  ECUMENICAL: "Ecumenical",
  MAINLINE_PROTESTANT: "Mainline Protestant",
  EVANGELICAL: "Evangelical",
  WESLEYAN_HOLINESS: "Wesleyan-Holiness",
  ANABAPTIST: "Anabaptist",
  OTHER: "Other",
  UNKNOWN: "Unknown",
  // Deprecated (see schema.prisma) — kept only so a historical value that
  // somehow still exists on a row renders as something legible.
  ORTHODOX: "Orthodox (unspecified)",
  CONFESSIONAL: "Confessional",
}

/**
 * Shown in an info tooltip next to the Tradition fact — only defined for
 * values that are easy to conflate with each other. Ecumenical and
 * Non-denominational in particular look similar ("not tied to one specific
 * denomination") but describe different things: Non-denominational means no
 * denominational affiliation at all, while Ecumenical covers two distinct
 * situations — a formal multi-denomination affiliation, or a congregation
 * that draws its members and worship style from many church backgrounds
 * without necessarily being formally affiliated with more than one.
 */
export const TRADITION_DESCRIPTION: Record<string, string> = {
  ECUMENICAL:
    "Covers two different things, both distinct from \"Non-denominational\" (which means no denominational affiliation at all): a formal tie to more than one denomination at once — e.g. a federated or union church, or a congregation in full communion with two traditions — or a congregation whose members and leadership come from many different church backgrounds, and which draws on and blends elements of those traditions in its worship and community life without necessarily being formally affiliated with more than one denomination.",
  NON_DENOMINATIONAL:
    "Not formally affiliated with any denomination. This is different from \"Ecumenical,\" which means formally affiliated with more than one denomination at once rather than none.",
}

export const GOVERNANCE_LABEL: Record<string, string> = {
  EPISCOPAL: "Episcopal",
  PRESBYTERIAN: "Presbyterian",
  CONGREGATIONAL: "Congregational",
  CONNECTIONAL: "Connectional",
  HIERARCHICAL: "Hierarchical",
  REPRESENTATIVE: "Representative",
  SYNODICAL: "Synodical",
  COOPERATIVE: "Cooperative",
  OTHER: "Other",
  UNKNOWN: "Unknown",
}

/** Shown in an info tooltip next to the Governance fact — describes the structure, and explicitly disclaims the name-collision where one exists. */
export const GOVERNANCE_DESCRIPTION: Record<string, string> = {
  EPISCOPAL:
    "Led by bishops in a hierarchical structure, with authority over regional dioceses. This describes a structure used by many denominations (including the Roman Catholic Church and Orthodox churches) — it is not the same as \"The Episcopal Church,\" which is one specific denomination that also happens to use this structure.",
  PRESBYTERIAN:
    "Governed by elected elders (\"presbyters\"), rather than bishops or a single top-down authority. This describes a structure — it is not the same as \"Presbyterian Church (USA)\" or other specific Presbyterian denominations that use this structure.",
  CONGREGATIONAL:
    "Each local church governs itself independently, with no higher denominational body making binding decisions for it. This describes a structure used by many independent and Baptist churches — it is not the same as a denomination literally named \"Congregational.\"",
  CONNECTIONAL:
    "Local churches are connected through regional and national conferences, with authority shared between local and denominational levels — the structure used by the United Methodist Church and similar bodies.",
  HIERARCHICAL:
    "Authority flows through a single, centralized leadership structure with binding authority over local congregations — the structure used by the Church of Jesus Christ of Latter-day Saints and similar centrally-governed bodies.",
  REPRESENTATIVE:
    "Shared authority through elected representatives and assemblies, rather than a single top-down authority or fully independent local churches — the structure used by the Church of the Nazarene and similar bodies.",
  SYNODICAL:
    "Governed through synods or regional church bodies that share authority with individual congregations — the structure used by many Lutheran denominations.",
  COOPERATIVE:
    "Local churches are independently governed but voluntarily cooperate with a wider convention or fellowship on missions, funding, and shared identity, without that body having binding authority over them — the structure used by the Southern Baptist Convention and Assemblies of God.",
  OTHER: "This body's governance doesn't map cleanly onto the categories above — see its notes for specifics.",
  UNKNOWN: "Governance structure not yet documented here.",
}

export function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}
