import { ExploreClient } from "@/components/explore/explore-client"

export const metadata = {
  title: "Explore Churches — Open Doors",
  description:
    "Explore churches on an interactive map, filtered by experience, theology, accessibility, and community.",
}

export default function ExplorePage() {
  return (
    <div className="lg:py-2">
      <div className="mx-auto hidden max-w-[1600px] px-4 pt-4 sm:px-8 lg:block">
        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Explore communities
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Pins reflect the amount and consistency of reported experiences—never a verdict
          on whether a church is good or bad.
        </p>
      </div>
      <div className="lg:mt-4">
        <ExploreClient />
      </div>
    </div>
  )
}
