import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Create rate limiter for auth endpoints
// Stricter limit: 5 login attempts per minute per IP
const authLimiter = rateLimit({ interval: 60 * 1000 })

const handler = NextAuth(authOptions)

// Wrap handler with rate limiting
async function rateLimitedHandler(req: NextRequest, context: any) {
  // Only rate limit POST requests (actual login attempts)
  if (req.method === 'POST') {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    
    const allowed = await authLimiter.check(5, ip) // 5 attempts per minute
    
    if (!allowed) {
      console.warn(`[Auth Rate Limit] Blocked login attempt from IP: ${ip}`)
      return NextResponse.json(
        { 
          error: 'Too many login attempts',
          message: 'Please wait a minute before trying again.'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      )
    }
  }
  
  // Call original NextAuth handler
  return handler(req, context)
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }