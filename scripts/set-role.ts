
import { db } from "./src/lib/db"

const email = process.argv[2]
const role = process.argv[3] || 'ADMIN'

if (!email) {
  console.log('Usage: bun scripts/set-role.ts <email> [role]')
  process.exit(1)
}

async function main() {
  const user = await db.user.findUnique({ where: { email } })
  
  if (!user) {
    console.error(`User with email ${email} not found`)
    process.exit(1)
  }

  const updated = await db.user.update({
    where: { email },
    data: { role: role as any }
  })

  console.log(`✅ Updated ${email} to ${role}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
