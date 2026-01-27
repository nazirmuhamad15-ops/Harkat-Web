import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPaymentReminder } from '@/lib/whatsapp-notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Find abandoned pending orders
    // Criteria: PENDING status, PENDING payment, Created 30 mins to 24 hours ago
    // And reminder not sent
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const abandonedOrders = await db.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        reminderSent: false,
        createdAt: {
          lt: thirtyMinsAgo,
          gt: twentyFourHoursAgo
        },
        customerPhone: { not: null } 
      }
    })

    console.log(`[AbandonedRecovery] Found ${abandonedOrders.length} orders to remind.`)

    // 2. Send Reminders
    let sentCount = 0
    for (const order of abandonedOrders) {
       if (!order.customerPhone) continue;

       // Need to shape data for sendPaymentReminder
       const sent = await sendPaymentReminder({
         orderNumber: order.orderNumber,
         customerName: order.customerName,
         customerPhone: order.customerPhone,
         totalAmount: order.total
       })

       if (sent) {
         // Update DB
         await db.order.update({
           where: { id: order.id },
           data: { reminderSent: true }
         })
         sentCount++
       }
    }

    return NextResponse.json({ 
      success: true, 
      processed: abandonedOrders.length,
      sent: sentCount 
    })

  } catch (error: any) {
    console.error('Abandoned Cart Cron Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
