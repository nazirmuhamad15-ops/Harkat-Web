import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    // Get current user status
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { isActive: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Toggle user status
    const [updatedUser] = await db.update(users)
      .set({ 
        isActive: !currentUser.isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive
      })

    // Log activity
    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: 'TOGGLE_USER_STATUS',
      entityType: 'USER',
      entityId: userId,
      oldValues: JSON.stringify({ isActive: currentUser.isActive }),
      newValues: JSON.stringify({ isActive: updatedUser.isActive }),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Failed to toggle user status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}