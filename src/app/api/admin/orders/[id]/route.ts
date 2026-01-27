import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orders, orderItems, productVariants, products, users } from '@/db/schema' 
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[API Order Detail] Session:', session?.user?.email, (session?.user as any)?.role)
    
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      console.log('[API Order Detail] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('[API Order Detail] Fetching order ID:', id)

    // Fetch order data using standard select
    const orderData = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    
    if (!orderData || orderData.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderData[0]

    // Fetch order items with product details using joins
    const items = await db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        total: orderItems.total,
        productName: products.name,
        productImages: products.images
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orderItems.orderId, id))

    // Map items to frontend structure
    const mappedItems = items.map(item => {
        let imageUrl = null
        
        if (item.productImages) {
           try {
             const parsed = JSON.parse(item.productImages as string)
             if (Array.isArray(parsed) && parsed.length > 0) {
                imageUrl = typeof parsed[0] === 'string' ? parsed[0] : parsed[0].url 
             }
           } catch (e) {
             console.log('Failed to parse product images:', e)
           }
        }

        return {
          id: item.id,
          productName: item.productName || 'Unknown Product',
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.total,
          image: imageUrl
        }
    })

    const response = {
      ...order,
      items: mappedItems
    }

    return NextResponse.json({ order: response })
  } catch (error: any) {
    console.error('Failed to fetch order details:', error?.message, error?.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete an order (SUPER_ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[API Order Delete] Session:', session?.user?.email, (session?.user as any)?.role)
    
    // SECURITY: Only SUPER_ADMIN can delete orders
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      console.log('[API Order Delete] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized - Only SUPER_ADMIN can delete orders' }, { status: 403 })
    }

    const { id } = await params
    console.log('[API Order Delete] Deleting order ID:', id)

    // Check if order exists
    const orderData = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    
    if (!orderData || orderData.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Delete order items first (foreign key constraint)
    await db.delete(orderItems).where(eq(orderItems.orderId, id))
    console.log('[API Order Delete] Deleted order items for order:', id)

    // Delete the order
    await db.delete(orders).where(eq(orders.id, id))
    console.log('[API Order Delete] Successfully deleted order:', id)

    return NextResponse.json({ 
      success: true, 
      message: 'Order deleted successfully',
      deletedOrderNumber: orderData[0].orderNumber 
    })
  } catch (error: any) {
    console.error('Failed to delete order:', error?.message, error?.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
