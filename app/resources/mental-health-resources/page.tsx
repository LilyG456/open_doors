import { ArticleShell, H2, P, Ul, Li, ExternalLink, Callout } from "@/components/resources/article"
import { LifeBuoy, Heart } from "lucide-react"

export const metadata = {
  title: "Mental Health Resources · Open Doors",
  description:
    "Hotlines, directories, and faith-sensitive counseling options — including LGBTQ+-affirming and LGBTQ+ Christian organizations.",
}

export default function MentalHealthResourcesPage() {
  return (
    <ArticleShell category="Support" title="Mental Health Resources" dek="If you're struggling, you deserve support.">
      <P>
        This guide comes from personal experience and research. It is <strong className="font-semibold text-foreground">not</strong> professional
        medical or mental health advice. My hope is simply to point you toward organizations and resources
        that many people have found helpful.
      </P>
      <P>
        Faith and professional mental health care can work together. You don&apos;t have to choose one or the
        other.
      </P>

      <H2>When you&apos;re struggling</H2>
      <P>Sometimes the hardest part is admitting that you need help.</P>
      <P>If you&apos;re feeling overwhelmed, consider reaching out to:</P>
      <Ul>
        <Li>A trusted friend or family member</Li>
        <Li>A therapist or counselor</Li>
        <Li>Your primary care provider</Li>
        <Li>A pastor or faith leader you trust</Li>
        <Li>A crisis line if you&apos;re in immediate danger</Li>
      </Ul>
      <P>
        Seeking help is not a sign of weak faith. Many people find that healing comes through community,
        therapy, medicine, prayer, or a combination of these.
      </P>

      <H2>Finding a Therapist</H2>
      <P>If you&apos;d like to find a therapist, these directories can be a good place to start:</P>
      <Ul>
        <Li>
          <ExternalLink href="https://www.psychologytoday.com/us/therapists">
            Psychology Today Therapist Directory
          </ExternalLink>
        </Li>
        <Li>
          <ExternalLink href="https://www.inclusivetherapists.com/">Inclusive Therapists</ExternalLink> —
          focuses on culturally responsive and LGBTQ+-affirming care
        </Li>
        <Li>
          <ExternalLink href="https://www.mhanational.org/">Mental Health America</ExternalLink>
        </Li>
      </Ul>

      <H2>Faith and Mental Health</H2>
      <P>These organizations provide resources at the intersection of faith and mental health:</P>
      <Ul>
        <Li>
          <ExternalLink href="https://www.nami.org/living-with-a-mental-health-condition/faith-spirituality/">
            NAMI – FaithNet &amp; Faith Resources
          </ExternalLink>
        </Li>
        <Li>
          <ExternalLink href="https://www.nami.org/community-and-culture/lgbtq/">
            NAMI LGBTQ+ Resources
          </ExternalLink>
        </Li>
      </Ul>

      <H2>LGBTQ+ Support</H2>
      <P>These organizations provide support, education, and crisis resources for LGBTQ+ individuals.</P>
      <Ul>
        <Li>
          <ExternalLink href="https://www.thetrevorproject.org/">The Trevor Project</ExternalLink> — crisis
          intervention, education, and resources for LGBTQ+ young people
        </Li>
        <Li>
          <ExternalLink href="https://www.thetrevorproject.org/resources/">
            Trevor Project Resource Center
          </ExternalLink>
        </Li>
        <Li>
          <ExternalLink href="https://lgbthotline.org/">LGBT National Help Center</ExternalLink>
        </Li>
      </Ul>

      <H2>LGBTQ+ Christians</H2>
      <P>
        If you&apos;re looking for communities that understand both faith and LGBTQ+ identity, you might
        explore:
      </P>
      <Ul>
        <Li>
          <ExternalLink href="https://www.qchristian.org/">Q Christian Fellowship</ExternalLink>
        </Li>
        <Li>
          <ExternalLink href="https://reformationproject.org/">The Reformation Project</ExternalLink>
        </Li>
        <Li>
          <ExternalLink href="https://www.belovedarise.org/">Beloved Arise</ExternalLink> — for LGBTQ+ youth
          of faith
        </Li>
        <Li>
          <ExternalLink href="https://transmissionministry.com/">Transmission Ministry Collective</ExternalLink>{" "}
          — supporting transgender Christians and faith communities
        </Li>
      </Ul>

      <Callout icon={LifeBuoy} title="If you're in crisis" tone="urgent">
        <p>
          If you believe you may be in immediate danger or are thinking about hurting yourself, please seek
          help right away.
        </p>
        <p>If you&apos;re in the United States or Canada:</p>
        <Ul>
          <Li>Call or text <strong className="font-semibold text-foreground">988</strong> to reach the Suicide &amp; Crisis Lifeline.</Li>
          <Li>
            If you are in immediate danger, call <strong className="font-semibold text-foreground">911</strong> (or your local
            emergency services).
          </Li>
        </Ul>
        <p>If you&apos;re outside the United States, please contact your country&apos;s local crisis service or emergency number.</p>
      </Callout>

      <Callout icon={Heart} title="A final note" tone="warm">
        <p>If you&apos;ve been hurt by a church, it&apos;s okay if trusting again takes time.</p>
        <p>You don&apos;t have to have everything figured out today.</p>
        <p>
          Whether your next step is finding a therapist, visiting a new church, talking with a friend, or
          simply making it through today, that step matters. I hope these resources help you find the
          support, care, and community you deserve.
        </p>
      </Callout>
    </ArticleShell>
  )
}
