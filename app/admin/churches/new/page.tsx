import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChurchFactsForm, EMPTY_CHURCH_FACTS } from "@/components/admin/church-facts-form"
import { AdminNav } from "@/components/admin/admin-nav"

export const metadata = {
  title: "Add a church · Open Doors Admin",
}

export default async function NewChurchPage() {
  const session = await auth()
  if (!session?.user) redirect("/signin?callbackUrl=/admin/churches/new")
  if (session.user.role !== "ADMIN") redirect("/")

  const denominations = await prisma.denomination.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <AdminNav active="" />
      <ChurchFactsForm mode="create" initial={EMPTY_CHURCH_FACTS} denominations={denominations} />
    </div>
  )
}
