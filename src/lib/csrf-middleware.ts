import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { validateCsrfToken } from './csrf'

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing HTTP methods
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method
  
  // Only check CSRF for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null // Allow GET, HEAD, OPTIONS
  }
  
  // Skip CSRF check for public endpoints that don't require auth
  const pathname = request.nextUrl.pathname
  const publicExemptions = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/callback',
    '/api/webhooks',
  ]
  
  if (publicExemptions.some(path => pathname.startsWith(path))) {
    return null // Skip CSRF for these endpoints
  }
  
  // Get session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  if (!token?.sub) {
    // No session = no CSRF check needed (will fail auth check anyway)
    return null
  }
  
  // Get CSRF token from header
  const csrfToken = request.headers.get('x-csrf-token')
  
  // Validate CSRF token
  if (!validateCsrfToken(token.sub, csrfToken)) {
    return NextResponse.json(
      { 
        error: 'Invalid CSRF token',
        message: 'CSRF token is missing or invalid. Please refresh the page and try again.'
      },
      { status: 403 }
    )
  }
  
  return null // CSRF check passed
}

/**
 * Origin Header Validation (Additional CSRF protection layer)
 * Validates that requests come from allowed origins
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const method = request.method
  
  // Only check origin for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null
  }
  
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // Allow requests without origin header (same-origin requests from older browsers)
  if (!origin) {
    return null
  }
  
  // Define allowed origins
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`, // Allow HTTP in development
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean)
  
  // Check if origin is allowed
  if (!allowedOrigins.includes(origin)) {
    console.warn(`[CSRF] Blocked request from unauthorized origin: ${origin}`)
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message: 'Request origin is not allowed.'
      },
      { status: 403 }
    )
  }
  
  return null // Origin check passed
}
