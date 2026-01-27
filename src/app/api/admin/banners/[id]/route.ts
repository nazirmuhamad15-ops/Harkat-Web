
import { NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { banners } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, image, description, link, ctaText, order, isActive, bgColor } = body

    await db.update(banners)
        .set({
            title,
            image,
            description,
            link,
            ctaText,
            order,
            isActive,
            bgColor,
            updatedAt: new Date()
        })
        .where(eq(banners.id, id))

    return NextResponse.json({ success: true, message: 'Banner updated' })
  } catch (error) {
    console.error('Failed to update banner:', error)
    return NextResponse.json({ success: false, error: 'Failed to update banner' }, { status: 500 })
  }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { id } = await params
      await db.delete(banners).where(eq(banners.id, id))
  
      return NextResponse.json({ success: true, message: 'Banner deleted' })
    } catch (error) {
      console.error('Failed to delete banner:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete banner' }, { status: 500 })
    }
}
