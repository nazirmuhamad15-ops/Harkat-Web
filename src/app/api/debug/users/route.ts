import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users as usersTable } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allUsers = await db.query.users.findMany({
      orderBy: desc(usersTable.createdAt),
      columns: {
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}