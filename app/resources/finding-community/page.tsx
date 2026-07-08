import { ArticleShell, P, Ul, Li } from "@/components/resources/article"

export const metadata = {
  title: "Finding Community · Open Doors",
  description: "Ways to build real relationships beyond Sunday—small groups, service, and shared meals.",
}

export default function FindingCommunityPage() {
  return (
    <ArticleShell category="Belonging" title="Finding Community" dek="Church is more than a Sunday service.">
      <P>Many meaningful friendships begin through:</P>
      <Ul>
        <Li>small groups</Li>
        <Li>serving together</Li>
        <Li>shared meals</Li>
        <Li>Bible studies</Li>
        <Li>volunteer projects</Li>
        <Li>young adult gatherings</Li>
      </Ul>

      <P>Building community takes time.</P>
      <P>You don&apos;t have to become deeply involved immediately.</P>
      <P>Sometimes the healthiest next step is simply learning one person&apos;s name.</P>
      <P>Sometimes it&apos;s coming back a second time.</P>
      <P>Sometimes it&apos;s realizing a church isn&apos;t the right fit, and that&apos;s okay too.</P>
      <P>Finding belonging often happens slowly, one conversation at a time.</P>
    </ArticleShell>
  )
}
