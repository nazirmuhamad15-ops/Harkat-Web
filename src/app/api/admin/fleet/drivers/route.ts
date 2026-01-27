import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const drivers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar
    })
    .from(users)
    .where(and(
        eq(users.role, 'DRIVER'),
        eq(users.isActive, true)
    ));

    return NextResponse.json({ drivers })

  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
