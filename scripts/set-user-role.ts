/**
 * There's no admin UI for managing user roles (yet) — the one seeded ADMIN
 * (prisma/seed.ts) is hardcoded, and everyone else signs up as a plain
 * USER. This is the only way to promote someone to MODERATOR or ADMIN
 * today: find them by the email they signed in with and set their role.
 *
 * Usage: npx tsx scripts/set-user-role.ts someone@example.com MODERATOR
 */
import "dotenv/config"
import { PrismaClient, Role } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const [email, roleArg] = process.argv.slice(2)
  if (!email || !roleArg) {
    console.error("Usage: npx tsx scripts/set-user-role.ts <email> <USER|MODERATOR|ADMIN>")
    process.exit(1)
  }

  const role = roleArg.toUpperCase()
  if (!Object.values(Role).includes(role as Role)) {
    console.error(`Invalid role "${roleArg}". Must be one of: ${Object.values(Role).join(", ")}`)
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No user found with email ${email} — they need to have signed in at least once first.`)
    process.exit(1)
  }

  const updated = await prisma.user.update({ where: { email }, data: { role: role as Role } })
  console.log(`${updated.email} is now ${updated.role} (was ${user.role}).`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
