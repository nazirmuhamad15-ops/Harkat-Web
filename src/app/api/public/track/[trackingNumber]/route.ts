import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders as ordersTable, orderItems, productVariants, products, productVariantAttributes, productAttributeValues, productAttributes } from '@/db/schema'
import { eq, or } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params

    // Search by Order Number OR Tracking Number (simple query)
    const orderResult = await db.select().from(ordersTable).where(
      or(
        eq(ordersTable.orderNumber, trackingNumber),
        eq(ordersTable.trackingNumber, trackingNumber)
      )
    ).limit(1)

    const order = orderResult[0]

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order items separately
    const items = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      total: orderItems.total,
      productVariantId: orderItems.productVariantId,
    }).from(orderItems).where(eq(orderItems.orderId, order.id))

    // Fetch product details and variant attributes for each item
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        // Get variant info
        const variantResult = await db.select({
          productId: productVariants.productId,
          sku: productVariants.sku,
          price: productVariants.price,
        }).from(productVariants).where(eq(productVariants.id, item.productVariantId)).limit(1)
        
        const variant = variantResult[0]
        
        if (variant) {
          // Get product info
          const productResult = await db.select({
            name: products.name,
            images: products.images,
          }).from(products).where(eq(products.id, variant.productId)).limit(1)
          
          const product = productResult[0]

          // Get variant attributes (color, size, finishing, etc)
          const variantAttrs = await db.select({
            attributeValueId: productVariantAttributes.attributeValueId,
          }).from(productVariantAttributes).where(eq(productVariantAttributes.variantId, item.productVariantId))

          // Fetch attribute details
          const attributes = await Promise.all(
            variantAttrs.map(async (attr) => {
              const attrValueResult = await db.select({
                value: productAttributeValues.value,
                attributeId: productAttributeValues.attributeId,
              }).from(productAttributeValues).where(eq(productAttributeValues.id, attr.attributeValueId)).limit(1)

              const attrValue = attrValueResult[0]
              
              if (attrValue) {
                const attrNameResult = await db.select({
                  name: productAttributes.name,
                }).from(productAttributes).where(eq(productAttributes.id, attrValue.attributeId)).limit(1)

                const attrName = attrNameResult[0]

                return {
                  name: attrName?.name || 'Unknown',
                  value: attrValue.value
                }
              }
              return null
            })
          )

          const validAttributes = attributes.filter(a => a !== null)
          
          return {
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            sku: variant.sku,
            product: {
              name: product?.name || 'Unknown',
              images: product?.images || '[]'
            },
            variant: {
              attributes: validAttributes
            }
          }
        }
        
        return {
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          product: {
            name: 'Unknown',
            images: '[]'
          },
          variant: {
            attributes: []
          }
        }
      })
    )
    
    const responseData = {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        shippingVendor: order.shippingVendor,
        trackingNumber: order.trackingNumber || 'Pending',
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
        driverLocation: null, // TODO: Implement driver location if needed
        orderItems: itemsWithProducts
    }

    return NextResponse.json({ success: true, data: responseData })

  } catch (error) {
    console.error('Track API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
