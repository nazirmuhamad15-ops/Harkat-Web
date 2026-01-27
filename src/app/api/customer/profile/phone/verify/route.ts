import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, verificationTokens } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { otp } = await req.json()

    if (!otp) {
        return NextResponse.json({ error: 'Kode OTP diperlukan' }, { status: 400 })
    }

    const identifier = `PHONE:${session.user.id}`

    // Find the token
    const tokens = await db.select()
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, identifier))
    
    // Filter in memory to find the matching OTP prefix and ensure not expired
    const validToken = tokens.find(t => 
        t.token.startsWith(`${otp}:`) && 
        new Date(t.expires) > new Date()
    )

    if (!validToken) {
        return NextResponse.json({ error: 'Kode OTP tidak valid atau kadaluarsa' }, { status: 400 })
    }

    // Extract new phone from token (Format: OTP:PHONE)
    const parts = validToken.token.split(':')
    if (parts.length < 2) {
        return NextResponse.json({ error: 'Data token corrupt' }, { status: 500 })
    }
    const newPhone = parts[1]

    // Update User
    await db.update(users)
        .set({ phone: newPhone, updatedAt: new Date() })
        .where(eq(users.id, session.user.id))

    // Delete the used token
    await db.delete(verificationTokens)
        .where(eq(verificationTokens.identifier, identifier))

    return NextResponse.json({ success: true, message: 'Nomor telepon berhasil diperbarui' })

  } catch (error) {
    console.error('Verify phone OTP error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 })
  }
}
