import { NextRequest, NextResponse } from 'next/server'
import { AuditLogger } from '@/lib/audit-logger'
import { ActivityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ipAddress, userAgent } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Log the activity
    await AuditLogger.log({
      userId,
      action: action as ActivityType,
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully',
    })

  } catch (error) {
    console.error('Activity logging error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}