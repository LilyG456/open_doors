import Link from "next/link"
import Image from "next/image"
import { MapPin, Users } from "lucide-react"
import { ExperienceDot } from "@/components/experience-dot"
import { ChurchLocationThumb } from "@/components/church-location-thumb"
import { experienceMeta } from "@/lib/data"
import type { ChurchListing } from "@/lib/types"

export function ChurchCard({ church }: { church: ChurchListing }) {
  const meta = experienceMeta[church.status]
  return (
    <Link
      href={`/church/${church.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {church.cover ? (
          <Image
            src={church.cover}
            alt={`${church.name} building`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ChurchLocationThumb lat={church.lat} lng={church.lng} className="size-full" />
        )}
        {/* Outrank Leaflet's internal panes (z-index up to ~700) when the fallback map is shown. */}
        <span className="absolute left-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
          <ExperienceDot status={church.status} />
          {meta.label}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="rounded-full bg-sage-soft px-2 py-0.5">{church.denomination}</span>
        </div>
        <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-foreground">
          {church.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {church.summary}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {church.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {church.transparency.total} experiences
          </span>
        </div>
      </div>
    </Link>
  )
}
