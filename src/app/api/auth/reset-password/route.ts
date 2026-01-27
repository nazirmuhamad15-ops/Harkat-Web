import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// GET - Verify reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false })
    }

    const user = await db.query.users.findFirst({
      where: and(
        eq(users.verificationToken, token),
        gt(users.tokenExpiry, new Date())
      )
    })

    return NextResponse.json({ valid: !!user })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ valid: false })
  }
}

// POST - Reset password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    // Find user with valid token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.verificationToken, token),
        gt(users.tokenExpiry, new Date())
      )
    })

    if (!user) {
      return NextResponse.json({ error: 'Link tidak valid atau sudah expired' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear token
    await db.update(users)
      .set({
        password: hashedPassword,
        verificationToken: null,
        tokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
