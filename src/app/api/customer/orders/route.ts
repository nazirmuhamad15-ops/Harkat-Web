import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders, orderItems, productVariants, products, productReviews } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, or, desc, and, inArray } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const email = session.user.email

    console.log('[Customer Orders] Fetching for:', { userId, email })

    // Use simple select query to avoid relational errors
    const customerOrders = await db.select().from(orders).where(
      or(
        eq(orders.userId, userId),
        email ? eq(orders.customerEmail, email) : undefined
      )
    ).orderBy(desc(orders.createdAt))

    console.log('[Customer Orders] Found:', customerOrders.length, 'orders')

    // Get all reviews by this user to check which products are reviewed
    const userReviews = await db.select({
      productId: productReviews.productId
    }).from(productReviews).where(eq(productReviews.userId, userId))
    
    const reviewedProductIds = new Set(userReviews.map(r => r.productId))

    // Manually fetch order items for each order with product details
    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db.select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          total: orderItems.total,
          productVariantId: orderItems.productVariantId,
          productId: products.id,
          name: products.name,
          image: products.images,
        })
        .from(orderItems)
        .leftJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
        .leftJoin(products, eq(productVariants.productId, products.id))
        .where(eq(orderItems.orderId, order.id))

        // Parse images to get first image and check if reviewed
        const itemsWithImage = items.map(item => {
          let firstImage = '/placeholder-furniture.jpg'
          try {
            if (item.image) {
              const images = JSON.parse(item.image)
              firstImage = images[0] || firstImage
            }
          } catch (e) {}
          return {
            ...item,
            image: firstImage,
            isReviewed: item.productId ? reviewedProductIds.has(item.productId) : false
          }
        })

        // Check if all items in order are reviewed
        const allReviewed = itemsWithImage.length > 0 && itemsWithImage.every(item => item.isReviewed)

        return {
          ...order,
          orderItems: itemsWithImage,
          allReviewed
        }
      })
    )

    return NextResponse.json({ success: true, orders: ordersWithItems })

  } catch (error) {
    console.error('Customer orders error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
