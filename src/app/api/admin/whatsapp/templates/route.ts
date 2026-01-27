import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { whatsappTemplates } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { desc, eq } from 'drizzle-orm'

// GET - List all templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await db.query.whatsappTemplates.findMany({
      orderBy: desc(whatsappTemplates.createdAt)
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, title, content, category } = body

    if (!name || !title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const [template] = await db.insert(whatsappTemplates).values({
        name: name.toLowerCase().replace(/\s+/g, '_'),
        title,
        content,
        category,
        isActive: true
    }).returning()

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Failed to create template:', error)
    if (error.message?.includes('unique constraint') || error.code === '23505') {
      return NextResponse.json({ error: 'Template with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

// PATCH - Update template
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, category, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 })
    }

    const [template] = await db.update(whatsappTemplates).set({
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
    })
    .where(eq(whatsappTemplates.id, id))
    .returning()

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Failed to update template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 })
    }

    await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
