import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const body = await request.json()
    const { status } = body

    if (!conversationId || !status) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 })
    }

    await db.update(conversations)
        .set({ status: status })
        .where(eq(conversations.id, conversationId))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update Status API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
