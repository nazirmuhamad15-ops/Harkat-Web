import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/data/dashboard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get range from query params
    const searchParams = request.nextUrl.searchParams
    const range = (searchParams.get('range') || '30d') as any

    const stats = await getDashboardStats(range)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}