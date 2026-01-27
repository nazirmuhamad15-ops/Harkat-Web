import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, users } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { broadcastMessage } from '@/lib/whatsapp-notifications'
import { sql, isNotNull, ne } from 'drizzle-orm'

// POST - Broadcast message to customers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, filter } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get customer phone numbers based on filter
    let phones: string[] = []
    
    if (filter === 'with_orders') {
      const result = await db.select({ 
        customerPhone: orders.customerPhone 
      })
      .from(orders)
      .where(ne(orders.customerPhone, ''))
      .groupBy(orders.customerPhone)

      phones = result.map(o => o.customerPhone)
    } else if (filter === 'all_users') {
      const result = await db.select({ 
        phone: users.phone 
      })
      .from(users)
      .where(isNotNull(users.phone))

      phones = result.map(u => u.phone).filter(Boolean) as string[]
    } else if (filter === 'custom' && body.phones) {
      phones = body.phones.filter((p: string) => p && p.length > 0)
    }

    if (phones.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    const result = await broadcastMessage(phones, message)
      
    return NextResponse.json({
        success: true,
        sent: result.success,
        failed: result.failed,
        total: phones.length
    })

  } catch (error) {
    console.error('Broadcast failed:', error)
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 })
  }
}

// GET - Get list of customers for broadcast preview
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ordersWithPhones = await db.select({ 
        customerPhone: orders.customerPhone, 
        customerName: orders.customerName 
    })
    .from(orders)
    .where(ne(orders.customerPhone, ''))
    .groupBy(orders.customerPhone, orders.customerName)

    const usersWithPhonesArr = await db.select({ 
        phone: users.phone, 
        name: users.name 
    })
    .from(users)
    .where(isNotNull(users.phone))

    return NextResponse.json({
      orderCustomers: ordersWithPhones.length,
      registeredUsers: usersWithPhonesArr.length,
      customers: ordersWithPhones.map(o => ({ phone: o.customerPhone, name: o.customerName })),
      users: usersWithPhonesArr.map(u => ({ phone: u.phone, name: u.name }))
    })
  } catch (error) {
    console.error('Failed to get broadcast list:', error)
    return NextResponse.json({ error: 'Failed to get list' }, { status: 500 })
  }
}
