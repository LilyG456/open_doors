import { ArticleShell, H2, P, Ul, Li } from "@/components/resources/article"

export const metadata = {
  title: "How to Visit a Church for the First Time · Open Doors",
  description: "What to expect, what to wear, and gentle ways to ease in-person anxiety on your first visit.",
}

export default function HowToVisitPage() {
  return (
    <ArticleShell
      category="Getting Started"
      title="How to Visit a Church for the First Time"
      dek="Walking into a new church can feel intimidating, especially if you've been hurt by church before or you're wondering whether you'll be accepted. Here are a few ideas that have helped me."
    >
      <H2>Before you go</H2>
      <Ul>
        <Li>Look through the church&apos;s website.</Li>
        <Li>Read their statement of beliefs and values.</Li>
        <Li>Check whether they have information about accessibility, children&apos;s programs, or what to expect.</Li>
        <Li>
          See if they livestream services. Watching online first can make visiting in person feel much less
          stressful.
        </Li>
        <Li>If you have specific questions, consider emailing the church before visiting.</Li>
      </Ul>

      <H2>What should I wear?</H2>
      <P>Most churches genuinely don&apos;t expect visitors to dress a certain way.</P>
      <P>
        If you&apos;re unsure, looking through photos on the church&apos;s website or social media can give
        you a sense of what people typically wear.
      </P>
      <P>Wear something that makes you feel comfortable and like yourself.</P>

      <H2>During the service</H2>
      <P>Remember that you&apos;re not making a lifelong commitment by attending once.</P>
      <P>You don&apos;t have to:</P>
      <Ul>
        <Li>introduce yourself</Li>
        <Li>sing every song</Li>
        <Li>take communion (if you&apos;re unsure of the church&apos;s practice)</Li>
        <Li>stay after the service</Li>
      </Ul>
      <P>It&apos;s okay to simply observe.</P>

      <H2>Afterward</H2>
      <P>Ask yourself:</P>
      <Ul>
        <Li>Did I feel welcomed?</Li>
        <Li>Did I feel emotionally safe?</Li>
        <Li>Could I imagine asking questions here?</Li>
        <Li>Was I able to be myself?</Li>
      </Ul>
      <P>One visit rarely tells the whole story. It&apos;s okay if you leave with more questions than answers.</P>
    </ArticleShell>
  )
}
