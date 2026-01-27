import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { systemSettings } from '@/db/schema'
import { inArray } from 'drizzle-orm'

// GET - Fetch email settings (ADMIN & SUPER_ADMIN can view)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settingsKeys = [
      'require_email_verification',
      'email_provider',
      'smtp_host',
      'smtp_port',
      'smtp_user',
      'smtp_password',
      'smtp_from',
      'email_webhook_url',
      'email_webhook_secret'
    ]

    const settings = await db.query.systemSettings.findMany({
      where: inArray(systemSettings.key, settingsKeys)
    })

    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }

    // Baca juga dari environment sebagai fallback info
    const envProvider = process.env.RESEND_API_KEY ? 'webhook' : 'smtp'
    const envFrom = process.env.EMAIL_FROM || ''

    return NextResponse.json({
      settings: {
        requireVerification: result.require_email_verification === 'true',
        provider: result.email_provider || envProvider,
        smtpHost: result.smtp_host || '',
        smtpPort: result.smtp_port || '587',
        smtpUser: result.smtp_user || '',
        smtpPassword: result.smtp_password || '',
        smtpFrom: result.smtp_from || envFrom,
        webhookUrl: result.email_webhook_url || (process.env.RESEND_API_KEY ? 'https://api.resend.com/emails' : ''),
        webhookSecret: result.email_webhook_secret || ''
      },
      // Indikator apakah menggunakan env fallback
      usingEnvFallback: !result.email_provider && !!process.env.RESEND_API_KEY
    })
  } catch (error) {
    console.error('Email settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Save email settings (SUPER_ADMIN only for security)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Hanya SUPER_ADMIN yang bisa mengubah konfigurasi email (sensitif)
    if (!session?.user?.id || session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Hanya Super Admin yang dapat mengubah konfigurasi email' 
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      requireVerification,
      provider,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFrom,
      webhookUrl,
      webhookSecret
    } = body

    // Validasi minimal
    if (provider === 'smtp') {
      if (!smtpHost || !smtpUser) {
        return NextResponse.json({ 
          error: 'SMTP Host dan Username wajib diisi untuk provider SMTP' 
        }, { status: 400 })
      }
    } else if (provider === 'webhook') {
      if (!webhookUrl) {
        return NextResponse.json({ 
          error: 'Webhook URL wajib diisi untuk provider Webhook' 
        }, { status: 400 })
      }
    }

    const settingsToSave = [
      { key: 'require_email_verification', value: String(requireVerification || false) },
      { key: 'email_provider', value: provider || 'smtp' },
      { key: 'smtp_host', value: smtpHost || '' },
      { key: 'smtp_port', value: smtpPort || '587' },
      { key: 'smtp_user', value: smtpUser || '' },
      { key: 'smtp_password', value: smtpPassword || '' },
      { key: 'smtp_from', value: smtpFrom || '' },
      { key: 'email_webhook_url', value: webhookUrl || '' },
      { key: 'email_webhook_secret', value: webhookSecret || '' }
    ]

    // Gunakan transaction untuk konsistensi
    await db.transaction(async (tx) => {
      for (const setting of settingsToSave) {
        await tx.insert(systemSettings)
          .values({
            key: setting.key,
            value: setting.value,
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: { 
              value: setting.value,
              updatedAt: new Date()
            }
          })
      }
    })

    console.log(`[Email Settings] Updated by ${session.user.email} at ${new Date().toISOString()}`)

    return NextResponse.json({ 
      success: true,
      message: 'Konfigurasi email berhasil disimpan'
    })
  } catch (error) {
    console.error('Email settings save error:', error)
    return NextResponse.json({ 
      error: 'Gagal menyimpan konfigurasi email' 
    }, { status: 500 })
  }
}
