import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createId } from '@paralleldrive/cuid2'
import { db } from '@/lib/db'
import { messages } from '@/db/schema'

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null

    if (!file || !conversationId) {
      return NextResponse.json({ error: 'Missing file or conversationId' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar (max 5MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 })
    }

    // Create upload directory if not exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${createId()}.${ext}`
    const filepath = join(uploadDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // URL for accessing the file
    const mediaUrl = `/uploads/chat/${filename}`

    // Save message to database
    const messageId = createId()
    const newMessage = await db.insert(messages).values({
      id: messageId,
      conversationId,
      sender: 'USER',
      content: file.type.startsWith('image/') ? '📷 Gambar' : '📎 Dokumen',
      type: file.type.startsWith('image/') ? 'image' : 'text',
      mediaUrl,
      status: 'SENT'
    }).returning()

    return NextResponse.json({
      success: true,
      data: {
        message: newMessage[0],
        mediaUrl
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Gagal upload file' }, { status: 500 })
  }
}
