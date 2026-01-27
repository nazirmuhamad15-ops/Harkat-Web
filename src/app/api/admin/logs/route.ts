import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { activityLogs, users } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and, gt, desc, count, SQL } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const actionFilter = searchParams.get('action') || 'all'
    const entityFilter = searchParams.get('entity') || 'all'
    const dateFilter = searchParams.get('date') || '7days'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build conditions
    const conditions: SQL[] = []
    
    if (actionFilter !== 'all') {
      conditions.push(eq(activityLogs.action, actionFilter))
    }
    
    if (entityFilter !== 'all') {
      conditions.push(eq(activityLogs.entityType, entityFilter))
    }
    
    const now = new Date()
    if (dateFilter !== 'all') {
      let filterDate = new Date()
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case '7days':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30days':
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90days':
          filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
      }
      conditions.push(gt(activityLogs.createdAt, filterDate))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count for pagination
    const [{ value: totalCount }] = await db.select({ value: count() })
        .from(activityLogs)
        .where(whereClause)

    const logs = await db.query.activityLogs.findMany({
      where: whereClause,
      orderBy: [desc(activityLogs.createdAt)],
      limit: limit,
      offset: offset,
      with: {
        user: {
          columns: {
            name: true,
            email: true
          }
        }
      }
    })

    // Format logs for frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'Unknown',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt
    }))

    return NextResponse.json({ 
        logs: formattedLogs,
        pagination: {
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
            current: page,
            limit: limit
        }
    })
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}