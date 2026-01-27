
import { NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { banners } from '@/db/schema'
import { desc, asc } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await db.select()
      .from(banners)
      .orderBy(asc(banners.order), desc(banners.createdAt))
    
    return NextResponse.json({ success: true, banners: data })
  } catch (error) {
    console.error('Failed to fetch admin banners:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, image, description, link, ctaText, order, isActive, bgColor } = body

    if (!title || !image) {
       return NextResponse.json({ error: 'Title and Image are required' }, { status: 400 })
    }

    await db.insert(banners).values({
        title,
        image,
        description,
        link,
        ctaText,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        bgColor: bgColor || 'bg-gray-100'
    })

    return NextResponse.json({ success: true, message: 'Banner created' })
  } catch (error) {
    console.error('Failed to create banner:', error)
    return NextResponse.json({ success: false, error: 'Failed to create banner' }, { status: 500 })
  }
}
