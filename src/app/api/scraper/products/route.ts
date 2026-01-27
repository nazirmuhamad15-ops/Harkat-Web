import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts, products, productVariants, categories, ScrapedProductStatus, productAttributes, productAttributeValues, productVariantAttributes } from '@/db/schema'
import { eq, desc, and, like } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// GET: List all scraped products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const source = searchParams.get('source') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = db.select().from(scrapedProducts)

    // Build where conditions
    const conditions = []
    if (status !== 'all') {
      conditions.push(eq(scrapedProducts.status, status))
    }
    if (source !== 'all') {
      conditions.push(eq(scrapedProducts.source, source))
    }

    const allScraped = await db.query.scrapedProducts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(scrapedProducts.scrapedAt)],
      limit: limit,
      offset: (page - 1) * limit,
      with: {
        scrapedBy: {
          columns: { id: true, name: true, email: true }
        }
      }
    })

    // Parse JSON fields
    const parsed = allScraped.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      variants: p.variants ? JSON.parse(p.variants) : [],
      specifications: p.specifications ? JSON.parse(p.specifications) : {},
    }))

    // Get total count
    const allItems = await db.query.scrapedProducts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
    })

    return NextResponse.json({
      data: parsed,
      pagination: {
        page,
        limit,
        total: allItems.length,
        totalPages: Math.ceil(allItems.length / limit)
      }
    })
  } catch (error) {
    console.error('Get scraped products error:', error)
    return NextResponse.json({ error: 'Failed to fetch scraped products' }, { status: 500 })
  }
}

// PATCH: Update scraped product or import to real product
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Get existing scraped product
    const existing = await db.query.scrapedProducts.findFirst({
      where: eq(scrapedProducts.id, id)
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scraped product not found' }, { status: 404 })
    }

    // Handle import action - convert to real product
    if (action === 'import') {
      // Create slug from name
      const slug = existing.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

      // Parse images
      let images = [];
      if (updateData.images) {
        images = typeof updateData.images === 'string' ? JSON.parse(updateData.images) : updateData.images;
      } else {
        images = existing.images ? JSON.parse(existing.images) : [];
      }

      // Create product
      let categoryName = 'Uncategorized';
      
      // If categoryId provided, fetch the name
      if (updateData.categoryId) {
        const cat = await db.query.categories.findFirst({
          where: eq(categories.id, updateData.categoryId),
          columns: { name: true }
        });
        if (cat) categoryName = cat.name;
      } else if (updateData.category || existing.category) {
        // Fallback to existing string category if no ID
        categoryName = updateData.category || existing.category;
      }

      const [newProduct] = await db.insert(products).values({
        name: updateData.name || existing.name,
        slug,
        description: updateData.description || existing.description,
        category: categoryName,
        images: JSON.stringify(images),
        status: 'ACTIVE',
        featured: false,
      }).returning()

      // Handle Variants (Colors)
      let colorOptions: string[] = [];
      
      // 1. Check Manual Input and Clean
      if (updateData.colors) {
         colorOptions = (updateData.colors as string)
            .split(/[,;\n]+/) // Split by comma, semicolon, newline (one or more)
            .map(s => s.trim())
            .filter(s => s.length > 0 && s.length < 40); // Filter empty and too long strings
      }

      // 2. Fallback to Scraped Data
      if (colorOptions.length === 0) {
          let variantsData = [];
          try {
            variantsData = existing.variants ? JSON.parse(existing.variants) : [];
          } catch (e) {}
          const colorVariant = variantsData.find((v: any) => /Warna|Color|Variasi/i.test(v.name));
          if (colorVariant?.options) {
             colorOptions = colorVariant.options
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0 && s.length < 40);
          }
      }

      // Common Values (Force stock > 0 for imported items if implied)
      const price = updateData.price ? parseFloat(updateData.price) : (existing.price || 0)
      const weight = updateData.weight ? Math.max(0, Number(updateData.weight)) : 1
      const inputStock = updateData.stockCount ? parseInt(updateData.stockCount) : 0
      const stock = inputStock > 0 ? inputStock : 10 // Default to 10 if 0/invalid
      const dims = {
         length: updateData.length ? Math.max(0, Number(updateData.length)) : 10,
         width: updateData.width ? Math.max(0, Number(updateData.width)) : 10,
         height: updateData.height ? Math.max(0, Number(updateData.height)) : 10,
      }

      if (colorOptions.length > 0) {
          // Loop options and create variants
          for (let i = 0; i < colorOptions.length; i++) {
             const colorName = colorOptions[i];
             // Create Variant
             const sku = `IMP-${Date.now().toString(36).toUpperCase()}-${i+1}`;
             
             const [variant] = await db.insert(productVariants).values({
                 productId: newProduct.id,
                 sku,
                 price,
                 costPrice: price * 0.7,
                 stockCount: stock, 
                 lowStockThreshold: 5,
                 weight,
                 ...dims,
                 images: JSON.stringify(images), // Use main images for all variants for now
             }).returning();

             // Handle Attribute: Warna
             const [attr] = await db.insert(productAttributes)
                .values({ name: 'Warna' })
                .onConflictDoUpdate({ target: productAttributes.name, set: { name: 'Warna' } })
                .returning();
             
             // Upsert Value
             let valId;
             const [insertedVal] = await db.insert(productAttributeValues)
                .values({ attributeId: attr.id, value: colorName })
                .onConflictDoNothing() 
                .returning();
             
             if (insertedVal) {
                 valId = insertedVal.id;
             } else {
                 const found = await db.query.productAttributeValues.findFirst({
                    where: and(eq(productAttributeValues.attributeId, attr.id), eq(productAttributeValues.value, colorName))
                 });
                 valId = found?.id;
             }

             if (valId) {
                await db.insert(productVariantAttributes).values({
                    variantId: variant.id,
                    attributeValueId: valId
                });
             }
          }
      } else {
         // Create default variant (No color)
         const sku = `IMP-${Date.now().toString(36).toUpperCase()}`;
         await db.insert(productVariants).values({
           productId: newProduct.id,
           sku,
           price,
           costPrice: price * 0.7,
           stockCount: stock,
           lowStockThreshold: 5,
           weight,
           ...dims,
           images: JSON.stringify(images),
         });
      }

      // Update scraped product status
      await db.update(scrapedProducts)
        .set({
          status: ScrapedProductStatus.IMPORTED,
          importedProductId: newProduct.id,
          reviewedAt: new Date(),
        })
        .where(eq(scrapedProducts.id, id))

      return NextResponse.json({
        success: true,
        message: 'Product imported successfully',
        productId: newProduct.id
      })
    }

    // Handle reject action
    if (action === 'reject') {
      await db.update(scrapedProducts)
        .set({
          status: ScrapedProductStatus.REJECTED,
          reviewedAt: new Date(),
        })
        .where(eq(scrapedProducts.id, id))

      return NextResponse.json({ success: true, message: 'Product rejected' })
    }

    // Regular update
    const updateValues: any = {}
    if (updateData.name) updateValues.name = updateData.name
    if (updateData.description) updateValues.description = updateData.description
    if (updateData.price) updateValues.price = parseFloat(updateData.price)
    if (updateData.category) updateValues.category = updateData.category
    if (updateData.images) updateValues.images = JSON.stringify(updateData.images)

    if (Object.keys(updateValues).length > 0) {
      await db.update(scrapedProducts)
        .set(updateValues)
        .where(eq(scrapedProducts.id, id))
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' })
  } catch (error) {
    console.error('Update scraped product error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE: Remove scraped product
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.delete(scrapedProducts).where(eq(scrapedProducts.id, id))

    return NextResponse.json({ success: true, message: 'Deleted successfully' })
  } catch (error) {
    console.error('Delete scraped product error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
