import { NextRequest, NextResponse } from 'next/server'
import { getFinancialStats } from '@/lib/data/financial'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params (period: 'week' | 'month' | 'year')
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'month') as any
    
    const stats = await getFinancialStats(period)

    return NextResponse.json({
        data: stats
    })

  } catch (error) {
    console.error('Failed to fetch financial data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
