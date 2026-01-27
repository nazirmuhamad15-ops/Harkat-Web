
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.findFirst({
    where: { name: { contains: 'Office Executive Chair' } },
    include: { variants: true }
  })
  
  if (!product) {
      console.log('Product not found')
      return
  }
  console.log(JSON.stringify(product, null, 2))
  console.log(`Product ID: ${product.id}, Name: ${product.name}, Slug: ${product.slug}`)
  console.log('Variants count:', product.variants.length)
  product.variants.forEach(v => {
      console.log(`Variant ID: ${v.id}, SKU: ${v.sku}, W: ${v.width}, H: ${v.height}, Weight: ${v.weight}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
