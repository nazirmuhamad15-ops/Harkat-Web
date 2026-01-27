'use server'

import { db } from '@/lib/db-drizzle'
import { productVariants, activityLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateVariantStock(variantId: string, newStock: number) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Harus login untuk mengubah stok')
  }

  // Use Drizzle Transaction for Atomicity
  await db.transaction(async (tx) => {
    // 1. Get current stock for logging
    const currentVariant = await tx.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      columns: {
        stockCount: true,
        productId: true,
        sku: true
      }
    })

    if (!currentVariant) {
      throw new Error('Variant not found')
    }

    // 2. Update Stock
    await tx.update(productVariants)
      .set({ 
        stockCount: newStock,
        inStock: newStock > 0,
        updatedAt: new Date()
      })
      .where(eq(productVariants.id, variantId))

    // 3. Create Audit Log (Lean Query: Only insert needed fields)
    await tx.insert(activityLogs).values({
      userId: session.user.id,
      action: 'UPDATE_STOCK',
      entityType: 'product_variant',
      entityId: variantId,
      oldValues: JSON.stringify({ stock: currentVariant.stockCount }),
      newValues: JSON.stringify({ stock: newStock }),
      ipAddress: 'server-action', // Can't easily get IP in SA without headers helper
      userAgent: 'system',
    })
  })

  // 4. Revalidate cache
  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  
  return { success: true, message: 'Stok berhasil diperbarui' }
}
