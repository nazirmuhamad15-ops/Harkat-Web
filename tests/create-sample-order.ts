import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleOrder() {
  try {
    console.log('🛠️ Creating sample order...')
    
    // Get first product
    const product = await prisma.product.findFirst()
    
    if (!product) {
      console.log('❌ No products found')
      return
    }
    
    // Create sample order
    const order = await prisma.order.create({
      data: {
        orderNumber: `HF-ORD-${Date.now()}`,
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        customerPhone: '+628123456789',
        shippingAddress: JSON.stringify({
          street: '123 Main Street',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: '12345',
          country: 'Indonesia'
        }),
        subtotal: product.price,
        shippingCost: 50000,
        volumetricWeight: (product.length * product.width * product.height) / 4000,
        finalWeight: Math.max(product.weight, (product.length * product.width * product.height) / 4000),
        total: product.price + 50000,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        shippingVendor: 'Internal Trucking',
        trackingNumber: `TRK-${Date.now()}`,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Sample order for testing',
      }
    })
    
    console.log('✅ Sample order created:')
    console.log(`Order Number: ${order.orderNumber}`)
    console.log(`Tracking Number: ${order.trackingNumber}`)
    console.log(`Can track with: http://localhost:3000/track/${order.orderNumber}`)
    
    // Create order item
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
      }
    })
    
    console.log('✅ Order item created')
    
  } catch (error) {
    console.error('Error creating sample order:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleOrder()