
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting Office Executive Chair...')
  try {
      const deleteResult = await prisma.product.deleteMany({
        where: { name: 'Office Executive Chair' }
      })
      console.log('Deleted count:', deleteResult.count)
  } catch (e) {
      console.log('Error deleting:', e)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
