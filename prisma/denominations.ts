/**
 * Denomination-level reference data — background context about a religious
 * body/tradition, never a claim about any specific local congregation.
 *
 * Every belief field on a *named* denomination (UMC, PC(USA), SBC, etc.) is
 * backed by at least one source URL below, because an unsourced claim about
 * something this sensitive isn't something we're willing to assert. Where we
 * don't have a citation from research, the field is left UNKNOWN rather than
 * filled in from general impression — see the "family placeholder" entries.
 *
 * `founded` / `headquarters` / `membershipApprox` are lower-stakes, widely
 * documented organizational facts (not sourced individually here); everything
 * under `beliefs` is what's shown in the Denominational Context UI and does
 * carry sources + a last-checked date.
 */

import type { PrismaClient } from "@prisma/client"
import { Governance, PolicyStatus, Tradition } from "@prisma/client"

export type DenominationSourceSeed = { url: string; label?: string }

export type DenominationSeed = {
  name: string
  tradition: Tradition
  governance: Governance
  /** A sentence or two of descriptive context, shown under "Origins" instead of a bare year — see the Denomination model comment. */
  originsNote?: string
  founded?: number
  headquarters?: string
  membershipApprox?: string
  website?: string
  beliefsUrl?: string
  beliefs: {
    allowsLgbtqClergy: PolicyStatus
    allowsSameSexMarriage: PolicyStatus
    requiresChurchesSameSexMarriage: PolicyStatus
    allowsWomenPastors: PolicyStatus
    allowsWomenBishops: PolicyStatus
  }
  notes: string
  lastUpdated: Date
  sources: DenominationSourceSeed[]
  /** Normalized (lowercase) raw strings — from OSM tags, church websites, or free text — that should resolve to this denomination. */
  aliases: string[]
}

// "Last checked" for this whole dataset — the day this research was compiled
// into the app. Individual re-verification should update a denomination's
// own `lastUpdated` instead of this constant.
const CHECKED_ON = new Date("2026-07-07")

export const DENOMINATIONS: DenominationSeed[] = [
  {
    name: "United Methodist Church",
    tradition: Tradition.METHODIST,
    governance: Governance.CONNECTIONAL,
    originsNote:
      "Formed in 1968 by the merger of the Methodist Church and the Evangelical United Brethren Church, both rooted in the 18th-century Wesleyan revival within the Church of England.",
    founded: 1968,
    headquarters: "Nashville, TN (no single global headquarters; general agencies are distributed)",
    membershipApprox: "~4.4 million in the U.S. (post-2024 disaffiliation wave)",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.YES,
      allowsSameSexMarriage: PolicyStatus.YES,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.YES,
      allowsWomenBishops: PolicyStatus.YES,
    },
    notes:
      "Following the 2024 General Conference, the denomination removed restrictions on LGBTQ clergy and same-sex marriage. Individual pastors and churches retain discretion regarding weddings. Women may serve in all ordained offices.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://apnews.com/article/methodist-lutheran-episcopal-presbyterian-lgbtq-samesex-marriage-ef5755c84d49896c520b5835e6169317",
        label: "AP News: mainline denominations and LGBTQ/same-sex marriage policy",
      },
    ],
    aliases: ["united methodist church", "umc", "united methodist"],
  },
  {
    name: "Presbyterian Church (USA)",
    tradition: Tradition.PRESBYTERIAN,
    governance: Governance.PRESBYTERIAN,
    originsNote:
      "Formed in 1983 by the reunion of northern and southern Presbyterian denominations that had split over slavery and the Civil War in 1861. Presbyterianism in America traces back to Scottish and Scots-Irish immigrants in the early 1700s.",
    founded: 1983,
    headquarters: "Louisville, KY",
    membershipApprox: "~1.1 million",
    website: "https://www.pcusa.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.YES,
      allowsSameSexMarriage: PolicyStatus.YES,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.YES,
      allowsWomenBishops: PolicyStatus.YES,
    },
    notes:
      "The PC(USA) ordains women and LGBTQ clergy and permits same-sex marriage, while local sessions and pastors retain discretion in some ministry decisions. Women may serve in all leadership roles. (PC(USA) has no bishop office; \"allows women bishops\" here reflects its highest elected leadership roles, e.g. Moderator/Co-Moderator of General Assembly.)",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://pcusa.org/how-we-serve/inclusion-%26amp%3B-equity/womens-ministry?",
        label: "PC(USA): Women's Ministry / Inclusion & Equity",
      },
    ],
    aliases: [
      "presbyterian church (usa)",
      "presbyterian church usa",
      "pc(usa)",
      "pcusa",
      "pc usa",
    ],
  },
  {
    name: "Episcopal Church",
    tradition: Tradition.ANGLICAN,
    governance: Governance.EPISCOPAL,
    originsNote:
      "Organized in 1789 as the American branch of the Church of England following the Revolutionary War. Part of the worldwide Anglican Communion, which traces its roots to the English Reformation in the 16th century.",
    founded: 1789,
    headquarters: "New York, NY",
    membershipApprox: "~1.5 million",
    website: "https://www.episcopalchurch.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.YES,
      allowsSameSexMarriage: PolicyStatus.YES,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.YES,
      allowsWomenBishops: PolicyStatus.YES,
    },
    notes:
      "The Episcopal Church ordains women and LGBTQ clergy and permits same-sex marriage across the denomination (part of the worldwide Anglican Communion), while some pastoral discretion remains at the parish/diocesan level.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://www.episcopalchurch.org/organizations-affiliations/lgbtq/",
        label: "The Episcopal Church: LGBTQ ministries",
      },
    ],
    aliases: ["episcopal church", "episcopalian", "the episcopal church", "tec", "anglican"],
  },
  {
    name: "Evangelical Lutheran Church in America",
    tradition: Tradition.LUTHERAN,
    governance: Governance.SYNODICAL,
    originsNote:
      "Formed in 1988 by the merger of three Lutheran church bodies. Lutheranism traces back to Martin Luther's 16th-century Reformation in Germany.",
    founded: 1988,
    headquarters: "Chicago, IL",
    membershipApprox: "~2.8 million",
    website: "https://www.elca.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.YES,
      allowsSameSexMarriage: PolicyStatus.YES,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.YES,
      allowsWomenBishops: PolicyStatus.YES,
    },
    notes:
      "The ELCA has allowed partnered LGBTQ clergy since 2009 and provides marriage liturgies for same-sex couples. Individual congregations and synods retain some discretion. Women may serve as pastors and bishops.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://www.elca.org/how-we-serve/elca-in-society/lgbtqia?",
        label: "ELCA: LGBTQIA+ ministry",
      },
    ],
    aliases: ["evangelical lutheran church in america", "elca"],
  },
  {
    name: "Lutheran Church—Missouri Synod",
    tradition: Tradition.LUTHERAN,
    governance: Governance.SYNODICAL,
    originsNote:
      "Organized in 1847 by German Lutheran immigrants seeking to preserve confessional Lutheran teaching. Lutheranism traces back to Martin Luther's 16th-century Reformation in Germany.",
    founded: 1847,
    headquarters: "St. Louis, MO",
    membershipApprox: "~1.7 million",
    website: "https://www.lcms.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.NO,
      allowsSameSexMarriage: PolicyStatus.NO,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.NO,
      allowsWomenBishops: PolicyStatus.NOT_APPLICABLE,
    },
    notes:
      "The LCMS teaches that homosexual behavior is contrary to God's will and reserves the pastoral office for qualified men. There is no women's-bishop question in LCMS polity since ordination itself is male-only.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://www.lcms.org/about/beliefs/faqs/denominations?",
        label: "LCMS: About our beliefs (FAQ)",
      },
    ],
    aliases: [
      "lutheran church missouri synod",
      "lutheran church—missouri synod",
      "lcms",
      "missouri synod",
    ],
  },
  {
    name: "Southern Baptist Convention",
    tradition: Tradition.BAPTIST,
    governance: Governance.CONGREGATIONAL,
    originsNote:
      "Formed in 1845 when Baptist churches in the southern United States split from northern Baptists over slavery. Baptist tradition traces back to English Separatism in the early 1600s.",
    founded: 1845,
    headquarters: "Nashville, TN",
    membershipApprox: "~12.7 million",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.NO,
      allowsSameSexMarriage: PolicyStatus.NO,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.NO,
      allowsWomenBishops: PolicyStatus.NOT_APPLICABLE,
    },
    notes:
      "The SBC's doctrinal statement (the Baptist Faith & Message) affirms marriage between one man and one woman and teaches that the office of pastor is reserved for qualified men. Individual churches are self-governing and voluntarily cooperate through the Convention; a 2026 constitutional amendment on women serving as pastors was under debate as of this writing, so this may be an area of active change worth rechecking.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://christian.net/theology-and-spirituality/what-do-southern-baptist-believe-about-homosexuality/#southernbaptistviewsonlgbtq+inclusioninthechurch_1_6",
        label: "Southern Baptist views on LGBTQ inclusion",
      },
      {
        url: "https://www.usatoday.com/story/news/nation/2026/06/10/sbc-southern-baptists-women-pastors-constitutional-amendment/90488154007/",
        label: "USA Today: SBC women-pastors constitutional amendment (2026-06-10)",
      },
    ],
    aliases: ["southern baptist convention", "sbc", "southern baptist"],
  },
  {
    name: "Roman Catholic Church",
    tradition: Tradition.CATHOLIC,
    governance: Governance.EPISCOPAL,
    originsNote:
      "Traditionally traces its origins to the early Christian Church in the 1st century AD (approximately AD 33), with an unbroken institutional history since — making a single \"founding year\" less meaningful than for most other bodies listed here.",
    headquarters: "Vatican City",
    membershipApprox: "~1.4 billion worldwide; ~52 million in the U.S.",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.NO,
      allowsSameSexMarriage: PolicyStatus.NO,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.NO,
      allowsWomenBishops: PolicyStatus.NO,
    },
    notes:
      "The Catholic Church teaches that marriage is between one man and one woman and reserves priestly ordination (and by extension the episcopate) to men. It distinguishes between pastoral respect for LGBTQ persons and its formal teaching on sexual ethics; openly sexually active LGBTQ persons are not eligible for ordination under current discipline.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://www.hrc.org/resources/stances-of-faiths-on-lgbt-issues-roman-catholic-church",
        label: "HRC: Stances of Faiths on LGBT Issues — Roman Catholic Church",
      },
      {
        url: "https://www.thecatholictelegraph.com/pope-francis-explains-to-america-magazine-why-women-cannot-be-ordained-priests/84328",
        label: "The Catholic Telegraph: Pope Francis on why women cannot be ordained priests",
      },
    ],
    aliases: ["roman catholic church", "roman catholic", "catholic", "catholic church", "catholicism"],
  },
  {
    name: "Assemblies of God",
    tradition: Tradition.PENTECOSTAL,
    governance: Governance.COOPERATIVE,
    originsNote:
      "Organized in 1914 in Hot Springs, Arkansas, growing out of the Pentecostal revival movement of the early 1900s (notably the 1906 Azusa Street Revival in Los Angeles).",
    founded: 1914,
    headquarters: "Springfield, MO",
    membershipApprox: "~3.1 million (U.S.)",
    website: "https://ag.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.NO,
      allowsSameSexMarriage: PolicyStatus.NO,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.YES,
      allowsWomenBishops: PolicyStatus.YES,
    },
    notes:
      "The Assemblies of God ordains women to all ministry offices while maintaining traditional teachings on marriage and sexuality.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://ag.org/Beliefs/Position-Papers/Women-in-Ministerial-Leadership",
        label: "AG: Women in Ministerial Leadership (position paper)",
      },
      {
        url: "https://ag.org/Beliefs/Position-Papers/Homosexuality-Marriage-and-Sexual-Identity",
        label: "AG: Homosexuality, Marriage, and Sexual Identity (position paper)",
      },
    ],
    aliases: ["assemblies of god", "assembly of god", "ag"],
  },
  {
    name: "Church of the Nazarene",
    tradition: Tradition.WESLEYAN_HOLINESS,
    governance: Governance.REPRESENTATIVE,
    originsNote:
      "Formed in 1908 by the merger of several Wesleyan-Holiness groups, part of the 19th-century Holiness movement rooted in Methodist teaching on Christian sanctification.",
    founded: 1908,
    headquarters: "Lenexa, KS",
    membershipApprox: "~660,000 (U.S./Canada)",
    website: "https://nazarene.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.NO,
      allowsSameSexMarriage: PolicyStatus.NO,
      requiresChurchesSameSexMarriage: PolicyStatus.NO,
      allowsWomenPastors: PolicyStatus.YES,
      allowsWomenBishops: PolicyStatus.YES,
    },
    notes:
      "The Church of the Nazarene affirms women in all ordained ministry roles (it has no bishop office; district/general superintendent is the equivalent highest office and is open to women) while maintaining traditional teachings on marriage and sexuality. Governance is representative — delegates elected at district and general assemblies, rather than a single top-down hierarchy.",
    lastUpdated: CHECKED_ON,
    sources: [
      {
        url: "https://nazarene.org/global-clergy-development/women-clergy/?",
        label: "Church of the Nazarene: Women clergy",
      },
      {
        url: "https://www.hrc.org/resources/stances-of-faiths-on-lgbt-issues-church-of-the-nazarene",
        label: "HRC: Stances of Faiths on LGBT Issues — Church of the Nazarene",
      },
    ],
    aliases: ["church of the nazarene", "nazarene"],
  },
  {
    name: "The Church of Jesus Christ of Latter-day Saints",
    tradition: Tradition.LATTER_DAY_SAINT,
    // Structural fact, not a belief claim: LDS governance runs through a
    // centralized First Presidency and Quorum of the Twelve Apostles with
    // binding authority over the whole church, unlike a synod or convention
    // that individual congregations can also act independently of.
    governance: Governance.HIERARCHICAL,
    originsNote:
      "Founded in 1830 by Joseph Smith in western New York, part of the 19th-century American Restorationist movement — distinct from the earlier, unrelated Restoration Movement (Stone-Campbell) tradition of the same era.",
    founded: 1830,
    headquarters: "Salt Lake City, UT",
    membershipApprox: "~6.8 million (U.S.)",
    website: "https://www.churchofjesuschrist.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "We haven't yet individually researched and sourced this church's current positions on these questions, so the fields above are left unknown rather than assumed — check the church's own published materials.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: [
      "the church of jesus christ of latter-day saints",
      "the church of jesus christ of latter day saints",
      "lds",
      "lds church",
      "latter-day saints",
      "latter day saints",
      "mormon",
      "mormons",
    ],
  },
  {
    name: "Seventh-day Adventist Church",
    tradition: Tradition.SEVENTH_DAY_ADVENTIST,
    // Governed through elected representatives at local, conference, union,
    // and General Conference levels — not a single central hierarchy and
    // not fully independent local churches either.
    governance: Governance.REPRESENTATIVE,
    originsNote:
      "Formally organized in 1863 in Battle Creek, Michigan, growing out of the 19th-century Millerite Adventist movement's expectation of Christ's imminent return.",
    founded: 1863,
    headquarters: "Silver Spring, MD",
    membershipApprox: "~1.2 million (U.S.); ~22 million worldwide",
    website: "https://www.adventist.org",
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "We haven't yet individually researched and sourced this church's current positions on these questions, so the fields above are left unknown rather than assumed — check the church's own published materials. (Note: women's ordination has been a long-running, unresolved debate within Adventist General Conference sessions; regional conferences have sometimes taken differing positions.)",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: ["seventh-day adventist", "seventh day adventist", "sda", "adventist"],
  },
]

/**
 * "Family" placeholders for when a raw string names a broad tradition
 * ("Baptist", "Methodist", "Orthodox"...) without enough specificity to
 * identify one actual governing body. Every belief field stays UNKNOWN here
 * on purpose — we have no single source that speaks for the whole family,
 * and the notes say so explicitly instead of guessing.
 */
export const FAMILY_PLACEHOLDERS: DenominationSeed[] = [
  {
    name: "Baptist (denomination unspecified)",
    tradition: Tradition.BAPTIST,
    governance: Governance.CONGREGATIONAL,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "\"Baptist\" covers many independently-governed bodies — including the Southern Baptist Convention, American Baptist Churches USA, and National Baptist Convention — that differ substantially on these questions. This placeholder is used when a specific Baptist body couldn't be identified from the available listing; check the congregation's own materials or its specific convention/association.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: ["baptist"],
  },
  {
    name: "Methodist (denomination unspecified)",
    tradition: Tradition.METHODIST,
    governance: Governance.CONNECTIONAL,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "\"Methodist\" covers multiple distinct bodies — most notably the United Methodist Church and the Global Methodist Church, which split from it in 2022 specifically over LGBTQ inclusion — that now differ sharply on these questions. This placeholder is used when a specific Methodist body couldn't be identified from the available listing.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: ["methodist"],
  },
  {
    name: "Lutheran (denomination unspecified)",
    tradition: Tradition.LUTHERAN,
    governance: Governance.SYNODICAL,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "\"Lutheran\" covers multiple distinct bodies — including the Evangelical Lutheran Church in America (ELCA), the Lutheran Church—Missouri Synod (LCMS), and the Wisconsin Evangelical Lutheran Synod (WELS) — that differ substantially on these questions. This placeholder is used when a specific Lutheran body couldn't be identified from the available listing.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: ["lutheran"],
  },
  {
    name: "Eastern Orthodox (jurisdiction unspecified)",
    tradition: Tradition.EASTERN_ORTHODOX,
    governance: Governance.EPISCOPAL,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "Eastern Orthodoxy includes multiple national/jurisdictional churches (Greek, Russian, Antiochian, Orthodox Church in America, and others) that share a broadly similar tradition but are administratively distinct. We haven't individually researched and sourced belief positions for each jurisdiction yet, so specific fields are left unknown rather than assumed — see the specific parish or jurisdiction's own materials.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: [
      "orthodox",
      "eastern orthodox",
      "greek orthodox",
      "russian orthodox",
      "antiochian orthodox",
      "orthodox church in america",
      "oca",
      "serbian orthodox",
      "romanian orthodox",
      "ukrainian orthodox",
      "bulgarian orthodox",
      "georgian orthodox",
    ],
  },
  {
    name: "Oriental Orthodox (jurisdiction unspecified)",
    // Distinct communion from Eastern Orthodox — Oriental Orthodox churches
    // didn't accept the Council of Chalcedon (451 AD) and have been
    // administratively separate ever since, even though the two traditions
    // are often casually conflated as just "Orthodox."
    tradition: Tradition.ORIENTAL_ORTHODOX,
    governance: Governance.EPISCOPAL,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "Oriental Orthodoxy includes multiple national/jurisdictional churches (Coptic, Armenian Apostolic, Syriac, Ethiopian, Eritrean, Malankara, and others) that share a broadly similar tradition but are administratively distinct — and are theologically and historically a separate communion from Eastern Orthodoxy, not a subset of it. We haven't individually researched and sourced belief positions for each jurisdiction yet, so specific fields are left unknown rather than assumed.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: [
      "oriental orthodox",
      "coptic orthodox",
      "coptic",
      "armenian orthodox",
      "armenian apostolic",
      "syriac orthodox",
      "ethiopian orthodox",
      "eritrean orthodox",
      "malankara orthodox",
    ],
  },
  {
    name: "Restoration Movement (denomination unspecified)",
    // Stone-Campbell Restoration Movement — not to be confused with the
    // unrelated 19th-century Latter-day Saint Restorationist movement, or
    // with the "United Church of Christ," a distinct, unrelated mainline
    // denomination whose name is easy to mistake for "Churches of Christ."
    tradition: Tradition.RESTORATION_MOVEMENT,
    governance: Governance.CONGREGATIONAL,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "The 19th-century Restoration (\"Stone-Campbell\") Movement split over the 20th century into several distinct, independently-governed branches — including the a cappella Churches of Christ, the more progressive Christian Church (Disciples of Christ), and the evangelical Christian Churches and Churches of Christ — that differ substantially from each other on these questions. This placeholder is used when a specific branch couldn't be identified from the available listing.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: [
      "restoration movement",
      "stone-campbell",
      "churches of christ",
      "christian church (disciples of christ)",
      "disciples of christ",
      "christian churches and churches of christ",
    ],
  },
  {
    name: "Pentecostal (denomination unspecified)",
    tradition: Tradition.PENTECOSTAL,
    governance: Governance.UNKNOWN,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "\"Pentecostal\" covers many distinct bodies and independent congregations — including the Assemblies of God, Church of God in Christ, and Foursquare Church — that differ on these questions. This placeholder is used when a specific Pentecostal body couldn't be identified from the available listing.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: ["pentecostal"],
  },
  {
    name: "Ecumenical / Multi-denominational (unspecified)",
    // Genuinely distinct from "non-denominational": "ecumenical" covers two
    // different things here, neither of which is "no denomination at all" —
    // (1) formally affiliated with more than one denomination at once (a
    // federated/union church, or full-communion partnerships), or (2) a
    // congregation whose members and leadership come from many different
    // church backgrounds and that draws on and blends those traditions in
    // its worship and community life, without necessarily having a formal
    // multi-denomination tie. lib/denomination-matching.ts also routes here
    // automatically when a raw string like "Episcopal;Lutheran" resolves to
    // two or more distinct denominations (sense 1) — see its alias
    // "ecumenical" below, which that logic looks up by name.
    tradition: Tradition.ECUMENICAL,
    governance: Governance.OTHER,
    beliefs: {
      allowsLgbtqClergy: PolicyStatus.UNKNOWN,
      allowsSameSexMarriage: PolicyStatus.UNKNOWN,
      requiresChurchesSameSexMarriage: PolicyStatus.UNKNOWN,
      allowsWomenPastors: PolicyStatus.UNKNOWN,
      allowsWomenBishops: PolicyStatus.UNKNOWN,
    },
    notes:
      "\"Ecumenical\" here covers two different situations: a congregation formally tied to more than one denomination at once (e.g. a federated or union church), or a congregation whose members and leadership come from many different church backgrounds and that draws on and blends elements of those traditions in its worship and community life, without necessarily having a formal multi-denomination tie. Either way, a single governance structure or set of positions can't be assumed — practice varies by which traditions are involved and how deeply. This placeholder is used when the specifics weren't identified from the available listing.",
    lastUpdated: CHECKED_ON,
    sources: [],
    aliases: ["ecumenical", "multi-denominational", "multidenominational", "interdenominational", "union church", "federated church"],
  },
]

/**
 * Raw strings that mean "explicitly not part of any denomination" — these
 * should never be treated as "unmatched" in the admin triage queue, since
 * there's nothing to match. lib/denomination-matching.ts checks this set
 * before falling back to alias lookup.
 */
export const NON_DENOMINATIONAL_MARKERS = [
  "non-denominational",
  "nondenominational",
  "non denominational",
  "independent",
  "christian (denomination not specified)",
  "unaffiliated",
  // Deliberately NOT here: "interdenominational". Despite the surface
  // similarity to "non-denominational," it means the opposite — cooperating
  // across denominations rather than having no denomination — so it's an
  // alias on the Ecumenical placeholder above instead.
]

export const ALL_DENOMINATION_SEEDS = [...DENOMINATIONS, ...FAMILY_PLACEHOLDERS]

/** Upserts every denomination, its sources, and its aliases. Safe to re-run. */
export async function seedDenominations(prisma: PrismaClient) {
  for (const d of ALL_DENOMINATION_SEEDS) {
    const record = await prisma.denomination.upsert({
      where: { name: d.name },
      update: {
        tradition: d.tradition,
        governance: d.governance,
        originsNote: d.originsNote ?? null,
        founded: d.founded ?? null,
        headquarters: d.headquarters ?? null,
        membershipApprox: d.membershipApprox ?? null,
        website: d.website ?? null,
        beliefsUrl: d.beliefsUrl ?? null,
        allowsLgbtqClergy: d.beliefs.allowsLgbtqClergy,
        allowsSameSexMarriage: d.beliefs.allowsSameSexMarriage,
        requiresChurchesSameSexMarriage: d.beliefs.requiresChurchesSameSexMarriage,
        allowsWomenPastors: d.beliefs.allowsWomenPastors,
        allowsWomenBishops: d.beliefs.allowsWomenBishops,
        notes: d.notes,
        lastUpdated: d.lastUpdated,
      },
      create: {
        name: d.name,
        tradition: d.tradition,
        governance: d.governance,
        originsNote: d.originsNote ?? null,
        founded: d.founded ?? null,
        headquarters: d.headquarters ?? null,
        membershipApprox: d.membershipApprox ?? null,
        website: d.website ?? null,
        beliefsUrl: d.beliefsUrl ?? null,
        allowsLgbtqClergy: d.beliefs.allowsLgbtqClergy,
        allowsSameSexMarriage: d.beliefs.allowsSameSexMarriage,
        requiresChurchesSameSexMarriage: d.beliefs.requiresChurchesSameSexMarriage,
        allowsWomenPastors: d.beliefs.allowsWomenPastors,
        allowsWomenBishops: d.beliefs.allowsWomenBishops,
        notes: d.notes,
        lastUpdated: d.lastUpdated,
      },
    })

    // Re-derive sources from scratch each run rather than diffing — seed
    // data is the source of truth here, and this list is short per denomination.
    await prisma.denominationSource.deleteMany({ where: { denominationId: record.id } })
    if (d.sources.length > 0) {
      await prisma.denominationSource.createMany({
        data: d.sources.map((s) => ({ denominationId: record.id, url: s.url, label: s.label ?? null })),
      })
    }

    for (const alias of d.aliases) {
      await prisma.denominationAlias.upsert({
        where: { alias },
        update: { denominationId: record.id },
        create: { alias, denominationId: record.id },
      })
    }
  }
}
