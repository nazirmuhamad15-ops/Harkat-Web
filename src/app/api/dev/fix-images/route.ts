import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET: Clear all R2 image URLs from categories (fix broken images)
// This is a dev-only endpoint - remove in production
export async function GET(req: NextRequest) {
  try {
    // Find categories with R2 URLs
    const allCategories = await db.query.categories.findMany()
    
    const r2Categories = allCategories.filter(c => 
      c.image && (
        c.image.includes('r2.dev') || 
        c.image.includes('r2.cloudflarestorage.com') ||
        c.image.includes('harkatfurniture.web.id')
      )
    )

    // Clear the broken R2 URLs
    for (const cat of r2Categories) {
      await db.update(categories)
        .set({ image: null })
        .where(eq(categories.id, cat.id))
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${r2Categories.length} broken image URLs`,
      affected: r2Categories.map(c => ({ name: c.name, oldImage: c.image }))
    })
  } catch (error) {
    console.error('Fix images error:', error)
    return NextResponse.json({ error: 'Failed to fix images' }, { status: 500 })
  }
}
