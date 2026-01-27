import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, whatsappTemplates } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, action } = body

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Order ID and action required' }, { status: 400 })
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId)
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Approve payment - change status to PAID and order to PROCESSING
      await db.update(orders)
        .set({
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))

      // Send WhatsApp Notification
      if (order.customerPhone) {
        try {
          const template = await db.query.whatsappTemplates.findFirst({
             where: eq(whatsappTemplates.name, 'payment_confirmed')
          });

          let message = '';
          if (template && template.isActive) {
             message = template.content
               .replace(/{{customer_name}}/g, order.customerName)
               .replace(/{{order_number}}/g, order.orderNumber)
               .replace(/{{order_total}}/g, order.total.toLocaleString('id-ID'))
               .replace(/{{store_name}}/g, 'Harkat Furniture');
          } else {
             // Fallback
             message = `Halo ${order.customerName},\nPembayaran untuk pesanan #${order.orderNumber} telah kami terima & verifikasi. ✅\nStatus pesanan Anda sekarang diubah menjadi *PROCESSING*.\nKami akan segera memproses pengiriman pesanan Anda.\nTerima kasih!`;
          }
          
          await sendWhatsAppMessage(order.customerPhone, message);
        } catch (err) {
          console.error('WA send error:', err);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payment approved. Order is now processing.' 
      })
    } else if (action === 'reject') {
      // Reject payment - change back to PENDING
      await db.update(orders)
        .set({
          paymentStatus: 'FAILED',
          notes: `${order.notes || ''}\n[Admin]: Payment rejected`,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))

      return NextResponse.json({ 
        success: true, 
        message: 'Payment rejected.' 
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Payment approval error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
