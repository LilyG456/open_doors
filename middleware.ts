import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Temporary, whole-site access gate for the pre-launch period — every route
// requires a signed-in session, and only emails in ALLOWED_EMAILS (set on
// the host, comma-separated) are let in. Remove this file (and the
// ALLOWED_EMAILS variable) once the site is ready for the public.
//
// Needs the Node.js runtime, not the default Edge runtime: `auth()` uses
// the database session strategy (PrismaAdapter), which requires a real
// Prisma Client — Prisma can't run on Edge.
export const runtime = "nodejs"

// Paths that must stay reachable by a signed-out visitor, or sign-in itself
// breaks: the sign-in pages and NextAuth's own routes (magic-link
// verification, session/csrf endpoints, etc).
const PUBLIC_PATHS = ["/signin", "/api/auth"]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function parseAllowedEmails() {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  if (isPublicPath(pathname)) return NextResponse.next()

  const email = req.auth?.user?.email?.toLowerCase()
  const allowedEmails = parseAllowedEmails()
  // Fail closed: with no ALLOWED_EMAILS configured, nobody gets through
  // (not even other signed-in users) rather than silently opening up.
  const allowed = Boolean(email) && allowedEmails.includes(email!)

  if (!allowed) {
    const url = new URL("/signin", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}
