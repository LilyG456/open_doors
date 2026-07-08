import type { ExperienceLevel } from "@/lib/types"

// Static taxonomy/config shared by the UI. Church and story data now lives in
// the database (see prisma/schema.prisma) and is fetched via the API routes
// under app/api — see lib/types.ts for those shapes.

export const experienceMeta: Record<
  ExperienceLevel,
  { label: string; color: string; description: string }
> = {
  positive: {
    label: "Mostly positive experiences",
    color: "var(--pin-positive)",
    description: "Many consistent, affirming experiences reported",
  },
  mixed: {
    label: "Mixed experiences",
    color: "var(--pin-mixed)",
    description: "Reported experiences vary between visitors",
  },
  limited: {
    label: "Limited information",
    color: "var(--pin-limited)",
    description: "Few experiences reported so far",
  },
}

export const quickFilters = [
  { label: "Near Me", icon: "map-pin" },
  { label: "LGBTQ Friendly", icon: "rainbow" },
  { label: "Women in Leadership", icon: "users" },
  { label: "Mental Health Friendly", icon: "brain" },
  { label: "Accessible", icon: "accessibility" },
  { label: "Young Adults", icon: "sparkles" },
]

export const filterGroups: { title: string; options: string[] }[] = [
  {
    title: "Experience",
    options: [
      "Safe to Visit",
      "Respectful Community",
      "LGBTQ Support Group",
      "Families",
      "Young Adults",
      "Active Small Groups",
    ],
  },
  {
    title: "Theology",
    options: [
      "Fully Affirming",
      "Traditional",
      "Mixed Experiences",
      "Egalitarian",
      "Complementarian",
      "Evangelical",
      "Mainline Protestant",
      "Catholic",
      "Orthodox",
      "Non-denominational",
    ],
  },
  {
    title: "Accessibility",
    options: [
      "Wheelchair",
      "Hearing Assistance",
      "Livestream",
      "Quiet Room",
      "Gender Neutral Bathrooms",
      "Sensory Friendly",
    ],
  },
  {
    title: "Worship Style",
    options: ["Contemporary", "Traditional", "Liturgical", "Blended"],
  },
  {
    title: "Community",
    options: ["College Students", "Young Adults", "Families", "Singles", "Seniors"],
  },
  {
    title: "Mental Health",
    options: [
      "Counseling Available",
      "Therapy Encouraged",
      "Recovery Ministry",
      "Mental Health Discussed",
    ],
  },
]

// Keep in sync with prisma/seed.ts IDENTITIES.
export const identities = [
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

export const resources = [
  {
    slug: "how-to-visit-a-church",
    title: "How to Visit a Church for the First Time",
    description:
      "What to expect, what to wear, and gentle ways to ease in-person anxiety on your first visit.",
    category: "Getting Started",
    icon: "door-open",
  },
  {
    slug: "understanding-christian-traditions",
    title: "Understanding Christian Traditions",
    description:
      "A plain-language guide to denominations, theology terms, and what they can mean in practice.",
    category: "Learn",
    icon: "book-open",
  },
  {
    slug: "questions-to-ask-before-joining",
    title: "Questions to Ask Before Joining",
    description:
      "Thoughtful questions about leadership, inclusion, and values to help you discern fit.",
    category: "Discernment",
    icon: "message-circle-question",
  },
  {
    slug: "mental-health-resources",
    title: "Mental Health Resources",
    description:
      "Hotlines, directories, and faith-sensitive counseling options — including LGBTQ+-affirming and LGBTQ+ Christian organizations.",
    category: "Support",
    icon: "brain",
  },
  {
    slug: "finding-community",
    title: "Finding Community",
    description:
      "Ways to build real relationships beyond Sunday—small groups, service, and shared meals.",
    category: "Belonging",
    icon: "users-round",
  },
]
