import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// GET
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// PATCH
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    // Only Super Admin can modify users
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Access restricted to Super Admin' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    
    // Validate: Can't change own role if not Super Admin? 
    // Simplify for MVP.

    const updateData: any = {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        isActive: body.isActive,
        updatedAt: new Date()
    }

    if (body.password && body.password.length > 0) {
        updateData.password = await bcrypt.hash(body.password, 12)
    }

    const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning()

    await db.insert(activityLogs).values({
        userId: session.user.id,
        action: 'UPDATE_USER',
        entityType: 'USER',
        entityId: id,
        newValues: JSON.stringify(updateData),
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update User Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // SECURITY FIX: Only SUPER_ADMIN can delete users
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Unauthorized: Only Super Admin can delete users' }, { status: 403 })
    }

    const { id } = await params
    
    // Prevent self-delete
    if (id === session.user.id) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Fetch user data before deletion for audit log
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id))

    // AUDIT LOG: Record deletion
    await db.insert(activityLogs).values({
        userId: session.user.id,
        action: 'DELETE_USER',
        entityType: 'USER',
        entityId: id,
        oldValues: JSON.stringify(userToDelete),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete User Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
