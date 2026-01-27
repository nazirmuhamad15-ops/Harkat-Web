import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  products, 
  productVariants, 
  productAttributes, 
  productAttributeValues, 
  productVariantAttributes 
} from '@/db/schema'
import { eq, or, like, and, desc, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verify Role (ADMIN or SUPER_ADMIN) - Drivers might need read access? Assume Admin-only for now.
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'

    const skip = (page - 1) * limit

    const conditions = []
    
    if (search) {
       conditions.push(or(
           like(products.name, `%${search}%`),
           like(products.slug, `%${search}%`)
       ))
    }

    if (category !== 'all') {
       conditions.push(eq(products.category, category))
    }

    // Get Total Count
    const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions))
    
    const total = Number(totalResult[0]?.count || 0)

    const rawProducts = await db.query.products.findMany({
      where: and(...conditions),
      limit: limit,
      offset: skip,
      orderBy: desc(products.createdAt),
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
    
    console.log(`🔍 Admin Products API: Found ${rawProducts.length} raw products. Total count: ${total}`);

    const formattedProducts = rawProducts.map(product => ({
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        isLowStock: variant.lowStockThreshold !== null && (variant.stockCount || 0) <= (variant.lowStockThreshold || 0),
        attributes: variant.attributes.map(attr => ({
             name: attr.attributeValue.attribute.name,
             value: attr.attributeValue.value
        }))
      }))
    }))

    return NextResponse.json({ 
        products: formattedProducts,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    })
    
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verify Role (ADMIN or SUPER_ADMIN)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await request.json()

    // Extract Product-level fields
    const {
      name,
      category,
      description,
      featured,
      status,
      variants, // Array of variants
      images    // Main product images
    } = data

    // Generate Slug
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4)

    // Transaction to ensure data integrity
    const newProduct = await db.transaction(async (tx) => {
      // 1. Create the Product
      const [product] = await tx.insert(products).values({
          name,
          slug,
          category,
          description,
          images: JSON.stringify(images || []),
          featured: featured || false,
          status: status || 'ACTIVE',
          isFragile: data.isFragile || false,
          topSideUp: data.topSideUp || true,
      }).returning()

      // 2. Handle Variants
      if (variants && Array.isArray(variants) && variants.length > 0) {
        for (const variant of variants) {
          // Create Variant
          const [newVariant] = await tx.insert(productVariants).values({
              productId: product.id,
              sku: variant.sku,
              price: Math.max(0, parseFloat(variant.price)),
              costPrice: Math.max(0, parseFloat(variant.costPrice || 0)),
              stockCount: Math.max(0, parseInt(variant.stockCount || 0)),
              lowStockThreshold: Math.max(0, parseInt(variant.lowStockThreshold || 5)),
              shelfLocation: variant.shelfLocation,
              weight: Math.max(0, parseFloat(variant.weight || 0)),
              length: Math.max(0, parseFloat(variant.length || 0)),
              width: Math.max(0, parseFloat(variant.width || 0)),
              height: Math.max(0, parseFloat(variant.height || 0)),
              inStock: (parseInt(variant.stockCount || 0)) > 0,
              images: JSON.stringify(variant.images || []),
          }).returning()

          // 3. Handle Attributes (Color, Material, Size)
          if (variant.attributes && Array.isArray(variant.attributes)) {
            for (const attr of variant.attributes) { // Expect { name: "Color", value: "Red" }
              // Find or Create Attribute (e.g., "Color")
              // PostgreSQL Upsert: DO UPDATE SET name=EXCLUDED.name works too, or DO NOTHING
               const [attribute] = await tx.insert(productAttributes)
                .values({ name: attr.name })
                .onConflictDoUpdate({ target: productAttributes.name, set: { name: attr.name } })
                .returning()

              // Find or Create Attribute Value
              // Drizzle can't easily do upsert on composite constraint returning ID in one go for all drivers?
              // Postgres is fine.
              
              // We need the attribute ID.
              // Note: onConflictDoUpdate needs a unique constraint target.
              
              let attrValueId;
              
              // Try insert value
              // Since we have a composite unique index on [attributeId, value]
              const [insertedValue] = await tx.insert(productAttributeValues)
                 .values({ attributeId: attribute.id, value: attr.value })
                 .onConflictDoNothing() 
                 .returning();

              if (insertedValue) {
                  attrValueId = insertedValue.id;
              } else {
                  // If it existed, we need to fetch it
                  const existing = await tx.query.productAttributeValues.findFirst({
                      where: and(
                          eq(productAttributeValues.attributeId, attribute.id),
                          eq(productAttributeValues.value, attr.value)
                      )
                  });
                  attrValueId = existing?.id;
              }

              if (attrValueId) {
                  // Link to Variant
                  await tx.insert(productVariantAttributes).values({
                      variantId: newVariant.id,
                      attributeValueId: attrValueId,
                  })
              }
            }
          }
        }
      }
      return product
    })

    return NextResponse.json({ product: newProduct }, { status: 201 })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}