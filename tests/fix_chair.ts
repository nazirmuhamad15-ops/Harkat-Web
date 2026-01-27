
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing Office Executive Chair Dimensions...')
  
  // 1. Find the product
  const product = await prisma.product.findFirst({
    where: { name: 'Office Executive Chair' },
    include: { variants: true }
  })

  if (!product) {
      console.log('Chair not found!')
      return
  }

  // 2. Update Variants
  for (const v of product.variants) {
      console.log(`Updating variant ID: ${v.id}`)
      await prisma.productVariant.update({
          where: { id: v.id },
          data: {
              weight: 18,
              length: 65,
              width: 65,
              height: 120,
              stockCount: 30,
              // lowStockThreshold: 5, // if needed
              shelfLocation: 'A-12', // Assign a location
              salesCount: 20 // Keep or update
          }
      })
  }
  
  console.log('✅ Chair updated successfully!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
