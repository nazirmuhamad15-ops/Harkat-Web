import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verify?error=missing_token', request.url))
    }

    // Find user with this token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.verificationToken, token),
        gt(users.tokenExpiry, new Date())
      )
    })

    if (!user) {
      return NextResponse.redirect(new URL('/auth/verify?error=invalid_token', request.url))
    }

    // Update user as verified
    await db.update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        tokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return NextResponse.redirect(new URL('/auth/verify?success=true', request.url))
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/auth/verify?error=server_error', request.url))
  }
}
