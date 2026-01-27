import { NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders as ordersTable, userAddresses } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, or, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email
    const userId = session.user.id

    // 1. Fetch Orders for this customer (simple query to avoid relational errors)
    const orders = await db.select().from(ordersTable).where(
      or(
        email ? eq(ordersTable.customerEmail, email) : undefined,
        eq(ordersTable.userId, userId)
      )
    ).orderBy(desc(ordersTable.createdAt))

    // 2. Calculate Stats
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length
    const toShipOrders = orders.filter(o => o.status === 'PROCESSING' || o.status === 'PAID').length
    
    // 3. Recent 5 orders
    const recentOrders = orders.slice(0, 5)

    // 4. Fetch User Address
    const address = await db.query.userAddresses.findFirst({
        where: eq(userAddresses.userId, userId),
        orderBy: (userAddresses, { desc }) => [desc(userAddresses.isDefault)]
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        toShipOrders
      },
      recentOrders,
      address
    })

  } catch (error) {
    console.error('Customer dashboard error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
