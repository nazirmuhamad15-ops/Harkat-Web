import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks, orders, users } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuditLogger, ActivityType } from '@/lib/audit-logger'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { orderId, driverId, scheduledDate } = await request.json()

    if (!orderId || !driverId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify order and driver exist
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId)
    })
    const driver = await db.query.users.findFirst({
        where: eq(users.id, driverId)
    })

    if (!order || !driver) {
        return NextResponse.json({ error: 'Order or Driver not found' }, { status: 404 })
    }

    // Create Task
    const [newTask] = await db.insert(driverTasks).values({
        orderId,
        driverId,
        status: 'ASSIGNED',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.shippingAddress, // Assuming string or need parsing? Schema says text.
    }).returning()

    // Update Order Status to PROCESSING if PENDING
    if (order.status === 'PENDING') {
        await db.update(orders)
            .set({ status: 'PROCESSING', shippingVendor: 'INTERNAL_FLEET' })
            .where(eq(orders.id, orderId))
    }

    // Log Activity
    await AuditLogger.log({
        userId: session.user.id,
        action: ActivityType.CREATE_DRIVER_TASK,
        entityType: 'driver_task',
        entityId: newTask.id,
        newValues: newTask,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, task: newTask })

  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
