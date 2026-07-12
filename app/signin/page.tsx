import { signIn } from "@/lib/auth"
import { Mail } from "lucide-react"

export const metadata = {
  title: "Sign In · Open Doors",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 pt-16 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-7 sm:p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-sage-soft text-primary">
          <Mail className="size-5" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We'll email you a link to sign in — no password to remember or leak. Use this to save
          churches, vote stories helpful, and share your own experience.
        </p>

        <form
          className="mt-6 flex flex-col gap-3"
          action={async (formData: FormData) => {
            "use server"
            await signIn("resend", formData)
          }}
        >
          <input type="hidden" name="redirectTo" value={callbackUrl ?? "/"} />
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <button
            type="submit"
            className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Send magic link
          </button>
        </form>
      </div>
    </div>
  )
}
