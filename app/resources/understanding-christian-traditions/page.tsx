import { ArticleShell, H2, P, Ul, Li, Strong } from "@/components/resources/article"

export const metadata = {
  title: "Understanding Christian Traditions · Open Doors",
  description: "A plain-language guide to denominations, theology terms, and what they can mean in practice.",
}

export default function UnderstandingTraditionsPage() {
  return (
    <ArticleShell category="Learn" title="Understanding Christian Traditions">
      <P>
        There are thousands of Christian churches, but many belong to larger traditions or denominations.
        Some examples include:
      </P>
      <Ul>
        <Li>Baptist</Li>
        <Li>Methodist</Li>
        <Li>Lutheran</Li>
        <Li>Presbyterian</Li>
        <Li>Episcopal</Li>
        <Li>Catholic</Li>
        <Li>Orthodox</Li>
        <Li>Pentecostal</Li>
      </Ul>

      <P>A denomination often shares:</P>
      <Ul>
        <Li>history</Li>
        <Li>theology</Li>
        <Li>governance</Li>
        <Li>worship style</Li>
        <Li>leadership structure</Li>
      </Ul>

      <P>
        However, <Strong>individual churches can differ significantly from their denomination.</Strong>
      </P>

      <H2>Two kinds of information</H2>
      <P>Throughout Open Doors you&apos;ll see two kinds of information on a church&apos;s page:</P>

      <div className="mb-4 flex flex-col gap-3">
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-semibold text-foreground">Denominational Context</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Describes official positions or common practices within a denomination.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-semibold text-foreground">Local Church Information</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Describes that specific congregation through public information and community experiences.
          </p>
        </div>
      </div>

      <P>Whenever possible, try to learn about both.</P>
    </ArticleShell>
  )
}
