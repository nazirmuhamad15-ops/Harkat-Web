import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { like } from 'drizzle-orm'

// POST: Clear all R2 image URLs from categories (fix broken images)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find categories with R2 URLs
    const allCategories = await db.query.categories.findMany()
    
    const r2Categories = allCategories.filter(c => 
      c.image && (
        c.image.includes('r2.dev') || 
        c.image.includes('r2.cloudflarestorage.com')
      )
    )

    // Clear the broken R2 URLs
    for (const cat of r2Categories) {
      await db.update(categories)
        .set({ image: null })
        .where(like(categories.id, cat.id))
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${r2Categories.length} broken image URLs`,
      affected: r2Categories.map(c => c.name)
    })
  } catch (error) {
    console.error('Fix images error:', error)
    return NextResponse.json({ error: 'Failed to fix images' }, { status: 500 })
  }
}
