import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and, inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lat, lng } = await request.json()

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // Update all active tasks for this driver
    // Statuses based on TaskStatus enum in schema.ts
    await db.update(driverTasks)
        .set({
            currentLat: lat,
            currentLng: lng,
            lastGpsPing: new Date()
        })
        .where(
            and(
                eq(driverTasks.driverId, session.user.id),
                inArray(driverTasks.status, ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'])
            )
        )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
