import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateCsrfToken } from '@/lib/csrf'

/**
 * GET /api/csrf-token
 * Returns a CSRF token for the current session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Generate or retrieve existing CSRF token
    const csrfToken = getOrCreateCsrfToken(session.user.id)
    
    return NextResponse.json({
      csrfToken,
      expiresIn: 3600 // 1 hour in seconds
    })
  } catch (error) {
    console.error('[CSRF Token API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
