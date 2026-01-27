import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: desc(categories.createdAt)
    })
    return NextResponse.json({ data: allCategories })
  } catch (error) {
    console.error('Fetch Categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, image } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const [newCategory] = await db.insert(categories).values({
      name,
      description: description || null,
      image: image || null
    }).returning()

    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'CATEGORY',
      entityId: newCategory.id,
      newValues: JSON.stringify(newCategory)
    })

    return NextResponse.json({ data: newCategory })
  } catch (error) {
    console.error('Create Category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, description, image } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    // Get old values for logging
    const oldCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id)
    })

    const [updatedCategory] = await db.update(categories)
      .set({
        name,
        description: description || null,
        image: image || null,
        updatedAt: new Date()
      })
      .where(eq(categories.id, id))
      .returning()

    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'CATEGORY',
      entityId: id,
      oldValues: JSON.stringify(oldCategory),
      newValues: JSON.stringify(updatedCategory)
    })

    return NextResponse.json({ data: updatedCategory })
  } catch (error) {
    console.error('Update Category error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Get category before delete for logging
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id)
    })

    await db.delete(categories).where(eq(categories.id, id))

    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'CATEGORY',
      entityId: id,
      oldValues: JSON.stringify(category)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete Category error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
