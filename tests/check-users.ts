import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany()
    console.log('Users in database:')
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Name: ${user.name}, Role: ${user.role}, Active: ${user.isActive}`)
    })
    console.log(`\nTotal users: ${users.length}`)
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()