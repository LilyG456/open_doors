import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Passwordless email sign-in only. There is no password to leak, and it keeps
// account identity separate from the pseudonym someone chooses when they
// share an experience (see Experience.displayName in prisma/schema.prisma).
const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: process.env.EMAIL_SERVER_USER
          ? {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            }
          : undefined,
      },
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
