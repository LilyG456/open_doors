import { ArticleShell, H2, P, Ul, Li, Strong } from "@/components/resources/article"

export const metadata = {
  title: "Questions to Ask Before Joining · Open Doors",
  description: "Thoughtful questions about leadership, inclusion, and values to help you discern fit.",
}

export default function QuestionsBeforeJoiningPage() {
  return (
    <ArticleShell
      category="Discernment"
      title="Questions to Ask Before Joining"
      dek="Finding a church isn't about finding a perfect church—it's about finding a community where you can grow safely."
    >
      <P>Some questions you might consider:</P>

      <H2>Community</H2>
      <Ul>
        <Li>Do people seem genuinely interested in newcomers?</Li>
        <Li>Is there space to ask difficult questions?</Li>
        <Li>Do friendships exist outside Sunday mornings?</Li>
      </Ul>

      <H2>Leadership</H2>
      <Ul>
        <Li>Is leadership transparent?</Li>
        <Li>Are leaders approachable?</Li>
        <Li>How are major decisions made?</Li>
      </Ul>

      <H2>Beliefs</H2>
      <Ul>
        <Li>What does the church believe about LGBTQ people?</Li>
        <Li>What opportunities exist for women in leadership?</Li>
        <Li>Are differences handled respectfully?</Li>
      </Ul>

      <H2>Mental Health</H2>
      <Ul>
        <Li>Is therapy spoken about positively?</Li>
        <Li>Does the church partner with counselors?</Li>
        <Li>Is mental illness treated with compassion rather than shame?</Li>
      </Ul>

      <H2>You</H2>
      <P>Perhaps the most important question is:</P>
      <P>
        <Strong>How do I feel when I&apos;m here?</Strong>
      </P>
      <P>Peace, belonging, curiosity, and hope are all worth paying attention to.</P>
    </ArticleShell>
  )
}
