import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks, orders } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, desc, and } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Using standard select with join and proper mapping
    const rawTasks = await db.select({
        id: driverTasks.id,
        status: driverTasks.status,
        createdAt: driverTasks.createdAt,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
    })
    .from(driverTasks)
    .innerJoin(orders, eq(driverTasks.orderId, orders.id))
    .where(eq(driverTasks.driverId, session.user.id))
    .orderBy(desc(driverTasks.createdAt));

    // Map to nested structure expected by frontend
    const tasks = rawTasks.map(t => ({
        id: t.id,
        status: t.status,
        createdAt: t.createdAt,
        order: {
            orderNumber: t.orderNumber,
            customerName: t.customerName,
            customerPhone: t.customerPhone,
            shippingAddress: t.shippingAddress,
            trackingNumber: t.trackingNumber
        }
    }));

    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error('Failed to fetch driver tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}