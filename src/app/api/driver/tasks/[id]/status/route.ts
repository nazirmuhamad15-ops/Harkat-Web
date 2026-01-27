import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks, orders, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
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

    const { status } = await request.json()
    const { id: taskId } = await params

    console.log('[Status Update] Task ID:', taskId, 'New Status:', status, 'Driver:', session.user.id)

    // Verify task belongs to this driver using manual select
    const existingTasks = await db.select()
      .from(driverTasks)
      .where(and(
        eq(driverTasks.id, taskId),
        eq(driverTasks.driverId, session.user.id)
      ))
      .limit(1)

    if (existingTasks.length === 0) {
      console.log('[Status Update] Task not found or access denied')
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const existingTask = existingTasks[0]
    console.log('[Status Update] Current status:', existingTask.status)

    // Update task status
    const [updatedTask] = await db.update(driverTasks)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(driverTasks.id, taskId))
      .returning()

    console.log('[Status Update] Updated successfully to:', status)

    // Sync Order Status
    let orderStatus = ''
    if (status === 'PICKED_UP') orderStatus = 'PROCESSING'
    if (status === 'IN_TRANSIT') orderStatus = 'SHIPPED'
    if (status === 'DELIVERED') orderStatus = 'DELIVERED'

    if (orderStatus) {
      await db.update(orders)
        .set({ 
          status: orderStatus,
          updatedAt: new Date()
        })
        .where(eq(orders.id, existingTask.orderId))
      console.log('[Status Update] Order status synced to:', orderStatus)
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: 'UPDATE_TASK_STATUS',
      entityType: 'DRIVER_TASK',
      entityId: taskId,
      oldValues: JSON.stringify({ status: existingTask.status }),
      newValues: JSON.stringify({ status }),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('Failed to update task status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}