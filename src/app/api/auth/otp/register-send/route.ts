import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq, or, like, and } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://harkat-whatsapp-bot-production.up.railway.app/status'

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

// POST - Register and Send OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone } = body

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Nama, Email, dan Nomor HP diperlukan' }, { status: 400 })
    }

    const formattedPhone = formatPhone(phone)
    const emailLower = email.toLowerCase()

    // Check if phone or email already exists AND is active
    const existingUser = await db.query.users.findFirst({
      where: or(
        // Phone check
        and(
            or(
                like(users.phone, `%${formattedPhone.slice(-10)}`),
                eq(users.phone, phone),
                eq(users.phone, formattedPhone)
            ),
            eq(users.isActive, true)
        ),
        // Email check
        and(
            eq(users.email, emailLower),
            eq(users.isActive, true)
        )
      )
    })

    if (existingUser) {
      if (existingUser.email === emailLower) {
          return NextResponse.json({ error: 'Email sudah terdaftar dan aktif' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Nomor HP sudah terdaftar dan aktif' }, { status: 400 })
    }

    // Check if there is an INACTIVE user with this info (to overwrite/resend)
    // We prioritize finding by Phone to update
    const inactiveUser = await db.query.users.findFirst({
        where: or(
            like(users.phone, `%${formattedPhone.slice(-10)}`),
            eq(users.phone, formattedPhone),
            eq(users.email, emailLower)
        )
    })

    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    if (inactiveUser) {
        // Update existing inactive user
        await db.update(users)
            .set({
                name,
                email: emailLower, // Update email in case they corrected it
                phone: formattedPhone, // Standardize phone
                otpCode: otp,
                otpExpiry: otpExpiry,
                updatedAt: new Date()
            })
            .where(eq(users.id, inactiveUser.id))
    } else {
        // Create new inactive user
        await db.insert(users).values({
            id: createId(),
            name,
            email: emailLower,
            phone: formattedPhone,
            role: 'CUSTOMER',
            isActive: false, // Inactive until OTP verified
            emailVerified: false,
            otpCode: otp,
            otpExpiry: otpExpiry
        })
    }

    // Send OTP via WhatsApp
    const jid = `${formattedPhone}@s.whatsapp.net`
    const message = `🔐 *Kode OTP Registrasi Harkat Furniture*\n\nHalo ${name},\nKode verifikasi pendaftaran Anda: *${otp}*\n\nKode ini akan expired dalam 5 menit.\n\n⚠️ Jangan bagikan kode ini kepada siapapun.`

    try {
      const res = await fetch(`${WHATSAPP_BOT_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, message })
      })

      if (!res.ok) {
        console.error('Failed to send WhatsApp OTP')
        // We still return success but maybe warn? Or fail?
        // If we fail here, user exists but didn't get OTP. They can retry.
        return NextResponse.json({ 
          error: 'Gagal mengirim OTP ke WhatsApp. Pastikan nomor benar.' 
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
      message: 'OTP registrasi terkirim ke WhatsApp',
      phone: formattedPhone
    })

  } catch (error) {
    console.error('Register OTP error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
