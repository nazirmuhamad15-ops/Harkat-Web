import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db-drizzle'
import { users, systemSettings } from '@/db/schema'
import { eq, and, gt, or, like } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { CustomDrizzleAdapter } from '@/lib/auth-adapter'

export const authOptions: NextAuthOptions = {
  adapter: CustomDrizzleAdapter(),
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true, // Allow linking to existing accounts
    }),
    // Email/Password Provider
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize called with:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email)
        })

        console.log('👤 User found:', !!user, user?.email, user?.isActive)

        if (!user || !user.isActive) {
          console.log('❌ User not found or inactive')
          return null
        }

        // Check email verification if required (skip for admin roles)
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
        if (!user.emailVerified && !isAdmin && process.env.RESEND_API_KEY) {
          const setting = await db.query.systemSettings.findFirst({
            where: eq(systemSettings.key, 'require_email_verification')
          })
          if (setting?.value === 'true') {
            console.log('❌ Email not verified')
            throw new Error('Email belum diverifikasi')
          }
        }

        // Check if user has password (OAuth users might not have one)
        if (!user.password) {
          console.log('❌ User has no password (OAuth user?)')
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log('🔑 Password validation:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('❌ Invalid password')
          return null
        }

        console.log('✅ Login successful for:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as any,
          phone: user.phone,
        }
      }
    }),
    // Phone OTP Provider
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize(credentials) {
        console.log('📱 Phone OTP authorize called')
        
        if (!credentials?.phone || !credentials?.otp) {
          console.log('❌ Missing phone or OTP')
          return null
        }

        // Format phone
        let phone = credentials.phone.replace(/\D/g, '')
        if (phone.startsWith('0')) {
          phone = '62' + phone.slice(1)
        }
        if (!phone.startsWith('62')) {
          phone = '62' + phone
        }

        // Find user with matching OTP
        // Drizzle OR implementation for phone fuzzy match
        const user = await db.query.users.findFirst({
            where: and(
                or(
                    like(users.phone, `%${phone.slice(-10)}`), // Contains last 10 digits
                    eq(users.phone, credentials.phone),
                    eq(users.phone, `0${phone.slice(2)}`),
                    eq(users.phone, `+${phone}`),
                    eq(users.phone, phone)
                ),
                eq(users.otpCode, credentials.otp),
                gt(users.otpExpiry, new Date())
                // eq(users.isActive, true) // Allow inactive users to verify (registration flow)
            )
        })

        if (!user) {
          console.log('❌ Invalid OTP or user not found')
          return null
        }

        // Clear OTP and Activate user after verification
        await db.update(users)
            .set({ 
              otpCode: null, 
              otpExpiry: null,
              isActive: true, // Activate user upon successful OTP verification
              emailVerified: true // Also verify email since we tied it to this phone verification (optional but good UX)
            })
            .where(eq(users.id, user.id));

        console.log('✅ Phone OTP login successful for:', user.phone)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as any,
          phone: user.phone,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.phone = user.phone
      }

      if (trigger === 'update' && session?.phone) {
          token.phone = session.phone
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.phone = token.phone as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
}