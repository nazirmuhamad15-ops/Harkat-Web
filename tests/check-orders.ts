import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkOrders() {
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      }
    })
    
    console.log('📦 Orders in database:')
    if (orders.length === 0) {
      console.log('❌ No orders found')
    } else {
      orders.forEach((order, index) => {
        console.log(`${index + 1}. #${order.orderNumber} - ${order.customerName} (${order.status})`)
      })
    }
    
    // Test with specific order number
    const testOrder = await prisma.order.findFirst({
      where: { orderNumber: { contains: 'HF' } }
    })
    
    if (testOrder) {
      console.log('\n🎯 Sample order found:')
      console.log(`Order Number: ${testOrder.orderNumber}`)
      console.log(`Can track with: http://localhost:3000/track/${testOrder.orderNumber}`)
    }
    
  } catch (error) {
    console.error('Error checking orders:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrders()