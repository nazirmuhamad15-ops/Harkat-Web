import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { orders } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, or, desc, and } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('[DEBUG] Session:', JSON.stringify(session, null, 2))
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        session: session,
        hasUser: !!session?.user,
        hasId: !!session?.user?.id
      }, { status: 401 })
    }

    const userId = session.user.id
    const email = session.user.email

    console.log('[DEBUG] Querying orders for:', { userId, email })

    // Get ALL orders first (simple query)
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10)

    console.log('[DEBUG] Total orders in DB:', allOrders.length)
    console.log('[DEBUG] Sample orders:', allOrders.slice(0, 3).map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      customerEmail: o.customerEmail
    })))

    // Get user-specific orders
    const customerOrders = await db.select().from(orders).where(
      or(
        eq(orders.userId, userId),
        email ? eq(orders.customerEmail, email) : undefined
      )
    ).orderBy(desc(orders.createdAt))

    console.log('[DEBUG] User orders found:', customerOrders.length)

    return NextResponse.json({ 
      success: true, 
      debug: {
        session: {
          userId,
          email,
          hasSession: !!session
        },
        totalOrders: allOrders.length,
        userOrders: customerOrders.length,
        sampleOrders: allOrders.slice(0, 5).map(o => ({
          orderNumber: o.orderNumber,
          userId: o.userId,
          customerEmail: o.customerEmail,
          matchesUserId: o.userId === userId,
          matchesEmail: o.customerEmail === email
        }))
      },
      orders: customerOrders 
    })

  } catch (error) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
