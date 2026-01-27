
import { NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { banners } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    const data = await db.select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(desc(banners.order))
    
    return NextResponse.json({ success: true, banners: data })
  } catch (error) {
    console.error('Failed to fetch banners:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch banners' }, { status: 500 })
  }
}
