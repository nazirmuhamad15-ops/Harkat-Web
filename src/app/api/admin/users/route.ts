import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Strict RBAC: Only SUPER_ADMIN can list all users
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Access restricted to Super Admin' }, { status: 403 })
    }

    const allUsers = await db.query.users.findMany({
      orderBy: desc(users.createdAt),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true, // Only show relevant fields
        createdAt: true,
        updatedAt: true,
        lastLogin: true // Assuming this exists or will be added
      }
    })

    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Strict RBAC: Only SUPER_ADMIN can create users
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Access restricted to Super Admin' }, { status: 403 })
    }

    const data = await request.json()
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)
    
    const [user] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      password: hashedPassword,
      isActive: true
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    })

    // Log activity
    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: user.id,
      newValues: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}