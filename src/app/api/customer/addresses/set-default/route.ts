import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userAddresses } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
       return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    // Unset all other defaults
    await db.update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, session.user.id))

    // Set the target address as default
    await db.update(userAddresses)
      .set({ isDefault: true })
      .where(
        and(
          eq(userAddresses.id, id),
          eq(userAddresses.userId, session.user.id)
        )
      )

    return NextResponse.json({ success: true, message: 'Default address updated' })

  } catch (error) {
    console.error('Set default address error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
