// Email Service using Nodemailer or webhook
import { db } from './db'

interface EmailConfig {
  provider: 'smtp' | 'webhook'
  // SMTP Config
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  smtpFrom?: string
  // Webhook Config
  webhookUrl?: string
  webhookSecret?: string
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

// Get email config from database settings or env
async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const settings = await db.systemSetting.findMany({
      where: {
        key: {
          in: [
            'email_provider',
            'smtp_host',
            'smtp_port',
            'smtp_user',
            'smtp_password',
            'smtp_from',
            'email_webhook_url',
            'email_webhook_secret'
          ]
        }
      }
    })

    const config: EmailConfig = {
      provider: 'smtp'
    }

    for (const setting of settings) {
      switch (setting.key) {
        case 'email_provider':
          config.provider = setting.value as 'smtp' | 'webhook'
          break
        case 'smtp_host':
          config.smtpHost = setting.value
          break
        case 'smtp_port':
          config.smtpPort = parseInt(setting.value) || 587
          break
        case 'smtp_user':
          config.smtpUser = setting.value
          break
        case 'smtp_password':
          config.smtpPassword = setting.value
          break
        case 'smtp_from':
          config.smtpFrom = setting.value
          break
        case 'email_webhook_url':
          config.webhookUrl = setting.value
          break
        case 'email_webhook_secret':
          config.webhookSecret = setting.value
          break
      }
    }

    // Fallback to env variables if Resend API key exists
    if (process.env.RESEND_API_KEY && !config.webhookSecret) {
      config.provider = 'webhook'
      config.webhookUrl = 'https://api.resend.com/emails'
      config.webhookSecret = process.env.RESEND_API_KEY
      config.smtpFrom = process.env.EMAIL_FROM || 'admin@harkatfurniture.web.id'
    }

    return config
  } catch (error) {
    console.error('Failed to get email config:', error)
    
    // Fallback to env only
    if (process.env.RESEND_API_KEY) {
      return {
        provider: 'webhook',
        webhookUrl: 'https://api.resend.com/emails',
        webhookSecret: process.env.RESEND_API_KEY,
        smtpFrom: process.env.EMAIL_FROM || 'admin@harkatfurniture.web.id'
      }
    }
    
    return null
  }
}

// Send email via SMTP
async function sendViaSMTP(config: EmailConfig, params: SendEmailParams): Promise<boolean> {
  try {
    // Dynamic import nodemailer
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    })

    await transporter.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    return true
  } catch (error) {
    console.error('SMTP send failed:', error)
    return false
  }
}

// Send email via webhook (Resend, SendGrid, etc.)
async function sendViaWebhook(config: EmailConfig, params: SendEmailParams): Promise<boolean> {
  try {
    if (!config.webhookUrl) {
      console.error('Webhook URL not configured')
      return false
    }

    // Detect provider and format accordingly
    const isResend = config.webhookUrl.includes('resend.com')
    const isSendGrid = config.webhookUrl.includes('sendgrid.com')

    let body: Record<string, unknown>
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (isResend) {
      // Resend API format
      headers['Authorization'] = `Bearer ${config.webhookSecret}`
      body = {
        from: config.smtpFrom || 'admin@harkatfurniture.web.id',
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }
    } else if (isSendGrid) {
      // SendGrid API format
      headers['Authorization'] = `Bearer ${config.webhookSecret}`
      body = {
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: config.smtpFrom || 'noreply@example.com' },
        subject: params.subject,
        content: [
          { type: 'text/plain', value: params.text || params.subject },
          { type: 'text/html', value: params.html }
        ]
      }
    } else {
      // Generic webhook format
      if (config.webhookSecret) {
        headers['Authorization'] = `Bearer ${config.webhookSecret}`
      }
      body = {
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        from: config.smtpFrom || 'noreply@harkatfurniture.com'
      }
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Webhook error response:', errorData)
      return false
    }

    return true
  } catch (error) {
    console.error('Webhook send failed:', error)
    return false
  }
}

// Main send email function
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const config = await getEmailConfig()
  
  if (!config) {
    console.error('Email not configured')
    return false
  }

  if (config.provider === 'webhook') {
    return sendViaWebhook(config, params)
  }
  
  return sendViaSMTP(config, params)
}

// Generate verification token
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Send verification email
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a1a; margin-bottom: 20px;">Selamat Datang di Harkat Furniture! 🎉</h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Halo ${name},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Terima kasih telah mendaftar di Harkat Furniture. Silakan klik tombol di bawah untuk memverifikasi email Anda:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #1a1a1a; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verifikasi Email
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px;">
          Atau copy link berikut:<br>
          <a href="${verifyUrl}" style="color: #666; word-break: break-all;">${verifyUrl}</a>
        </p>
        
        <p style="color: #999; font-size: 14px;">
          Link ini akan expired dalam 24 jam.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Harkat Furniture. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Verifikasi Email - Harkat Furniture',
    html,
    text: `Halo ${name}, Klik link berikut untuk verifikasi email: ${verifyUrl}`
  })
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a1a; margin-bottom: 20px;">Reset Password 🔐</h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Halo ${name},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Kami menerima permintaan untuk reset password akun Anda di Harkat Furniture. Klik tombol di bawah untuk membuat password baru:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px;">
          Atau copy link berikut:<br>
          <a href="${resetUrl}" style="color: #666; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="color: #999; font-size: 14px;">
          Link ini akan expired dalam <strong>1 jam</strong>.
        </p>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            ⚠️ <strong>Jika Anda tidak meminta reset password</strong>, abaikan email ini. Akun Anda tetap aman.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Harkat Furniture. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Reset Password - Harkat Furniture',
    html,
    text: `Halo ${name}, Klik link berikut untuk reset password: ${resetUrl}. Link akan expired dalam 1 jam.`
  })
}
