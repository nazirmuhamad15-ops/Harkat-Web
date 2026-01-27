import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, productVariants, productVariantAttributes, activityLogs, scrapedProducts, productAttributes, productAttributeValues } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, inArray, and } from 'drizzle-orm'

// GET Single Product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) { // Drivers?
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        variants: {
          with: {
            attributes: {
              with: {
                attributeValue: {
                  with: { attribute: true }
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

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE Product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
       return NextResponse.json({ error: 'Unauthorized: Only Admin/Super Admin can delete' }, { status: 403 })
    }

    const { id } = await params

    // Check for existing orders involving this product's variants
    const productWithOrders = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        variants: {
          with: {
            orderItems: true
          }
        }
      }
    })

    if (!productWithOrders) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const ordersCount = productWithOrders.variants.reduce((acc, v) => acc + v.orderItems.length, 0)

    if (ordersCount > 0) {
      return NextResponse.json({ 
        error: `Gagal menghapus: Produk ini terdapat dalam ${ordersCount} pesanan. Silakan arsipkan produk sebagai gantinya.` 
      }, { status: 400 })
    }

    // Perform Cascade Delete in Transaction
    await db.transaction(async (tx) => {
      // 0. Decouple Scraped Products (Avoid FK Constraint)
      await tx.update(scrapedProducts)
         .set({ 
            importedProductId: null,
            status: 'PENDING'
         })
         .where(eq(scrapedProducts.importedProductId, id))

      // 1. Delete Variant Attributes first (many-to-many link)
      const variantIds = productWithOrders.variants.map(v => v.id)
      
      if (variantIds.length > 0) {
        await tx.delete(productVariantAttributes)
          .where(inArray(productVariantAttributes.variantId, variantIds))
        
        // 2. Delete Variants
        await tx.delete(productVariants)
          .where(eq(productVariants.productId, id))
      }

      // 3. Delete Product
      await tx.delete(products)
        .where(eq(products.id, id))
      
      // 4. AUDIT LOG: Record deletion
      await tx.insert(activityLogs).values({
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'PRODUCT',
        entityId: id,
        oldValues: JSON.stringify({
          name: productWithOrders.name,
          category: productWithOrders.category,
          variantCount: productWithOrders.variants.length
        }),
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    // Return specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
        error: `Gagal menghapus produk: ${errorMessage}` 
    }, { status: 500 })
  }
}

// PATCH (Update Product)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const data = await request.json()

    // Update Product Basic Info
    const [updatedProduct] = await db.update(products)
      .set({
        name: data.name,
        description: data.description,
        category: data.category,
        status: data.status,
        featured: data.featured,
        images: JSON.stringify(data.images),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    // Update First Variant (MVP Approach)
    const firstVariant = await db.query.productVariants.findFirst({
      where: eq(productVariants.productId, id)
    })

    if (firstVariant) {
        await db.update(productVariants)
            .set({
                sku: data.sku,
                price: Math.max(0, parseFloat(data.price)),
                costPrice: Math.max(0, parseFloat(data.costPrice)),
                stockCount: Math.max(0, parseInt(data.stockCount)),
                lowStockThreshold: Math.max(0, parseInt(data.lowStockThreshold)),
                shelfLocation: data.shelfLocation,
                weight: Math.max(0, parseFloat(data.weight)),
                length: Math.max(0, parseFloat(data.length)),
                width: Math.max(0, parseFloat(data.width)),
                height: Math.max(0, parseFloat(data.height)),
                updatedAt: new Date(),
            })
            .where(eq(productVariants.id, firstVariant.id))

        // Helper to update attribute
        const updateAttribute = async (variantId: string, attrName: string, value: string) => {
             // 1. Find or Create Attribute (Try exact match, then alternate)
             let attr = await db.query.productAttributes.findFirst({
                 where: eq(productAttributes.name, attrName)
             });
             
             if (!attr && (attrName === 'Warna' || attrName === 'Color')) {
                 const alt = attrName === 'Warna' ? 'Color' : 'Warna';
                 attr = await db.query.productAttributes.findFirst({
                     where: eq(productAttributes.name, alt)
                 });
             }
             
             if (!attr) {
                 const [newAttr] = await db.insert(productAttributes)
                      .values({ name: attrName })
                      .onConflictDoNothing()
                      .returning();
                 attr = newAttr;
                 if (!attr) attr = await db.query.productAttributes.findFirst({ where: eq(productAttributes.name, attrName) });
             }
             
             if (!attr) return;

             // 2. Find or Create Value
             let valId;
             const [insertedVal] = await db.insert(productAttributeValues)
                .values({ attributeId: attr.id, value: value })
                .onConflictDoNothing()
                .returning();
              
             if (insertedVal) {
                valId = insertedVal.id;
             } else {
                const found = await db.query.productAttributeValues.findFirst({
                   where: and(eq(productAttributeValues.attributeId, attr.id), eq(productAttributeValues.value, value))
                });
                valId = found?.id;
             }

             // 3. Link
             if (valId) {
                 // Remove old attribute of same type for this variant
                 const currentLinks = await db.query.productVariantAttributes.findMany({
                     where: eq(productVariantAttributes.variantId, variantId),
                     with: { attributeValue: true }
                 });
                 
                 const linkToDelete = currentLinks.find(l => l.attributeValue.attributeId === attr!.id);
                 if (linkToDelete) {
                     await db.delete(productVariantAttributes).where(eq(productVariantAttributes.id, linkToDelete.id));
                 }
                 
                 await db.insert(productVariantAttributes).values({
                     variantId: variantId,
                     attributeValueId: valId
                 }).onConflictDoNothing();
             }
        };

        if (data.color) await updateAttribute(firstVariant.id, 'Warna', data.color);
        if (data.material) await updateAttribute(firstVariant.id, 'Material', data.material);
    }

    // Handle Batch Variants Update (from Variants Tab)
    if (data.variants && Array.isArray(data.variants)) {
        for (const v of data.variants) {
            if (v.id) {
                await db.update(productVariants)
                    .set({
                        sku: v.sku,
                        price: Math.max(0, parseFloat(v.price)),
                        stockCount: Math.max(0, parseInt(v.stockCount)),
                        updatedAt: new Date()
                    })
                    .where(eq(productVariants.id, v.id));
            }
        }
    }

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
