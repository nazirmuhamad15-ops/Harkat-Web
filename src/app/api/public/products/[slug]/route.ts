import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: {
        variants: {
          with: {
             attributes: {
               with: {
                 attributeValue: {
                   with: {
                     attribute: true
                   }
                 }
               }
             }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Transform data for easier frontend consumption
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      images: JSON.parse(product.images as string || '[]'),
      featured: product.featured,
      variants: product.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        price: v.price,
        stockCount: v.stockCount,
        inStock: v.stockCount !== null && v.stockCount > 0,
        images: JSON.parse(v.images as string || '[]'),
        weight: v.weight,
        length: v.length,
        width: v.width,
        height: v.height,
        attributes: v.attributes.map(a => ({
          name: a.attributeValue.attribute.name,
          value: a.attributeValue.value
        }))
      }))
    }

    return NextResponse.json({ success: true, product: transformedProduct })

  } catch (error) {
    console.error('Product detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
