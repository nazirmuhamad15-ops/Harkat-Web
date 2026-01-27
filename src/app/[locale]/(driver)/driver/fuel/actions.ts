'use server'

import { db } from '@/lib/db'
import { fuelLogs, vehicles, orders, driverTasks } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { eq, desc, and, inArray, gte, lte } from 'drizzle-orm'

export async function submitFuelLog(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const vehicleId = formData.get('vehicleId') as string
  const liters = parseFloat(formData.get('liters') as string)
  const cost = parseFloat(formData.get('cost') as string)
  const odometer = parseInt(formData.get('odometer') as string)
  const notes = formData.get('notes') as string
  const receiptUrl = formData.get('receiptUrl') as string
  const orderId = formData.get('orderId') as string // Optional

  if (!vehicleId || !liters || !cost || !odometer) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    await db.insert(fuelLogs).values({
      driverId: session.user.id,
      vehicleId,
      liters,
      cost,
      odometer,
      notes,
      receiptUrl: receiptUrl || null,
      orderId: (orderId && orderId !== 'none') ? orderId : null
    })

    revalidatePath('/driver/fuel')
    return { success: true }
  } catch (error) {
    console.error('Failed to submit fuel log:', error)
    return { success: false, error: 'Database error' }
  }
}

export async function getFuelData(dateRange?: { from: Date; to: Date }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  try {
    const fuelLogsWhere = and(
      eq(fuelLogs.driverId, session.user.id),
      dateRange ? (
        dateRange.to ? 
          and(
            gte(fuelLogs.createdAt, dateRange.from), 
            lte(fuelLogs.createdAt, dateRange.to)
          ) :
          gte(fuelLogs.createdAt, dateRange.from)
      ) : undefined
    )

    const [vehiclesData, activeOrders, recentLogs] = await Promise.all([
      db.select().from(vehicles).where(eq(vehicles.status, 'AVAILABLE')),
      db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName
      })
      .from(orders)
      .innerJoin(driverTasks, eq(orders.id, driverTasks.orderId))
      .where(and(
        eq(driverTasks.driverId, session.user.id),
        inArray(driverTasks.status, ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'])
      )),
      db.query.fuelLogs.findMany({
        where: fuelLogsWhere,
        orderBy: [desc(fuelLogs.createdAt)],
        limit: dateRange ? 100 : 5, // Show more if filtering
        with: {
          vehicle: true
        }
      })
    ])

    return { 
      vehicles: vehiclesData, 
      activeOrders, 
      recentLogs 
    }
  } catch (error) {
    console.error('getFuelData error:', error)
    return null
  }
}
