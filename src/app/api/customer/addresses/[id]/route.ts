import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userAddresses } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await db.delete(userAddresses)
      .where(and(
        eq(userAddresses.id, id),
        eq(userAddresses.userId, session.user.id)
      ))
      .returning()

    if (result.length === 0) {
       return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete address error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { label, recipientName, phone, addressLine, province, city, district, postalCode, isDefault } = body

    // Validation (Basic)
    if (!label || !recipientName || !phone || !addressLine || !province || !city || !district || !postalCode) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, session.user.id))
    }

    const [updatedAddress] = await db.update(userAddresses)
      .set({
        label,
        recipientName,
        phone,
        addressLine,
        province,
        city,
        district,
        postalCode,
        isDefault: !!isDefault,
        updatedAt: new Date()
      })
      .where(and(
        eq(userAddresses.id, id),
        eq(userAddresses.userId, session.user.id)
      ))
      .returning()

    if (!updatedAddress) {
       return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, address: updatedAddress })

  } catch (error) {
    console.error('Update address error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
