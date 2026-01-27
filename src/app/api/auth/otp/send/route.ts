import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq, or, like, and } from 'drizzle-orm'

const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://harkat-whatsapp-bot-production.up.railway.app'

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

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST - Send OTP to phone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Nomor HP diperlukan' }, { status: 400 })
    }

    const formattedPhone = formatPhone(phone)

    // Find user by phone
    // Match last 10 digits using LIKE
    const targetUser = await db.query.users.findFirst({
      where: and(
        or(
          like(users.phone, `%${formattedPhone.slice(-10)}`),
          eq(users.phone, phone),
          eq(users.phone, `0${formattedPhone.slice(2)}`),
          eq(users.phone, `+${formattedPhone}`),
          eq(users.phone, formattedPhone)
        ),
        eq(users.isActive, true)
      )
    })

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'Nomor HP tidak terdaftar. Silakan daftar terlebih dahulu.' 
      }, { status: 404 })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save OTP to user
    await db.update(users)
      .set({
        otpCode: otp,
        otpExpiry: otpExpiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, targetUser.id))

    // Send OTP via WhatsApp
    const jid = `${formattedPhone}@s.whatsapp.net`
    const message = `🔐 *Kode OTP Harkat Furniture*\n\nKode verifikasi Anda: *${otp}*\n\nKode ini akan expired dalam 5 menit.\n\n⚠️ Jangan bagikan kode ini kepada siapapun.`

    try {
      const res = await fetch(`${WHATSAPP_BOT_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, message })
      })

      if (!res.ok) {
        console.error('Failed to send WhatsApp OTP')
        return NextResponse.json({ 
          error: 'Gagal mengirim OTP. Pastikan WhatsApp Bot terhubung.' 
        }, { status: 500 })
      }
    } catch (error) {
      console.error('WhatsApp send error:', error)
      return NextResponse.json({ 
        error: 'Gagal mengirim OTP. Coba lagi.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP terkirim ke WhatsApp',
      phone: formattedPhone.slice(-4) // Return last 4 digits for display
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
