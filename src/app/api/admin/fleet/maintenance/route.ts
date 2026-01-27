import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { maintenanceLogs, vehicles, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allLogs = await db.query.maintenanceLogs.findMany({
      orderBy: desc(maintenanceLogs.serviceDate),
      with: {
        vehicle: {
            columns: { name: true, licensePlate: true }
        }
      }
    })

    return NextResponse.json({ data: allLogs })
  } catch (error) {
    console.error('Failed to fetch maintenance logs:', error)
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
    const { vehicleId, description, cost, odometer, serviceDate, garageName } = body

    return await db.transaction(async (tx) => {
        const [log] = await tx.insert(maintenanceLogs).values({
            vehicleId,
            description,
            cost: parseFloat(cost),
            odometer: parseInt(odometer),
            serviceDate: new Date(serviceDate),
            garageName
        }).returning()

        // Update Vehicle Last Service
        await tx.update(vehicles)
            .set({ 
                lastService: new Date(serviceDate),
                status: 'AVAILABLE'
            })
            .where(eq(vehicles.id, vehicleId))

        await tx.insert(activityLogs).values({
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'MAINTENANCE_LOG',
            entityId: log.id,
            newValues: JSON.stringify(log),
        })

        return NextResponse.json({ success: true, log })
    })
  } catch (error) {
    console.error('Failed to create maintenance log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
