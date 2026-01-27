import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-drizzle';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkPaymentStatus } from '@/lib/pakasir';

/**
 * Pakasir Webhook Handler
 * Receives payment notifications from Pakasir and updates order status
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/pakasir
 * Method: POST
 * Payload: { order_id: string, amount: number, status: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('[Pakasir Webhook] Received:', body);
    
    const { order_id, amount, status } = body;
    
    // Validate required fields
    if (!order_id || !amount) {
      console.error('[Pakasir Webhook] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: order_id, amount' },
        { status: 400 }
      );
    }
    
    // Security: Verify payment status with Pakasir API
    // Never trust webhook payload alone
    let paymentDetail;
    try {
      paymentDetail = await checkPaymentStatus(order_id, amount);
    } catch (error) {
      console.error('[Pakasir Webhook] Failed to verify payment:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment status' },
        { status: 500 }
      );
    }
    
    console.log('[Pakasir Webhook] Verified payment status:', paymentDetail.status);
    
    // Find the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, order_id)
    });
    
    if (!order) {
      console.error(`[Pakasir Webhook] Order not found: ${order_id}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Prevent duplicate processing
    if (order.paymentStatus === 'PAID') {
      console.log(`[Pakasir Webhook] Order ${order_id} already marked as PAID`);
      return NextResponse.json({ 
        success: true, 
        message: 'Order already processed' 
      });
    }
    
    // Update order based on payment status
    if (paymentDetail.status === 'completed') {
      // Payment successful
      await db.update(orders)
        .set({
          status: 'PAID',
          paymentStatus: 'PAID',
          paymentVaNumber: paymentDetail.paymentNumber || null,
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));
      
      console.log(`[Pakasir Webhook] Order ${order_id} marked as PAID`);
      
      // Send WhatsApp notification for successful payment
      try {
        const { sendPaymentConfirmation } = await import('@/lib/whatsapp-notifications');
        await sendPaymentConfirmation({
          orderNumber: order_id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.total,
          paymentMethod: paymentDetail.paymentMethod
        });
      } catch (e) {
        console.error('[Pakasir Webhook] Failed to send WhatsApp notification:', e);
        // Don't fail the webhook if notification fails
      }
      
    } else if (paymentDetail.status === 'failed') {
      // Payment failed
      await db.update(orders)
        .set({
          paymentStatus: 'FAILED',
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));
      
      console.log(`[Pakasir Webhook] Order ${order_id} marked as FAILED`);
      
    } else if (paymentDetail.status === 'expired') {
      // Payment expired
      await db.update(orders)
        .set({
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));
      
      console.log(`[Pakasir Webhook] Order ${order_id} marked as EXPIRED/CANCELLED`);
      
    } else {
      // Unknown status
      console.warn(`[Pakasir Webhook] Unknown payment status: ${paymentDetail.status}`);
    }
    
    // Return 200 OK to Pakasir
    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully'
    });
    
  } catch (error) {
    console.error('[Pakasir Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing/verification)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    service: 'Pakasir Webhook Handler',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}
