import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks, orders, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { notes, proofImage } = await request.json()
    const { id: taskId } = await params

    // Verify task belongs to this driver
    const existingTask = await db.query.driverTasks.findFirst({
      where: and(
        eq(driverTasks.id, taskId),
        eq(driverTasks.driverId, session.user.id)
      )
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task with proof of delivery
    const [updatedTask] = await db.update(driverTasks)
      .set({
        status: 'DELIVERED',
        deliveryNotes: notes,
        deliveryPhotoUrl: proofImage,
        deliveredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(driverTasks.id, taskId))
      .returning()

    // Update order status
    await db.update(orders)
      .set({ 
        status: 'DELIVERED',
        updatedAt: new Date()
      })
      .where(eq(orders.id, existingTask.orderId))

    // Log activity
    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: 'SUBMIT_POD',
      entityType: 'DRIVER_TASK',
      entityId: taskId,
      newValues: JSON.stringify({ status: 'DELIVERED', notes }),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('Failed to submit proof of delivery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}