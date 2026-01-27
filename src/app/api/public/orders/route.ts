import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders, orderItems, productVariants, products } from '@/db/schema' 
import { eq } from 'drizzle-orm'
import { createPayment } from '@/lib/pakasir'
import { createOrderSchema } from '@/lib/validation/order.schema'
import { ZodError } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get user session if logged in
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null
    
    console.log('[OrderAPI] User session:', userId ? `Logged in as ${userId}` : 'Guest checkout')
    
    // 1. Parse and validate input
    const rawData = await request.json()
    
    let validatedData
    try {
      validatedData = createOrderSchema.parse(rawData)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: error.errors?.map(err => ({
              field: err.path?.join('.') || 'unknown',
              message: err.message || 'Validation error'
            })) || []
          },
          { status: 400 }
        )
      }
      console.error('[Order Validation] Non-Zod error:', error)
      return NextResponse.json(
        { error: 'Validation error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      )
    }
    
    const { 
        customerName, 
        customerEmail, 
        customerPhone, 
        shippingAddress,
        items, 
        shippingCost, 
        notes,
        shippingVendor,
        volumetricWeight,
        finalWeight,
        couponCode,
        discountAmount
    } = validatedData

    // 1. Validate and Fix Items
    const processedItems = []
    
    for (const item of items) {
        let variantId = item.productVariantId
        
        // ... (check variant logic)
        
        // Check if variant exists
        let variant = await db.query.productVariants.findFirst({
            where: eq(productVariants.id, variantId),
            with: { product: true }
        })

        if (!variant) {
            // Fallback strategy
            const product = await db.query.products.findFirst({
                where: eq(products.id, variantId),
                with: { 
                    variants: { limit: 1 } 
                }
            })

            if (product && product.variants.length > 0) {
                console.log(`⚠️ Recovered variant for product ${product.name}: ${product.variants[0].id}`)
                variantId = product.variants[0].id
                // Re-fetch correct variant details
                 variant = await db.query.productVariants.findFirst({
                    where: eq(productVariants.id, variantId),
                    with: { product: true }
                })
            } else {
                throw new Error(`Product/Variant not found for ID: ${variantId}`)
            }
        }
        
        const unitPrice = item.price || variant?.price || 0
        const totalLine = unitPrice * item.quantity

        processedItems.push({
            productVariantId: variantId!,
            quantity: item.quantity,
            unitPrice: unitPrice,
            total: totalLine
        })
    }

    const subtotal = processedItems.reduce((acc, item) => acc + item.total, 0)
    
    // Calculate final total with discount
    let finalDiscount = discountAmount || 0
    if (finalDiscount > subtotal) finalDiscount = subtotal // Cap discount at subtotal (excluding shipping)
    
    const total = subtotal + shippingCost - finalDiscount

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}` 
    console.log(`[OrderAPI] Creating Order ${orderNumber}...`)

    // 2. Create Order & Items Transactionally
    const newOrder = await db.transaction(async (tx) => {
        const [insertedOrder] = await tx.insert(orders).values({
            orderNumber,
            userId, // Link to user if logged in
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress, 
            subtotal,
            shippingCost,
            total,
            couponCode: couponCode || null,
            discountAmount: finalDiscount,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: 'PAKASIR', 
            notes,
            shippingVendor,
            volumetricWeight,
            finalWeight,
        }).returning()

        if (!insertedOrder) throw new Error('Failed to create order record')

        // Insert Items
        if (processedItems.length > 0) {
             await tx.insert(orderItems).values(
                 processedItems.map(item => ({
                     orderId: insertedOrder.id,
                     productVariantId: item.productVariantId,
                     quantity: item.quantity,
                     unitPrice: item.unitPrice,
                     total: item.total
                 }))
             )
        }
        
        return insertedOrder
    })

    console.log(`[OrderAPI] Order Created. Initiating Pakasir Payment...`)
    console.log(`[OrderAPI] Payment details: orderId=${orderNumber}, amount=${total}`)

    // 3. Initiate Pakasir Payment
    let payment;
    try {
      const selectedMethod = rawData.paymentMethod || 'all';
      console.log(`[OrderAPI] Selected Payment Method: ${selectedMethod}`)

      payment = await createPayment(
          selectedMethod, 
          orderNumber,
          total,
          `${process.env.NEXT_PUBLIC_BASE_URL}/track?order=${orderNumber}&status=success`
      )
      console.log(`[OrderAPI] Pakasir Payment Result:`, payment)
    } catch (error) {
      console.error(`[OrderAPI] Pakasir Payment Error:`, error)
      // Return error to frontend
      return NextResponse.json(
        { error: 'Payment initialization failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // 4. Update order with payment details
    await db.update(orders)
      .set({
        paymentUrl: payment.paymentUrl,
        paymentMethod: payment.paymentMethod,
        paymentFee: payment.fee,
        paymentExpiredAt: payment.expiresAt ? new Date(payment.expiresAt) : null
      })
      .where(eq(orders.id, newOrder.id))

    // 5. Send WhatsApp Notification
    try {
        const { sendOrderConfirmation } = await import('@/lib/whatsapp-notifications')
        await sendOrderConfirmation({
            orderNumber,
            customerName,
            customerPhone,
            totalAmount: total
        })
    } catch (e) {
        console.error('Failed to send WhatsApp notification:', e)
    }

    return NextResponse.json({ 
        success: true, 
        order: newOrder, 
        paymentUrl: payment.paymentUrl || null 
    })

  } catch (error: any) {
    console.error('Order creation failed:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
