import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orders } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const ordersData = await db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      with: {
        items: {
          with: {
            productVariant: {
              with: {
                product: true // Fetch simplified fields
              }
            }
          }
        }
      }
    })

    // Map to frontend structure
    const formattedOrders = ordersData.map(order => ({
      ...order,
      items: order.items.map(item => ({
        id: item.id,
        productName: item.productVariant?.product?.name || 'Unknown',
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.total
      }))
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}