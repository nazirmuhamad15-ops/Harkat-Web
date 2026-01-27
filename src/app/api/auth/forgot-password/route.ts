import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateVerificationToken } from '@/lib/email'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail)
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        message: 'If the email exists, a reset link has been sent.' 
      })
    }

    // Generate reset token
    const resetToken = generateVerificationToken()
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to user
    await db.update(users)
      .set({
        verificationToken: resetToken,
        tokenExpiry: tokenExpiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    // Send reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.name || 'User',
      resetToken
    )

    if (!emailSent) {
      console.error('Failed to send password reset email')
      return NextResponse.json({ 
        error: 'Gagal mengirim email. Coba lagi nanti.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reset link sent to email' 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
