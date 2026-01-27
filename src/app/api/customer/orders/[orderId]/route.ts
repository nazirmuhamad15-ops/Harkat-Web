import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db-drizzle'
import { orders, orderItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await context.params
    
    console.log('Looking for order:', orderId)
    console.log('Session user:', session.user.email)

    // Simple query - just find by orderNumber
    const orderResult = await db.select().from(orders).where(eq(orders.orderNumber, orderId)).limit(1)
    const order = orderResult[0]

    console.log('Order found:', !!order, order?.id)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order items separately
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))

    return NextResponse.json({ 
      order: {
        ...order,
        orderItems: items
      }
    })
  } catch (error) {
    console.error('Get order error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Server error', 
      details: errorMessage
    }, { status: 500 })
  }
}
