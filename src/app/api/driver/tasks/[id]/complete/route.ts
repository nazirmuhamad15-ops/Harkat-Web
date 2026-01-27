import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { driverTasks, orders } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToR2 } from '@/lib/r2'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session?.user?.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deliveryPhoto, photo, signature, notes, timestamp } = body
    const finalPhoto = deliveryPhoto || photo
    const { id: taskId } = await params

    // Check Task Existence
    const existingTask = await db.query.driverTasks.findFirst({
        where: eq(driverTasks.id, taskId)
    })

    if (!existingTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // SKIP R2 FOR NOW - Save Base64 directly as "Dummy"
    let photoUrl = finalPhoto || null
    let signatureUrl = signature || null

    console.log('[POD] Saving Base64 directly to DB (Dummy mode)')

    const deliveryTime = timestamp ? new Date(timestamp) : new Date()

    // Update Task to DELIVERED
    const [updatedTask] = await db.update(driverTasks)
        .set({
            status: 'DELIVERED',
            deliveryPhotoUrl: photoUrl,
            signatureUrl: signatureUrl,
            deliveryNotes: notes,
            deliveredAt: deliveryTime,
            updatedAt: new Date()
        })
        .where(eq(driverTasks.id, taskId))
        .returning()

    // Update Order to DELIVERED
    await db.update(orders)
        .set({
            status: 'DELIVERED', 
            actualDelivery: deliveryTime,
            updatedAt: new Date()
        })
        .where(eq(orders.id, existingTask.orderId))

    // Send WhatsApp Notification
    try {
        const orderData = await db.query.orders.findFirst({
            where: eq(orders.id, existingTask.orderId),
            columns: {
                orderNumber: true,
                customerName: true,
                customerPhone: true,
                total: true
            }
        })

        if (orderData) {
            const { sendDeliveryConfirmation } = await import('@/lib/whatsapp-notifications')
            await sendDeliveryConfirmation({
                orderNumber: orderData.orderNumber,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                totalAmount: orderData.total
            })
        }
    } catch (e) {
        console.error('Failed to send WhatsApp notification:', e)
        // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, task: updatedTask })
  } catch (error) {
    console.error('Failed to complete delivery:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
