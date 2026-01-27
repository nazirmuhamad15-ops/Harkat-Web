import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-drizzle';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkPaymentStatus } from '@/lib/pakasir';

/**
 * API to verify payment status with Pakasir and update order
 * Called when user returns from Pakasir payment page
 * 
 * GET /api/pakasir/verify?order_id=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('order_id');
    
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing order_id parameter' },
        { status: 400 }
      );
    }
    
    console.log('[Pakasir Verify] Checking order:', orderNumber);
    
    // Find the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber)
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Already paid
    if (order.paymentStatus === 'PAID') {
      console.log('[Pakasir Verify] Order already PAID');
      return NextResponse.json({
        success: true,
        status: 'PAID',
        message: 'Order already paid'
      });
    }
    
    // Check with Pakasir API
    const isSandbox = process.env.PAKASIR_SANDBOX === 'true';
    let paymentStatus = 'pending';
    
    try {
      const paymentDetail = await checkPaymentStatus(orderNumber, order.total);
      paymentStatus = paymentDetail.status;
      console.log('[Pakasir Verify] Payment status from API:', paymentStatus);
    } catch (apiError) {
      console.warn('[Pakasir Verify] API check failed:', apiError);
      
      // In sandbox mode, if API fails but querystring says success, mark as paid
      if (isSandbox) {
        const queryStatus = searchParams.get('status');
        if (queryStatus === 'success') {
          console.log('[Pakasir Verify] Sandbox mode - treating as completed');
          paymentStatus = 'completed';
        }
      }
    }
    
    // Update based on status
    if (paymentStatus === 'completed' || paymentStatus === 'paid') {
      await db.update(orders)
        .set({
          status: 'PAID',
          paymentStatus: 'PAID',
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));
      
      console.log('[Pakasir Verify] Order updated to PAID');
      
      // Send WhatsApp notification
      try {
        const { sendPaymentConfirmation } = await import('@/lib/whatsapp-notifications');
        await sendPaymentConfirmation({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.total,
          paymentMethod: 'Pakasir'
        });
      } catch (e) {
        console.error('[Pakasir Verify] WA notification failed:', e);
      }
      
      return NextResponse.json({
        success: true,
        status: 'PAID',
        message: 'Payment verified and order updated'
      });
    }
    
    // Still pending
    return NextResponse.json({
      success: true,
      status: paymentStatus.toUpperCase(),
      message: 'Payment not yet completed'
    });
    
  } catch (error) {
    console.error('[Pakasir Verify] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
