import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { vehicles, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allVehicles = await db.query.vehicles.findMany({
      orderBy: desc(vehicles.createdAt),
      with: {
        fuelLogs: {
          columns: { id: true }
        }
      }
    })

    // Map to include count manually if needed by frontend
    const mappedVehicles = allVehicles.map(v => ({
        ...v,
        _count: {
            fuelLogs: v.fuelLogs.length
        }
    }))

    return NextResponse.json({ data: mappedVehicles })
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, licensePlate, type, capacityKg } = body

    const [vehicle] = await db.insert(vehicles).values({
        name,
        licensePlate,
        type,
        capacityKg: parseFloat(capacityKg),
        status: 'AVAILABLE'
    }).returning()

    await db.insert(activityLogs).values({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'VEHICLE',
        entityId: vehicle.id,
        newValues: JSON.stringify(vehicle),
    })

    return NextResponse.json({ success: true, vehicle })
  } catch (error) {
    console.error('Failed to create vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
