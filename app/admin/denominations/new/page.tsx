import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DenominationForm, EMPTY_DENOMINATION_FORM } from "@/components/admin/denomination-form"

export const metadata = {
  title: "Add denomination · Open Doors Admin",
}

export default async function NewDenominationPage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/denominations/new")
  if (session.user.role !== "ADMIN") redirect("/")

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Add a denomination</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Only fill in belief fields you have a public source for — leave anything else &quot;Unknown&quot;. You can
        attach sources and aliases after creating the record.
      </p>
      <div className="mt-6">
        <DenominationForm initial={EMPTY_DENOMINATION_FORM} />
      </div>
    </div>
  )
}
