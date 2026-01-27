import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'

/**
 * Generate Pakasir payment URL for old orders that don't have one
 * GET /api/test/fix-payment-urls
 */
export async function GET(req: NextRequest) {
  try {
    const PAKASIR_SLUG = process.env.PAKASIR_SLUG || 'harkat-furniture'
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Find all orders without paymentUrl and status PENDING
    const ordersWithoutUrl = await db.select()
      .from(orders)
      .where(eq(orders.paymentStatus, 'PENDING'))

    console.log(`[Fix Payment URLs] Found ${ordersWithoutUrl.length} pending orders`)

    let updated = 0
    for (const order of ordersWithoutUrl) {
      if (!order.paymentUrl || order.paymentUrl.includes('mock')) {
        // Generate Pakasir payment URL
        const paymentUrl = `https://app.pakasir.com/pay/${PAKASIR_SLUG}/${order.total}?order_id=${order.orderNumber}&redirect=${encodeURIComponent(`${BASE_URL}/track?order=${order.orderNumber}&status=success`)}`
        
        await db.update(orders)
          .set({
            paymentUrl,
            paymentMethod: 'all',
            updatedAt: new Date()
          })
          .where(eq(orders.id, order.id))

        console.log(`[Fix Payment URLs] Updated ${order.orderNumber}`)
        updated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} orders with Pakasir payment URLs`,
      total: ordersWithoutUrl.length,
      updated
    })

  } catch (error) {
    console.error('[Fix Payment URLs] Error:', error)
    return NextResponse.json({
      error: 'Failed to fix payment URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
