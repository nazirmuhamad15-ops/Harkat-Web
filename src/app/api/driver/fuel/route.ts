import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fuelLogs, vehicles, driverTasks, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, desc, inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session?.user?.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vehicleId, orderId, liters, cost, odometer, receiptUrl, notes } = body

    const [fuelLog] = await db.insert(fuelLogs).values({
        vehicleId,
        driverId: session.user.id,
        orderId: orderId || null,
        liters: parseFloat(liters),
        cost: parseFloat(cost),
        odometer: parseInt(odometer),
        receiptUrl,
        notes
    }).returning()

    await db.insert(activityLogs).values({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'FUEL_LOG',
        entityId: fuelLog.id,
        newValues: JSON.stringify(fuelLog),
    })

    return NextResponse.json({ success: true, fuelLog })
  } catch (error) {
    console.error('Failed to create fuel log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const allVehicles = await db.query.vehicles.findMany({
          columns: { id: true, name: true, licensePlate: true }
      })

      const activeTasks = await db.query.driverTasks.findMany({
          where: and(
              eq(driverTasks.driverId, session.user.id),
              inArray(driverTasks.status, ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'])
          ),
          with: {
              order: {
                  columns: {
                      id: true,
                      orderNumber: true,
                      customerName: true
                  }
              }
          }
      })

      const recentDriverLogs = await db.query.fuelLogs.findMany({
          where: eq(fuelLogs.driverId, session.user.id),
          orderBy: desc(fuelLogs.createdAt),
          limit: 5,
          with: { 
            vehicle: { 
                columns: { name: true, licensePlate: true } 
            } 
          }
      })
  
      return NextResponse.json({ 
          vehicles: allVehicles, 
          activeOrders: activeTasks.map(task => task.order).filter(Boolean),
          recentLogs: recentDriverLogs 
      })
    } catch (error) {
      console.error('Failed to fetch fuel data:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { and } from 'drizzle-orm'
