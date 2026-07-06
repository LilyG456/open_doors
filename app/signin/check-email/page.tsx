import { MailCheck } from "lucide-react"

export const metadata = {
  title: "Check your email · Open Doors",
}

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 pt-16 text-center sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8">
        <span className="mx-auto inline-flex size-11 items-center justify-center rounded-xl bg-sage-soft text-primary">
          <MailCheck className="size-5" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          Check your email
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We've sent a sign-in link to your inbox. Click it to continue — you can close this tab.
        </p>
      </div>
    </div>
  )
}
