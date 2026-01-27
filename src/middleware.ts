import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { csrfProtection, validateOrigin } from '@/lib/csrf-middleware'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 0. Exclude API and static files from Auth Check (intlMiddleware is blocked by matcher config usually, but good to be safe)
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
      return NextResponse.next()
  }

  // 1. CSRF Protection for state-changing requests
  const csrfCheck = await csrfProtection(req)
  if (csrfCheck) return csrfCheck
  
  // 1.1. Origin validation for additional CSRF protection
  const originCheck = validateOrigin(req)
  if (originCheck) return originCheck
  
  // Debug for Vercel Login Issue
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
      console.log(`[Middleware Debug] Path: ${pathname}, HasToken: ${!!token}, Role: ${token?.role}, SecretSet: ${!!process.env.NEXTAUTH_SECRET}`)
  }
  
  // Clean path (remove /en or /id prefix to check roles)
  // Logic: if path is /en/admin, we want to check permissions for /admin
  const localePattern = /^\/(en|id)(\/|$)/
  const cleanPath = pathname.replace(localePattern, '/')

  // 2. Handling Auth Pages (Login/Register)
  if (token && cleanPath.startsWith('/auth') && !cleanPath.includes('/complete-profile') && !cleanPath.includes('/signout')) {
    if (token.role === 'DRIVER') {
      return NextResponse.redirect(new URL('/driver', req.url))
    }
    if (token.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/customer', req.url))
    }
    // Default: Admin/Super Admin
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // 3. Protecting Private Routes
  if (!token) {
    if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/driver') || cleanPath.startsWith('/customer')) {
      const signInUrl = new URL('/auth/signin', req.url)
      // Pass the ORIGINAL path (with locale) as callback? Or clean?
      // Better to pass original full path so they return to the right language.
      signInUrl.searchParams.set('callbackUrl', pathname) 
      return NextResponse.redirect(signInUrl)
    }
  }

  // 4. Role-Based Access Control (RBAC)
  if (token) {
      // Driver trying to access Admin
      if (cleanPath.startsWith('/admin') && token.role === 'DRIVER') {
          return NextResponse.redirect(new URL('/driver', req.url))
      }
      // Customer trying to access Admin
      if (cleanPath.startsWith('/admin') && token.role === 'CUSTOMER') {
          return NextResponse.redirect(new URL('/customer', req.url))
      }
      
      // SECURITY: Block ADMIN (Staff) from Finance Dashboard
      if (cleanPath.startsWith('/admin/sales/dashboard') && token.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      
      // SECURITY: Block ADMIN (Staff) from System Settings
      if (cleanPath.startsWith('/admin/system/settings') && token.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      
      // SECURITY: Block ADMIN (Staff) from entire System menu (Users, Fleet, etc.)
      if (cleanPath.startsWith('/admin/system') && token.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      
      if (cleanPath.startsWith('/driver') && token.role !== 'DRIVER' && token.role !== 'SUPER_ADMIN') {
           return NextResponse.redirect(new URL('/admin', req.url))
      }
      
      if (cleanPath.startsWith('/customer') && token.role !== 'CUSTOMER') {
          if (token.role === 'DRIVER') return NextResponse.redirect(new URL('/driver', req.url))
          return NextResponse.redirect(new URL('/admin', req.url))
      }
  }

  // 5. Force Profile Completion (Phone Number)
  if (token) {
    const hasPhone = !!token.phone
    const isCompleteProfilePage = cleanPath === '/auth/complete-profile'
    
    // If missing phone, redirect to complete-profile (unless already there or signing out)
    if (!hasPhone && !isCompleteProfilePage && !cleanPath.includes('/signout')) {
        return NextResponse.redirect(new URL('/auth/complete-profile', req.url))
    }

    // If has phone, block access to complete-profile (redirect to dashboard)
    if (hasPhone && isCompleteProfilePage) {
        if (token.role === 'DRIVER') return NextResponse.redirect(new URL('/driver', req.url))
        if (token.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url))
        return NextResponse.redirect(new URL('/customer', req.url))
    }
  }

  // Final Step: Handover to Next-Intl
  return intlMiddleware(req)
}

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|static|favicon.ico|_vercel|.*\\..*).*)']
}
