import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq, or, and, gt, like } from 'drizzle-orm'

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

// POST - Verify OTP and login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp } = body

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Nomor HP dan OTP diperlukan' }, { status: 400 })
    }

    const formattedPhone = formatPhone(phone)

    // Find user with matching OTP
    const user = await db.query.users.findFirst({
      where: and(
        or(
          like(users.phone, `%${formattedPhone.slice(-10)}`),
          eq(users.phone, phone),
          eq(users.phone, `0${formattedPhone.slice(2)}`),
          eq(users.phone, `+${formattedPhone}`),
          eq(users.phone, formattedPhone)
        ),
        eq(users.otpCode, otp),
        gt(users.otpExpiry, new Date()),
        eq(users.isActive, true)
      )
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Kode OTP tidak valid atau sudah expired' 
      }, { status: 400 })
    }

    // Clear OTP
    await db.update(users)
      .set({
        otpCode: null,
        otpExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    // Return user data for NextAuth signIn
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
