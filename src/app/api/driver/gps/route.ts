import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and, inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session?.user?.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lat, lng } = body

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Find active task for this driver
    const activeTask = await db.query.driverTasks.findFirst({
      where: and(
        eq(driverTasks.driverId, session.user.id),
        inArray(driverTasks.status, ['PICKED_UP', 'IN_TRANSIT'])
      )
    })

    if (activeTask) {
      // Update the task with current location
      await db.update(driverTasks)
        .set({
          currentLat: lat,
          currentLng: lng,
          lastGpsPing: new Date(),
          updatedAt: new Date()
        })
        .where(eq(driverTasks.id, activeTask.id))
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
    })

  } catch (error) {
    console.error('GPS tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session?.user?.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get last known location from active task
    const activeTask = await db.query.driverTasks.findFirst({
      where: and(
        eq(driverTasks.driverId, session.user.id),
        inArray(driverTasks.status, ['PICKED_UP', 'IN_TRANSIT'])
      ),
      columns: {
        currentLat: true,
        currentLng: true,
        lastGpsPing: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: activeTask || {
        currentLat: null,
        currentLng: null,
        lastGpsPing: null,
      },
    })

  } catch (error) {
    console.error('Get GPS location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}