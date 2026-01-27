import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations, messages } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    // In a real app, verify Admin Session here
    // const session = await getServerSession(authOptions)
    // if (!session || session.user.role !== 'ADMIN') ...

    const allConversations = await db.query.conversations.findMany({
        orderBy: [desc(conversations.lastMessageAt)],
        with: {
            // Fetch last message to show preview
            // Note: Drizzle's 'with' doesn't easily support 'limit 1' on relations in all drivers, 
            // but for now we can fetch messages or just rely on client fetching specific history.
            // Better: just fetch metadata.
        }
    })

    // To be more efficient, we could join with messages, but for MVP simple list is fine.
    // We might want to enrich this with the last message text if possible.

    return NextResponse.json({ 
        success: true, 
        data: allConversations 
    })

  } catch (error) {
    console.error('Admin Conversations API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
