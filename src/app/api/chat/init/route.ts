import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations } from '@/db/schema'
import { createId } from '@paralleldrive/cuid2'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body // Optional, if logged in

    // Create a new conversation
    const newConversation = await db.insert(conversations).values({
      id: createId(),
      userId: userId || null,
      status: 'ai_active',
      unreadCount: 0,
    }).returning()

    return NextResponse.json({ 
        success: true, 
        data: newConversation[0] 
    })

  } catch (error) {
    console.error('Init Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
