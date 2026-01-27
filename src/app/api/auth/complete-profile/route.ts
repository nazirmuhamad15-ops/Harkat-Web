import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, userAddresses } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// Format phone number
function formatPhone(phone: string): string {
  let formatted = phone.replace(/\D/g, '')
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1)
  }
  if (!formatted.startsWith('62')) {
    formatted = '62' + formatted
  }
  return formatted
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, address, province, city, district, postalCode } = body

    if (!phone) {
      return NextResponse.json({ error: 'Nomor HP diperlukan' }, { status: 400 })
    }

    const formattedPhone = formatPhone(phone)

    // Check if phone number is already used by ANOTHER user
    const existingPhoneUser = await db.query.users.findFirst({
      where: and(
        eq(users.phone, formattedPhone),
        ne(users.email, session.user.email) // Not the current user
      )
    })

    if (existingPhoneUser) {
        return NextResponse.json({ error: 'Nomor HP sudah digunakan oleh akun lain' }, { status: 400 })
    }

    // Get Current User ID
    const currentUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email)
    })

    if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update User Profile
    await db.update(users)
      .set({
        name: name || session.user.name,
        phone: formattedPhone,
        updatedAt: new Date()
      })
      .where(eq(users.id, currentUser.id))

    // Save Address if provided
    if (address && province && city && district && postalCode) {
        // Unset other default addresses just in case
        await db.update(userAddresses)
            .set({ isDefault: false })
            .where(eq(userAddresses.userId, currentUser.id))

        await db.insert(userAddresses).values({
            id: createId(),
            userId: currentUser.id,
            label: 'Rumah', // Default label
            recipientName: name || currentUser.name || 'Penerima',
            phone: formattedPhone,
            addressLine: address,
            province,
            city,
            district,
            postalCode,
            isDefault: true // Set as default since it's the first one
        })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile and address updated successfully' 
    })

  } catch (error) {
    console.error('Complete profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
