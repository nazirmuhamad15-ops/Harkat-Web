import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { messages, conversations } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Verify conversation exists
    const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId)

    })

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Fetch messages
    const history = await db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        orderBy: [asc(messages.createdAt)]
    })

    return NextResponse.json({ 
        success: true, 
        data: {
            conversation,
            messages: history
        } 
    })

  } catch (error) {
    console.error('Chat History API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
