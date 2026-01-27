import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, systemSettings } from '@/db/schema'
import bcrypt from 'bcryptjs'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Check if email verification is required
    const emailVerificationSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'require_email_verification')
    })
    
    // Default to true if RESEND_API_KEY exists and setting not configured
    let requireVerification = false
    if (emailVerificationSetting) {
      requireVerification = emailVerificationSetting.value === 'true'
    } else if (process.env.RESEND_API_KEY) {
      // Auto-enable if Resend is configured
      requireVerification = true
    }

    // Create user with CUSTOMER role
    const [user] = await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || null,
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: !requireVerification, // Auto-verify if verification not required
      verificationToken: requireVerification ? verificationToken : null,
      tokenExpiry: requireVerification ? tokenExpiry : null
    }).returning()

    // Send verification email if required
    if (requireVerification) {
      const emailSent = await sendVerificationEmail(email, name, verificationToken)
      
      if (!emailSent) {
        console.error('Failed to send verification email')
      }

      return NextResponse.json({
        success: true,
        message: 'Account created. Please check your email to verify.',
        requireVerification: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      requireVerification: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
