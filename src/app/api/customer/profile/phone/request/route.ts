import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verificationTokens } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newPhone } = await req.json()

    if (!newPhone) {
        return NextResponse.json({ error: 'Nomor telepon baru diperlukan' }, { status: 400 })
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    // Expires in 5 minutes
    const expires = new Date(Date.now() + 5 * 60 * 1000)
    
    const identifier = `PHONE:${session.user.id}`
    // Store OTP and New Phone in the token field, separated by colon
    const token = `${otp}:${newPhone}` // Format: OTP:PHONE

    // 1. Remove any existing phone verification tokens for this user
    await db.delete(verificationTokens)
        .where(eq(verificationTokens.identifier, identifier))

    // 2. Insert new token
    await db.insert(verificationTokens).values({
        identifier,
        token,
        expires
    })

    // 3. Send Email
    // Simple HTML template for OTP
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Verifikasi Perubahan Nomor Telepon</h2>
        <p>Anda telah meminta untuk mengubah nomor telepon di akun Harkat Furniture Anda.</p>
        <p>Gunakan kode OTP berikut untuk melanjutkan:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; background: #f0f0f0; padding: 10px; display: inline-block;">${otp}</h1>
        <p>Kode ini berlaku selama 5 menit.</p>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">Jika Anda tidak meminta perubahan ini, abaikan email ini.</p>
      </div>
    `

    const sent = await sendEmail({
        to: session.user.email,
        subject: 'Harkat Furniture - Kode OTP Perubahan Nomor',
        html,
        text: `Kode OTP Anda: ${otp}`
    })

    if (!sent) {
        return NextResponse.json({ error: 'Gagal mengirim email OTP' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'OTP dikirim ke email Anda' })

  } catch (error) {
    console.error('Request phone OTP error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 })
  }
}
