import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks, orders, orderItems, productVariants, products } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session?.user?.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('Fetching Task with ID:', id);

    // Using standard select to avoid relational query issues if schema is misconfigured
    const taskData = await db.select()
      .from(driverTasks)
      .where(eq(driverTasks.id, id))
      .limit(1);

    if (taskData.length === 0) {
      console.log('Task not found in DB');
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = taskData[0];

    // Verify ownership
    if (task.driverId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch Order Details
    const orderData = await db.select().from(orders).where(eq(orders.id, task.orderId)).limit(1);
    if (orderData.length === 0) {
        return NextResponse.json({ error: 'Associated order not found' }, { status: 404 });
    }
    const order = orderData[0];

    // Fetch Order Items with Product info
    const items = await db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        productName: products.name,
        sku: productVariants.sku
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

    // Transform
    const transformedTask = {
        id: task.id,
        status: task.status,
        notes: task.notes,
        order: {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress,
            total: order.total,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            orderNotes: order.notes,
            createdAt: order.createdAt,
            items: items.map(item => ({
                productName: item.productName || 'Unknown',
                variantName: item.sku || '', 
                quantity: item.quantity,
                price: item.unitPrice
            }))
        }
    }

    return NextResponse.json({ task: transformedTask })
  } catch (error) {
    console.error('Failed to fetch task detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
