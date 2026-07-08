"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import type { ChurchDetail } from "@/lib/types"
import { experienceMeta } from "@/lib/data"
import { ExperienceDot } from "@/components/experience-dot"
import { ChurchLocationThumb } from "@/components/church-location-thumb"
import { Button } from "@/components/ui/button"
import { MapPin, Globe, Clock, Users, Bookmark, Share2, Check, PencilLine } from "lucide-react"
import { cn } from "@/lib/utils"

function InfoLine({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

export function ChurchHeader({
  church,
  initiallySaved,
}: {
  church: ChurchDetail
  initiallySaved: boolean
}) {
  const { status } = useSession()
  const router = useRouter()
  const [saved, setSaved] = useState(initiallySaved)
  const [pending, setPending] = useState(false)

  async function toggleSaved() {
    if (status !== "authenticated") {
      router.push(`/signin?callbackUrl=/church/${church.slug}`)
      return
    }
    setPending(true)
    const previous = saved
    setSaved(!previous)
    try {
      const res = await fetch(`/api/churches/${church.slug}/save`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to save")
      const data = await res.json()
      setSaved(data.saved)
    } catch {
      setSaved(previous)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative h-56 w-full sm:h-72">
        {church.cover ? (
          <Image
            src={church.cover}
            alt={`${church.name} building`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
        ) : (
          <ChurchLocationThumb lat={church.lat} lng={church.lng} showAttribution className="size-full" />
        )}
        {/* Leaflet's internal panes use z-index up to ~700, which paints over
            plain siblings regardless of DOM order unless we outrank them. */}
        <div className="absolute inset-x-0 bottom-0 z-[1000] h-24 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute left-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
          <ExperienceDot status={church.status} />
          {experienceMeta[church.status].label}
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              {church.denomination}
            </span>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              {church.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {church.summary}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoLine icon={MapPin}>{church.address}</InfoLine>
          <InfoLine icon={Clock}>{church.serviceTimes.join(" · ")}</InfoLine>
          <InfoLine icon={Users}>{church.attendance}</InfoLine>
          <InfoLine icon={Globe}>
            <a
              href={church.website ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-blue underline-offset-2 hover:underline"
            >
              Visit website
            </a>
          </InfoLine>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button
            nativeButton={false}
            render={
              <a href={church.website ?? undefined} target="_blank" rel="noopener noreferrer" />
            }
          >
            <Globe className="size-4" />
            Visit Website
          </Button>
          <Button
            variant="outline"
            onClick={toggleSaved}
            disabled={pending}
            className={cn(saved && "border-primary/40 bg-primary/10 text-primary")}
          >
            {saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
            {saved ? "Saved" : "Save Church"}
          </Button>
          <Button variant="outline">
            <Share2 className="size-4" />
            Share
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/church/${church.slug}/suggest-edit`} />}
          >
            <PencilLine className="size-4" />
            Suggest an Edit
          </Button>
        </div>
      </div>
    </section>
  )
}
