import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks, users, orders } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and, desc, isNotNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch active tasks with valid coordinates using manual joins
    const tasks = await db.select({
        taskId: driverTasks.id,
        status: driverTasks.status,
        currentLat: driverTasks.currentLat,
        currentLng: driverTasks.currentLng,
        lastGpsPing: driverTasks.lastGpsPing,
        customerName: driverTasks.customerName,
        driverName: users.name,
        driverPhone: users.phone,
        orderNumber: orders.orderNumber,
        orderCustomerName: orders.customerName
    })
    .from(driverTasks)
    .innerJoin(users, eq(driverTasks.driverId, users.id))
    .innerJoin(orders, eq(driverTasks.orderId, orders.id))
    .where(and(
        isNotNull(driverTasks.currentLat),
        isNotNull(driverTasks.currentLng)
    ))
    .orderBy(desc(driverTasks.lastGpsPing))

    const mapData = tasks.map(task => ({
        id: task.taskId,
        driverName: task.driverName,
        driverPhone: task.driverPhone,
        orderNumber: task.orderNumber,
        customerName: task.customerName || task.orderCustomerName,
        status: task.status,
        lat: task.currentLat,
        lng: task.currentLng,
        lastPing: task.lastGpsPing
    }))

    return NextResponse.json({ data: mapData })

  } catch (error) {
    console.error('Error fetching map data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
