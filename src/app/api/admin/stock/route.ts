import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productVariants, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { asc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const variants = await db.query.productVariants.findMany({
      with: {
        product: {
          columns: {
            name: true,
            images: true
          }
        },
        attributes: {
            with: {
                attributeValue: {
                    with: {
                        attribute: true
                    }
                }
            }
        }
      },
      orderBy: asc(productVariants.stockCount)
    })

    const formattedVariants = variants.map(v => {
        let image = null
        try {
            if (v.images && typeof v.images === 'string') {
                const parsed = JSON.parse(v.images)
                image = Array.isArray(parsed) ? (typeof parsed[0] === 'string' ? parsed[0] : parsed[0].url) : null
            } else if (v.product?.images && typeof v.product.images === 'string') {
                const parsed = JSON.parse(v.product.images)
                image = Array.isArray(parsed) ? (typeof parsed[0] === 'string' ? parsed[0] : parsed[0].url) : null
            }
        } catch (e) {
            console.error('Error parsing images for variant', v.id)
            image = '/placeholder.png'
        }

        return {
            id: v.id,
            name: v.product?.name || 'Unknown',
            sku: v.sku,
            image,
            stock: v.stockCount,
            threshold: v.lowStockThreshold || 5,
            shelf: v.shelfLocation || '-',
            attributes: v.attributes.map(a => `${a.attributeValue?.attribute?.name}: ${a.attributeValue?.value}`).join(', ')
        }
    })

    return NextResponse.json({ data: formattedVariants })
  } catch (error) {
    console.error('Failed to fetch stock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const body = await request.json()
      const { id, stock, shelf, threshold } = body
  
      const updateData: any = {}
      if (stock !== undefined) updateData.stockCount = parseInt(stock)
      if (shelf !== undefined) updateData.shelfLocation = shelf
      if (threshold !== undefined) updateData.lowStockThreshold = parseInt(threshold)
      updateData.updatedAt = new Date()
  
      const [variant] = await db.update(productVariants)
          .set(updateData)
          .where(eq(productVariants.id, id))
          .returning()
  
      await db.insert(activityLogs).values({
          userId: session.user.id,
          action: 'UPDATE_STOCK',
          entityType: 'PRODUCT_VARIANT',
          entityId: id,
          newValues: JSON.stringify(updateData),
      })
  
      return NextResponse.json({ success: true, variant })
    } catch (error) {
      console.error('Failed to update stock:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
