import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { checkPaymentStatus } from '@/lib/pakasir'

export async function POST(req: NextRequest) {
  try {
    const { orderNumber } = await req.json()

    if (!orderNumber) {
        return NextResponse.json({ error: 'Order Number required' }, { status: 400 })
    }

    const order = await db.query.orders.findFirst({
        where: eq(orders.orderNumber, orderNumber)
    })

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Call Pakasir to get latest status
    const paymentDetail = await checkPaymentStatus(orderNumber, order.total)
    console.log(`[VerifyPayment] Order ${orderNumber} status from Pakasir: ${paymentDetail.status}`)

    let updated = false
    if (paymentDetail.status === 'completed' && order.paymentStatus !== 'PAID') {
        await db.update(orders).set({
            status: 'PAID',
            paymentStatus: 'PAID',
            paymentVaNumber: paymentDetail.paymentNumber || null,
            updatedAt: new Date()
        }).where(eq(orders.id, order.id))
        updated = true
    } else if (paymentDetail.status === 'failed' && order.paymentStatus !== 'FAILED') {
        await db.update(orders).set({
            paymentStatus: 'FAILED',
            updatedAt: new Date()
        }).where(eq(orders.id, order.id))
        updated = true
    } else if (paymentDetail.status === 'expired' && order.paymentStatus !== 'FAILED') { // expired -> cancelled/failed
        await db.update(orders).set({
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            updatedAt: new Date()
        }).where(eq(orders.id, order.id))
        updated = true
    }

    // Refetch to return latest
    const latestOrder = updated ? await db.query.orders.findFirst({
        where: eq(orders.id, order.id)
    }) : order

    return NextResponse.json({ 
        success: true, 
        status: latestOrder?.status, 
        paymentStatus: latestOrder?.paymentStatus,
        updated 
    })

  } catch (error: any) {
    console.error('[VerifyPayment] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
