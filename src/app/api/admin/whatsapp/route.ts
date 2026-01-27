import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'debug-whatsapp.log')

function fileLog(message: string) {
  const timestamp = new Date().toISOString()
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`)
}

const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://harkat-whatsapp-bot-production.up.railway.app'

// GET - Get connection status and QR from Railway bot
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // DEBUG LOGS
    fileLog(`[API] Starting Status Check. Target: ${WHATSAPP_BOT_URL}`)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      fileLog('[API] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
      
      fileLog('[API] Fetching from WhatsApp Bot...')
      const statusRes = await fetch(`${WHATSAPP_BOT_URL}/status`, {
        signal: controller.signal,
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'NextJS-Backend'
        }
      })
      clearTimeout(timeoutId)
      
      if (statusRes.ok) {
        const data = await statusRes.json()
        fileLog(`[API] Success! Data: ${JSON.stringify(data)}`)
        return NextResponse.json({
          ...data,
          botUrl: WHATSAPP_BOT_URL
        })
      } else {
        fileLog(`[API] Fetch failed. Status: ${statusRes.status}`)
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
         fileLog('[API] ABORTED: Timeout 15s exceeded')
      } else {
         fileLog(`[API] FETCH ERROR: ${e.message} | Cause: ${e.cause}`)
      }
    }

    fileLog('[API] Returning OFFLINE fallback')
    return NextResponse.json({ 
      status: 'offline',
      qr: null,
      user: null,
      botUrl: WHATSAPP_BOT_URL,
      message: 'WhatsApp Bot tidak dapat dihubungi'
    })
  } catch (error: any) {
    fileLog(`[API] CRITICAL ERROR: ${error.message}`)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST - Actions: connect, disconnect, send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, jid, message } = body

    // Initiate connection (restart/reconnect)
    if (action === 'connect') {
      try {
        const res = await fetch(`${WHATSAPP_BOT_URL}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Connection initiated' })
        }
      } catch (e) {
        // Some bots don't have /connect endpoint, just return status
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Silakan scan QR Code untuk menghubungkan WhatsApp' 
      })
    }

    // Disconnect/Logout
    if (action === 'disconnect') {
      try {
        const res = await fetch(`${WHATSAPP_BOT_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Disconnected' })
        }
      } catch (e) {
        // Ignore errors
      }
      
      return NextResponse.json({ success: true, message: 'Logout request sent' })
    }

    // Send message
    if (jid && message) {
      try {
        const res = await fetch(`${WHATSAPP_BOT_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jid, message })
        })
        
        if (res.ok) {
          return NextResponse.json({ success: true })
        } else {
          const data = await res.json()
          return NextResponse.json({ error: data.error || 'Failed to send' }, { status: 500 })
        }
      } catch (e) {
        return NextResponse.json({ error: 'WhatsApp bot tidak dapat dihubungi' }, { status: 503 })
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('WhatsApp action error:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}
