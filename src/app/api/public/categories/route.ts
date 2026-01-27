import { NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { categories } from '@/db/schema'

export async function GET() {
  try {
    const data = await db.select().from(categories)
    
    const formatted = data.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/ /g, '-'), // Simple slug generation
        image: cat.image || '/placeholder.jpg',
        description: cat.description
    }))

    return NextResponse.json({ success: true, categories: formatted })
  } catch (error) {
    console.error('API Categories Error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
