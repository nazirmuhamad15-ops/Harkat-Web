import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders } from '@/db/schema'
import { eq, or, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const orderId = formData.get('orderId') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const notes = formData.get('notes') as string
    const proof = formData.get('proof') as File | null

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const userEmail = session.user.email || ''

    // Find order by ID or orderNumber, matching by customerEmail
    const order = await db.query.orders.findFirst({
      where: and(
        or(
          eq(orders.id, orderId),
          eq(orders.orderNumber, orderId)
        ),
        eq(orders.customerEmail, userEmail),
        eq(orders.status, 'PENDING')
      )
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    // Handle proof image upload (in a real app, upload to storage)
    let proofUrl = null
    if (proof) {
      console.log('Proof file received:', proof.name, proof.size)
      proofUrl = `/uploads/proofs/${Date.now()}-${proof.name}`
    }

    // Update order - set payment status to CONFIRMING (awaiting admin verification)
    await db.update(orders)
      .set({
        paymentMethod: paymentMethod,
        paymentStatus: 'CONFIRMING',
        notes: notes ? `${order.notes || ''}\n[Payment Note]: ${notes}` : order.notes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))

    return NextResponse.json({ 
      success: true, 
      message: 'Payment confirmation submitted' 
    })
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
