import "dotenv/config"
import { TagCategory, MemberStatus, LgbtqExperience, TriState } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

// The full "I am..." taxonomy used for both user profiles ("People Like Me")
// and the identity chips shown on an experience. "Straight Ally" is included
// here even though it wasn't in the old mock's filter list, because it shows
// up as an identity chip in the example stories.
const IDENTITIES = [
  "Gay",
  "Lesbian",
  "Bi",
  "Trans",
  "Nonbinary",
  "Questioning",
  "Parent",
  "Young Adult",
  "College Student",
  "Conservative Christian",
  "Progressive Christian",
  "Deconstructing",
  "New to Church",
  "Straight Ally",
]

const THEOLOGY_TAGS: { label: string; icon: string }[] = [
  { label: "Fully Affirming", icon: "rainbow" },
  { label: "Women Pastors", icon: "users" },
  { label: "Contemporary Worship", icon: "music" },
  { label: "Bible Study", icon: "book-open" },
  { label: "Coffee Hour", icon: "coffee" },
  { label: "Family Ministries", icon: "baby" },
  { label: "Liturgical Worship", icon: "music" },
  { label: "Egalitarian", icon: "scale" },
  { label: "Traditional", icon: "book-open" },
  { label: "Mixed Experiences", icon: "circle-dot" },
  { label: "Complementarian", icon: "scale" },
  { label: "College Ministry", icon: "graduation-cap" },
  { label: "Blended Worship", icon: "music" },
  { label: "Small Groups", icon: "users-round" },
  { label: "Shared Meals", icon: "coffee" },
]

const ACCESSIBILITY_TAGS = [
  "Wheelchair",
  "Hearing Assistance",
  "Livestream",
  "Quiet Room",
  "Gender Neutral Bathrooms",
  "Sensory Friendly",
]

const WORSHIP_TAGS = ["Contemporary", "Traditional", "Liturgical", "Blended"]

const COMMUNITY_TAGS = ["College Students", "Young Adults", "Families", "Singles", "Seniors"]

const MENTAL_HEALTH_TAGS = [
  "Counseling Available",
  "Therapy Encouraged",
  "Recovery Ministry",
  "Mental Health Discussed",
]

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

type SeedStory = {
  displayName: string
  email: string
  visitLabel: string
  memberStatus: MemberStatus
  text: string
  identities: string[]
  feltSafe: boolean | null
  feltRespected: boolean | null
  wouldReturn: boolean | null
  lgbtqExperience: LgbtqExperience | null
  womenInLeadership: TriState | null
  accessibilityRating: number | null
  mentalHealthRating: number | null
  daysAgo: number
}

type SeedChurch = {
  slug: string
  name: string
  denomination: string
  address: string
  city: string
  website: string
  serviceTimes: string[]
  attendance: string
  coverImage: string
  summary: string
  lat: number
  lng: number
  theology: string[]
  accessibility: string[]
  worship: string[]
  community: string[]
  mentalHealth: string[]
  // Roughly what share of "quiet" filler experiences should land positive,
  // used only to make the seeded Community Snapshot look plausible for a demo.
  fillerPositiveRate: number
  fillerCount: number
  stories: SeedStory[]
}

const CHURCHES: SeedChurch[] = [
  {
    slug: "grace-commons",
    name: "Grace Commons Church",
    denomination: "Non-denominational",
    address: "1204 E 6th St, Austin, TX 78702",
    city: "Austin, TX",
    website: "https://example.com/grace-commons",
    serviceTimes: ["Sunday 9:30 AM", "Sunday 11:15 AM"],
    attendance: "~450 weekly",
    coverImage: "/images/church-1.png",
    summary: "A warm, informal community that speaks openly about belonging and mental health.",
    lat: 30.267,
    lng: -97.72,
    theology: ["Fully Affirming", "Women Pastors", "Contemporary Worship", "Bible Study", "Coffee Hour", "Family Ministries"],
    accessibility: ["Wheelchair", "Hearing Assistance", "Livestream", "Gender Neutral Bathrooms", "Quiet Room"],
    worship: ["Contemporary", "Blended"],
    community: ["Young Adults", "Families", "College Students"],
    mentalHealth: ["Counseling Available", "Mental Health Discussed", "Recovery Ministry"],
    fillerPositiveRate: 0.88,
    fillerCount: 11,
    stories: [
      {
        displayName: "River",
        email: "river@seed.opendoors.local",
        visitLabel: "3 visits",
        memberStatus: "VISITOR",
        text: "I visited alone and immediately had people introduce themselves without being overwhelming. The pastor spoke openly about mental health, and I felt respected even though I wasn't sure where I stood.",
        identities: ["Lesbian", "Young Adult"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: "AFFIRMING",
        womenInLeadership: "YES",
        accessibilityRating: 4,
        mentalHealthRating: 5,
        daysAgo: 61,
      },
      {
        displayName: "Marcus",
        email: "marcus@seed.opendoors.local",
        visitLabel: "Attending 2 years",
        memberStatus: "CURRENT_MEMBER",
        text: "We brought our kids and found a community that genuinely welcomes questions. Leadership is transparent about where they stand, which I really appreciated.",
        identities: ["Straight Ally", "Parent"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: null,
        womenInLeadership: "YES",
        accessibilityRating: 4,
        mentalHealthRating: 4,
        daysAgo: 30,
      },
      {
        displayName: "Dev",
        email: "dev@seed.opendoors.local",
        visitLabel: "5 visits",
        memberStatus: "REGULAR_ATTENDER",
        text: "The gender-neutral bathrooms were a small thing that told me a lot. People used my name and pronouns without making it a moment.",
        identities: ["Trans", "Questioning"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: "AFFIRMING",
        womenInLeadership: "YES",
        accessibilityRating: 5,
        mentalHealthRating: 4,
        daysAgo: 21,
      },
    ],
  },
  {
    slug: "st-marks-mainline",
    name: "St. Mark's Episcopal",
    denomination: "Mainline Protestant",
    address: "780 Congress Ave, Austin, TX 78701",
    city: "Austin, TX",
    website: "https://example.com/st-marks",
    serviceTimes: ["Sunday 8:00 AM", "Sunday 10:30 AM"],
    attendance: "~300 weekly",
    coverImage: "/images/church-3.png",
    summary: "A liturgical, contemplative congregation with a long history of welcome and accessibility.",
    lat: 30.274,
    lng: -97.743,
    theology: ["Fully Affirming", "Women Pastors", "Liturgical Worship", "Egalitarian", "Coffee Hour"],
    accessibility: ["Wheelchair", "Hearing Assistance", "Sensory Friendly", "Gender Neutral Bathrooms"],
    worship: ["Liturgical", "Traditional"],
    community: ["Seniors", "Families", "Singles"],
    mentalHealth: ["Counseling Available", "Therapy Encouraged"],
    fillerPositiveRate: 0.9,
    fillerCount: 9,
    stories: [
      {
        displayName: "Aya",
        email: "aya@seed.opendoors.local",
        visitLabel: "Attending 4 years",
        memberStatus: "CURRENT_MEMBER",
        text: "The liturgy gives me space to just be present. No one has ever made me feel like I had to perform or explain myself here.",
        identities: ["Bi"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: "AFFIRMING",
        womenInLeadership: "YES",
        accessibilityRating: 5,
        mentalHealthRating: 4,
        daysAgo: 14,
      },
      {
        displayName: "Jordan",
        email: "jordan@seed.opendoors.local",
        visitLabel: "2 visits",
        memberStatus: "VISITOR",
        text: "As someone new to church, the printed order of service helped me follow along without feeling lost. Welcoming without pressure.",
        identities: ["Nonbinary", "New to Church"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: "AFFIRMING",
        womenInLeadership: "YES",
        accessibilityRating: 5,
        mentalHealthRating: 3,
        daysAgo: 30,
      },
    ],
  },
  {
    slug: "cornerstone-fellowship",
    name: "Cornerstone Fellowship",
    denomination: "Evangelical",
    address: "455 Barton Springs Rd, Austin, TX 78704",
    city: "Austin, TX",
    website: "https://example.com/cornerstone",
    serviceTimes: ["Sunday 9:00 AM", "Sunday 11:00 AM"],
    attendance: "~1,200 weekly",
    coverImage: "/images/church-2.png",
    summary: "A large, active congregation with contemporary worship and varied reported experiences.",
    lat: 30.259,
    lng: -97.762,
    theology: ["Traditional", "Mixed Experiences", "Contemporary Worship", "Complementarian", "Family Ministries", "College Ministry"],
    accessibility: ["Wheelchair", "Livestream", "Hearing Assistance"],
    worship: ["Contemporary"],
    community: ["Families", "Young Adults", "College Students"],
    mentalHealth: ["Mental Health Discussed", "Recovery Ministry"],
    fillerPositiveRate: 0.62,
    fillerCount: 13,
    stories: [
      {
        displayName: "Sam",
        email: "sam@seed.opendoors.local",
        visitLabel: "6 visits",
        memberStatus: "FORMER_MEMBER",
        text: "The worship and community were genuinely warm, and I made close friends. I also found the teaching on some topics harder to sit with over time. Both things were true for me.",
        identities: ["Gay", "Deconstructing"],
        feltSafe: true,
        feltRespected: null,
        wouldReturn: null,
        lgbtqExperience: "MIXED",
        womenInLeadership: "SOME",
        accessibilityRating: 4,
        mentalHealthRating: 3,
        daysAgo: 35,
      },
      {
        displayName: "Priya",
        email: "priya@seed.opendoors.local",
        visitLabel: "Attending 3 years",
        memberStatus: "CURRENT_MEMBER",
        text: "Great kids programs and small groups. I'd encourage LGBTQ friends to ask questions directly, since experiences seem to vary by group.",
        identities: ["Straight Ally", "Parent"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: null,
        womenInLeadership: "SOME",
        accessibilityRating: 4,
        mentalHealthRating: 3,
        daysAgo: 21,
      },
    ],
  },
  {
    slug: "riverside-community",
    name: "Riverside Community Church",
    denomination: "Non-denominational",
    address: "2100 Lakeshore Blvd, Austin, TX 78741",
    city: "Austin, TX",
    website: "https://example.com/riverside",
    serviceTimes: ["Sunday 10:00 AM"],
    attendance: "~220 weekly",
    coverImage: "/images/church-4.png",
    summary: "A younger, mission-minded community focused on hospitality and small groups.",
    lat: 30.245,
    lng: -97.71,
    theology: ["Fully Affirming", "Women Pastors", "Blended Worship", "Small Groups", "Coffee Hour", "College Ministry"],
    accessibility: ["Wheelchair", "Quiet Room", "Gender Neutral Bathrooms", "Livestream"],
    worship: ["Blended", "Contemporary"],
    community: ["Young Adults", "College Students", "Singles"],
    mentalHealth: ["Therapy Encouraged", "Mental Health Discussed", "Counseling Available"],
    fillerPositiveRate: 0.85,
    fillerCount: 6,
    stories: [
      {
        displayName: "Elliot",
        email: "elliot@seed.opendoors.local",
        visitLabel: "4 visits",
        memberStatus: "REGULAR_ATTENDER",
        text: "The small group I joined actually made space for doubt. That felt rare and really healing for me.",
        identities: ["Questioning", "Young Adult"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: "AFFIRMING",
        womenInLeadership: "YES",
        accessibilityRating: 3,
        mentalHealthRating: 5,
        daysAgo: 7,
      },
    ],
  },
  {
    slug: "holy-trinity",
    name: "Holy Trinity Parish",
    denomination: "Catholic",
    address: "600 Guadalupe St, Austin, TX 78701",
    city: "Austin, TX",
    website: "https://example.com/holy-trinity",
    serviceTimes: ["Saturday 5:00 PM", "Sunday 8:00 AM", "Sunday 11:00 AM"],
    attendance: "~800 weekly",
    coverImage: "/images/church-3.png",
    summary: "A historic parish with limited reported experiences so far. Reach out to learn more.",
    lat: 30.271,
    lng: -97.746,
    theology: ["Traditional", "Liturgical Worship", "Family Ministries", "Complementarian"],
    accessibility: ["Wheelchair", "Hearing Assistance"],
    worship: ["Liturgical", "Traditional"],
    community: ["Families", "Seniors"],
    mentalHealth: ["Mental Health Discussed"],
    fillerPositiveRate: 0.7,
    fillerCount: 1,
    stories: [
      {
        displayName: "Anon",
        email: "anon-holy-trinity@seed.opendoors.local",
        visitLabel: "1 visit",
        memberStatus: "VISITOR",
        text: "Beautiful, reverent service. I can only speak to one visit, so take my perspective as just that.",
        identities: ["Straight Ally"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: null,
        lgbtqExperience: "NOT_REPORTED",
        womenInLeadership: "NO",
        accessibilityRating: 3,
        mentalHealthRating: 2,
        daysAgo: 42,
      },
    ],
  },
  {
    slug: "open-table",
    name: "Open Table Church",
    denomination: "Mainline Protestant",
    address: "1515 S Lamar Blvd, Austin, TX 78704",
    city: "Austin, TX",
    website: "https://example.com/open-table",
    serviceTimes: ["Sunday 10:30 AM", "Wednesday 7:00 PM"],
    attendance: "~180 weekly",
    coverImage: "/images/church-2.png",
    summary: "A small, affirming community centered on shared meals, justice, and belonging.",
    lat: 30.252,
    lng: -97.782,
    theology: ["Fully Affirming", "Women Pastors", "Egalitarian", "Blended Worship", "Shared Meals"],
    accessibility: ["Wheelchair", "Sensory Friendly", "Gender Neutral Bathrooms", "Quiet Room", "Hearing Assistance"],
    worship: ["Blended"],
    community: ["Young Adults", "Singles", "Families"],
    mentalHealth: ["Therapy Encouraged", "Counseling Available", "Mental Health Discussed"],
    fillerPositiveRate: 0.93,
    fillerCount: 6,
    stories: [
      {
        displayName: "Nadia",
        email: "nadia@seed.opendoors.local",
        visitLabel: "Attending 1 year",
        memberStatus: "CURRENT_MEMBER",
        text: "This is the first church where I stopped bracing myself at the door. The shared meal after service is where I finally felt like I belonged.",
        identities: ["Trans", "Progressive Christian"],
        feltSafe: true,
        feltRespected: true,
        wouldReturn: true,
        lgbtqExperience: "AFFIRMING",
        womenInLeadership: "YES",
        accessibilityRating: 5,
        mentalHealthRating: 5,
        daysAgo: 14,
      },
    ],
  },
]

async function main() {
  console.log("Seeding identities...")
  for (const [i, label] of IDENTITIES.entries()) {
    await prisma.identity.upsert({
      where: { label },
      update: { order: i },
      create: { label, order: i },
    })
  }

  console.log("Seeding tags...")
  for (const t of THEOLOGY_TAGS) {
    await prisma.tag.upsert({
      where: { label_category: { label: t.label, category: TagCategory.THEOLOGY } },
      update: { icon: t.icon },
      create: { label: t.label, category: TagCategory.THEOLOGY, icon: t.icon },
    })
  }
  for (const label of ACCESSIBILITY_TAGS) {
    await prisma.tag.upsert({
      where: { label_category: { label, category: TagCategory.ACCESSIBILITY } },
      update: {},
      create: { label, category: TagCategory.ACCESSIBILITY },
    })
  }
  for (const label of WORSHIP_TAGS) {
    await prisma.tag.upsert({
      where: { label_category: { label, category: TagCategory.WORSHIP } },
      update: {},
      create: { label, category: TagCategory.WORSHIP },
    })
  }
  for (const label of COMMUNITY_TAGS) {
    await prisma.tag.upsert({
      where: { label_category: { label, category: TagCategory.COMMUNITY } },
      update: {},
      create: { label, category: TagCategory.COMMUNITY },
    })
  }
  for (const label of MENTAL_HEALTH_TAGS) {
    await prisma.tag.upsert({
      where: { label_category: { label, category: TagCategory.MENTAL_HEALTH } },
      update: {},
      create: { label, category: TagCategory.MENTAL_HEALTH },
    })
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@seed.opendoors.local" },
    update: {},
    create: { email: "admin@seed.opendoors.local", displayName: "Admin", role: "ADMIN" },
  })
  console.log(`Admin demo account: ${admin.email} (sign in via magic link, then approve moderation queue at /admin/moderation)`) // eslint-disable-line no-console

  for (const church of CHURCHES) {
    console.log(`Seeding ${church.name}...`)

    const allTagLabels: { label: string; category: TagCategory }[] = [
      ...church.theology.map((label) => ({ label, category: TagCategory.THEOLOGY })),
      ...church.accessibility.map((label) => ({ label, category: TagCategory.ACCESSIBILITY })),
      ...church.worship.map((label) => ({ label, category: TagCategory.WORSHIP })),
      ...church.community.map((label) => ({ label, category: TagCategory.COMMUNITY })),
      ...church.mentalHealth.map((label) => ({ label, category: TagCategory.MENTAL_HEALTH })),
    ]
    const tagRecords = await Promise.all(
      allTagLabels.map(({ label, category }) =>
        prisma.tag.findUniqueOrThrow({ where: { label_category: { label, category } } }),
      ),
    )

    const churchRecord = await prisma.church.upsert({
      where: { slug: church.slug },
      update: {
        name: church.name,
        denomination: church.denomination,
        address: church.address,
        city: church.city,
        website: church.website,
        serviceTimes: church.serviceTimes,
        attendance: church.attendance,
        coverImage: church.coverImage,
        summary: church.summary,
        lat: church.lat,
        lng: church.lng,
      },
      create: {
        slug: church.slug,
        name: church.name,
        denomination: church.denomination,
        address: church.address,
        city: church.city,
        website: church.website,
        serviceTimes: church.serviceTimes,
        attendance: church.attendance,
        coverImage: church.coverImage,
        summary: church.summary,
        lat: church.lat,
        lng: church.lng,
      },
    })

    await prisma.churchTag.deleteMany({ where: { churchId: churchRecord.id } })
    await prisma.churchTag.createMany({
      data: tagRecords.map((t) => ({ churchId: churchRecord.id, tagId: t.id })),
    })

    // Clear out any previously seeded experiences for this church so re-running
    // `prisma db seed` is idempotent instead of piling up duplicates.
    await prisma.experience.deleteMany({ where: { churchId: churchRecord.id } })

    for (const story of church.stories) {
      const user = await prisma.user.upsert({
        where: { email: story.email },
        update: {},
        create: { email: story.email, displayName: story.displayName },
      })
      const identityIds = await prisma.identity.findMany({
        where: { label: { in: story.identities } },
        select: { id: true },
      })
      await prisma.experience.create({
        data: {
          churchId: churchRecord.id,
          userId: user.id,
          displayName: story.displayName,
          visitLabel: story.visitLabel,
          memberStatus: story.memberStatus,
          text: story.text,
          feltSafe: story.feltSafe,
          feltRespected: story.feltRespected,
          wouldReturn: story.wouldReturn,
          lgbtqExperience: story.lgbtqExperience,
          womenInLeadership: story.womenInLeadership,
          accessibilityRating: story.accessibilityRating,
          mentalHealthRating: story.mentalHealthRating,
          moderationStatus: "APPROVED",
          createdAt: daysAgo(story.daysAgo),
          identities: { create: identityIds.map((i) => ({ identityId: i.id })) },
        },
      })
    }

    // Quiet filler experiences: no story worth reading, just structured
    // answers, so the Community Snapshot and Transparency counts reflect a
    // more realistic sample size than the handful of narrative stories above.
    for (let i = 0; i < church.fillerCount; i++) {
      const positive = i / Math.max(church.fillerCount - 1, 1) < church.fillerPositiveRate
      const email = `filler-${church.slug}-${i}@seed.opendoors.local`
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, displayName: `Visitor ${i + 1}` },
      })
      await prisma.experience.create({
        data: {
          churchId: churchRecord.id,
          userId: user.id,
          displayName: `Visitor ${i + 1}`,
          visitLabel: positive ? "1 visit" : "2 visits",
          memberStatus: "VISITOR",
          text: positive
            ? "Attended a Sunday service and had a warm, low-key first visit."
            : "Attended a service. Experience was mixed and I'm still deciding how I feel.",
          feltSafe: positive,
          feltRespected: positive,
          wouldReturn: positive ? true : Math.random() > 0.5,
          lgbtqExperience: null,
          womenInLeadership: null,
          accessibilityRating: positive ? 4 : 3,
          mentalHealthRating: positive ? 4 : 3,
          moderationStatus: "APPROVED",
          createdAt: daysAgo(30 + i * 45),
        },
      })
    }
  }

  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
