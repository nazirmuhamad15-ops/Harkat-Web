import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Simulate payment success for testing
 * GET /api/test/simulate-payment?order=ORD-123456
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const orderNumber = searchParams.get('order')

    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number required' }, { status: 400 })
    }

    // Find order
    const orderResult = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1)
    const order = orderResult[0]

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update payment status to PAID
    await db.update(orders)
      .set({
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        updatedAt: new Date()
      })
      .where(eq(orders.orderNumber, orderNumber))

    console.log(`[Simulate Payment] Order ${orderNumber} marked as PAID`)

    return NextResponse.json({
      success: true,
      message: `Order ${orderNumber} payment simulated successfully`,
      order: {
        orderNumber,
        paymentStatus: 'PAID',
        status: 'PROCESSING'
      }
    })

  } catch (error) {
    console.error('[Simulate Payment] Error:', error)
    return NextResponse.json({
      error: 'Failed to simulate payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
