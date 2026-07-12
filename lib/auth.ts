import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Resend from "next-auth/providers/resend"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Passwordless email sign-in only. There is no password to leak, and it keeps
// account identity separate from the pseudonym someone chooses when they
// share an experience (see Experience.displayName in prisma/schema.prisma).
const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  // Auth.js only auto-trusts the Host header on a handful of platforms it
  // recognizes (Vercel, etc.) — Railway isn't one of them, so without this
  // every request behind Railway's edge proxy gets rejected as an
  // UntrustedHost. Railway's proxy is the only way to reach this app (it's
  // not otherwise exposed to the internet), so trusting its forwarded Host
  // header here is safe.
  trustHost: true,
  providers: [
    // Sends via Resend's HTTPS API rather than raw SMTP. Railway's network
    // silently drops outbound SMTP (port 587) connections to smtp.resend.com
    // — every send hung for ~2 minutes before timing out, making the
    // "Send magic link" button look completely dead. The API call goes out
    // over 443 like any other fetch, so it isn't affected.
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as { role?: string }).role ?? "USER"
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
