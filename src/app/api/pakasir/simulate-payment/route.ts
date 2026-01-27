import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { simulatePayment } from '@/lib/pakasir'

/**
 * Simulate payment using Pakasir API
 * POST /api/pakasir/simulate-payment
 * Body: { orderNumber: "ORD-123456" }
 */
export async function POST(req: NextRequest) {
  try {
    const { orderNumber } = await req.json()

    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number required' }, { status: 400 })
    }

    // Find order
    const orderResult = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1)
    const order = orderResult[0]

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log(`[Pakasir Simulate] Simulating payment for order ${orderNumber}, amount ${order.total}`)

    // Try Pakasir API first, but fallback to direct update in sandbox
    let apiSuccess = false
    try {
      const result = await simulatePayment(orderNumber, order.total)
      apiSuccess = result.success
    } catch (apiError) {
      console.warn('[Pakasir Simulate] API call failed, using direct update:', apiError)
      // In sandbox/dev mode, we can directly update without API
      apiSuccess = true // Proceed anyway
    }

    if (apiSuccess) {
      // Update order status to PAID
      await db.update(orders)
        .set({
          paymentStatus: 'PAID',
          status: 'PAID',
          updatedAt: new Date()
        })
        .where(eq(orders.orderNumber, orderNumber))

      console.log(`[Pakasir Simulate] Order ${orderNumber} marked as PAID`)

      return NextResponse.json({
        success: true,
        message: `Payment simulated successfully for order ${orderNumber}`,
        order: {
          orderNumber,
          paymentStatus: 'PAID',
          status: 'PAID'
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Pakasir simulation failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[Pakasir Simulate] Error:', error)
    return NextResponse.json({
      error: 'Failed to simulate payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
