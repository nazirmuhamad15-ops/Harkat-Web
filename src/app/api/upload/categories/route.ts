import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToR2, isR2Configured } from '@/lib/r2-storage'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `category-${Date.now()}.${ext}`

    let url: string

    // Try R2 first, fallback to local
    if (isR2Configured()) {
      const result = await uploadToR2(buffer, filename, file.type, 'categories')
      url = result.url
    } else {
      // Fallback to local storage
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'categories')
      await mkdir(uploadDir, { recursive: true }).catch(() => {})
      await writeFile(path.join(uploadDir, filename), buffer)
      url = `/uploads/categories/${filename}`
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
