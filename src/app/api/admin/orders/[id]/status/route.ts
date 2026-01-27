import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, activityLogs, whatsappTemplates } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, trackingNumber } = await request.json()
    const { id } = await params
    const orderId = id

    // Get the existing order to retrieve customer details
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        total: true,
        status: true,
        trackingNumber: true,
        shippingVendor: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // If status is SHIPPED
    if (status === 'SHIPPED') {
      if (trackingNumber) {
        // User provided tracking number manually (RajaOngkir/Manual)
        updateData.trackingNumber = trackingNumber;
      } else {
        // Auto-generate for Internal Fleet if tracking number is missing
        const isInternalFleet = existingOrder.shippingVendor === 'INTERNAL_FLEET' || existingOrder.shippingVendor === 'INTERNAL';
        
        if (isInternalFleet) {
           const timestamp = Date.now().toString().slice(-6);
           const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
           updateData.trackingNumber = `HRKT-INT-${timestamp}${random}`;
           console.log(`[Status Update] Auto-generated tracking number for Internal Fleet: ${updateData.trackingNumber}`);
        }
      }
    }

    // Update order status
    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning()

    // Send WhatsApp notification if status changed
    if (existingOrder.status !== status && existingOrder.customerPhone) {
      console.log(`[Status Update] Order ${existingOrder.orderNumber} status changing: ${existingOrder.status} -> ${status}`);
      
      const STATUS_TEMPLATE_MAP: Record<string, string> = {
        'SHIPPED': 'shipping_update',
        'DELIVERED': 'order_delivered',
        'CANCELLED': 'order_cancelled',
        'PROCESSING': 'order_processing',
        'PAID': 'payment_confirmed',
      };

      let message = '';
      const templateName = STATUS_TEMPLATE_MAP[status];

      // 1. Try to get template from DB
      if (templateName) {
        try {
           const template = await db.query.whatsappTemplates.findFirst({
             where: eq(whatsappTemplates.name, templateName)
           });

           if (template && template.isActive) {
             console.log(`[Status Update] Found active template: ${templateName}`);
             message = template.content
               .replace(/{{customer_name}}/g, existingOrder.customerName)
               .replace(/{{order_number}}/g, existingOrder.orderNumber)
               .replace(/{{order_total}}/g, existingOrder.total.toLocaleString('id-ID'))
               .replace(/{{store_name}}/g, 'Harkat Furniture')
               .replace(/{{tracking_number}}/g, updateData.trackingNumber || trackingNumber || existingOrder.trackingNumber || '-') // Use new (auto-gen or manual) or existing
               .replace(/{{delivery_date}}/g, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'));
           } else {
             console.log(`[Status Update] Template ${templateName} not found or inactive`);
           }
        } catch (err) {
          console.error('[Status Update] Template fetch/format error:', err);
          // Continue to fallback
        }
      }

      // 2. Fallback if no message generated from template
      if (!message) {
         console.log(`[Status Update] Using fallback message for ${status}`);
         switch (status) {
          case 'PAID':
            message = `Halo ${existingOrder.customerName},\nPembayaran untuk pesanan #${existingOrder.orderNumber} telah kami *TERIMA*. ✅\nKami akan segera memproses pesanan Anda. Terima kasih!`;
            break;
          case 'SHIPPED':
            const tracking = updateData.trackingNumber || trackingNumber || existingOrder.trackingNumber || '-';
            message = `Halo ${existingOrder.customerName},\nKabar Gembira! 🚚\nPesanan #${existingOrder.orderNumber} sudah *DIKIRIM* (SHIPPED).\n\nNo. Resi: *${tracking}*\n\nMohon pastikan ada penerima di alamat tujuan.\nTerima kasih telah berbelanja di Harkat Furniture!`;
            break;
          case 'DELIVERED':
            message = `Halo ${existingOrder.customerName},\nPesanan #${existingOrder.orderNumber} telah sukses *DITERIMA* (DELIVERED). ✅\nTerima kasih telah mempercayai Harkat Furniture.\nKami tunggu pesanan berikutnya! 🛋️`;
            break;
          case 'CANCELLED':
            message = `Halo ${existingOrder.customerName},\nMohon maaf, pesanan #${existingOrder.orderNumber} telah *DIBATALKAN*. ❌\nJika ini kesalahan atau Anda memiliki pertanyaan, silakan hubungi admin kami.`;
            break;
          case 'PROCESSING':
            message = `Halo ${existingOrder.customerName},\nPesanan #${existingOrder.orderNumber} sedang kami *PROSES*. 🛠️\nTim kami sedang menyiapkan barang pesanan Anda.`;
            break;
          default:
            message = `Halo ${existingOrder.customerName},\nStatus pesanan #${existingOrder.orderNumber} diperbarui menjadi *${status}*.`;
        }
      }

      // 3. Send the message
      if (message) {
           console.log(`[Status Update] Sending WA to ${existingOrder.customerPhone}...`);
           try {
             const result = await sendWhatsAppMessage(existingOrder.customerPhone, message);
             console.log('[Status Update] WA Send Result:', result);
           } catch (sendErr) {
             console.error('[Status Update] Failed to send WA:', sendErr);
           }
      } else {
           console.warn('[Status Update] No message generated, skipping WA');
      }
    }

    // Log the activity
    await db.insert(activityLogs).values({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ORDER',
        entityId: orderId,
        oldValues: JSON.stringify({ status: existingOrder.status }),
        newValues: JSON.stringify({ status }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Failed to update order status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}