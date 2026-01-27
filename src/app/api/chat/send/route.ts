import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations, messages } from '@/db/schema'
import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
const genAI = process.env.GOOGLE_GENERATIVE_AI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  : null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { conversationId, content, sender: rawSender } = body
    const sender = rawSender || 'USER'

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Save User Message
    const userMessage = await db.insert(messages).values({
      id: createId(),
      conversationId: conversationId,
      sender: sender,
      content: content,
      type: 'text',
      status: 'SENT'
    }).returning()

    // 2. Update Conversation Last Message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId))

    // 3. Bot Logic check
    const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId)
    })

    let botReply = null

    // Determine if we should reply
    if (conversation && sender === 'USER') { // Process all user messages for commands
        const lowerContent = content.toLowerCase().trim()
        let replyContent = ''
        let shouldReply = false

        // Priority 1: Exact Commands (ALWAYS ACTIVE)
        // Priority 1: Exact Commands (ALWAYS ACTIVE)
        if (lowerContent === 'menu' || lowerContent === '!menu' || lowerContent === 'help' || lowerContent === '!help') {
             shouldReply = true
             replyContent = `🤖 Harkat Furniture Bot

Halo! Berikut menu yang tersedia:

• !status - Cek status order
• !admin - Hubungi CS Manusia
• !menu - Tampilkan pesan ini`
        
        // Explicit Status Command - Prompt user
        } else if (lowerContent === 'status' || lowerContent === '!status') {
             shouldReply = true
             replyContent = "Silakan paste atau ketik Nomor Order Anda untuk cek status pesanan."

        // Restore AI status if explicitly requested
        if (conversation.status !== 'ai_active') {
             await db.update(conversations).set({ status: 'ai_active' }).where(eq(conversations.id, conversationId))
        }

        } else if (lowerContent === 'ping' || lowerContent === '!ping') {
             shouldReply = true
             replyContent = "Pong! 🏓 Bot is active."
        }
        
        // Priority 2: Order Number Detection (CUID format or ORD- prefix)
        else {
            // Regex to match ORD-XXXXXX format (4-25 chars after prefix) or CUID
            const orderIdMatch = content.trim().match(/^(ORD[-_]?\d{4,10}|[a-z0-9]{15,25})$/i)
            
            if (orderIdMatch) {
                shouldReply = true
                const searchTerm = content.trim()
                
                // Import orders schema dynamically to avoid circular deps
                const { orders } = await import('@/db/schema')
                const { or, ilike } = await import('drizzle-orm')
                
                const order = await db.query.orders.findFirst({
                    where: or(
                        eq(orders.orderNumber, searchTerm),
                        eq(orders.id, searchTerm),
                        ilike(orders.orderNumber, `%${searchTerm}%`)
                    )
                })
                
                if (order) {
                    // Format order data for AI
                    const statusMap: Record<string, string> = {
                        'PENDING': 'Menunggu Pembayaran',
                        'PAID': 'Sudah Dibayar',
                        'PROCESSING': 'Sedang Diproses',
                        'SHIPPED': 'Dalam Pengiriman',
                        'DELIVERED': 'Sudah Diterima',
                        'CANCELLED': 'Dibatalkan'
                    }
                    const friendlyStatus = statusMap[order.status || 'PENDING'] || order.status
                    
                    if (genAI) {
                        try {
                                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
                            const prompt = `Kamu adalah CS Harkat Furniture. Sampaikan status order berikut dengan ramah dan singkat.
                            PENTING: Jangan gunakan format markdown seperti * atau ** untuk bold. Gunakan plain text saja.
                            
                            Data Order:
                            - Nomor: ${order.orderNumber}
                            - Status: ${friendlyStatus}
                            - Resi: ${order.trackingNumber || 'Belum tersedia'}
                            - Kurir: ${order.shippingVendor || '-'}
                            - Estimasi Tiba: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('id-ID') : 'Belum ada estimasi'}
                            
                            Jawab dengan format plain text yang mudah dibaca tanpa simbol markdown.`
                            
                            const result = await model.generateContent(prompt)
                            replyContent = result.response.text()
                        } catch (error) {
                            console.error("Gemini Error:", error)
                            // Fallback to template response
                            replyContent = `📦 Status Order: ${order.orderNumber}

Status: ${friendlyStatus}
Resi: ${order.trackingNumber || 'Belum tersedia'}
Kurir: ${order.shippingVendor || '-'}`
                        }
                    } else {
                        // No AI, use template
                        replyContent = `📦 Status Order: ${order.orderNumber}

Status: ${friendlyStatus}
Resi: ${order.trackingNumber || 'Belum tersedia'}
Kurir: ${order.shippingVendor || '-'}`
                    }
                } else {
                    replyContent = `Maaf, order "${searchTerm}" tidak ditemukan. Pastikan nomor order benar atau hubungi Admin.`
                }
            }
            // Priority 3: AI Processing for other messages
            else if (conversation.status === 'ai_active') {
                shouldReply = true
                
                if (lowerContent.includes('admin') || lowerContent.includes('cs') || lowerContent.includes('orang') || lowerContent.includes('manusia')) {
                    await db.update(conversations)
                        .set({ status: 'human_manual' })
                        .where(eq(conversations.id, conversationId))
                    replyContent = "Baik, saya akan menghubungkan Anda dengan Customer Service kami. Mohon tunggu sebentar ya... (Mode Manual Aktif)"
                } else if (genAI) {
                    // AI Processing
                    try {
                        console.log('Generating AI response for:', content)
                            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
                        const prompt = `Kamu adalah asisten customer service toko furniture bernama 'Harkat Furniture'. 
                        Jawablah pertanyaan customer dengan ramah, singkat, dan membantu.
                        Jika ditanya harga, arahkan untuk melihat katalog.
                        Jika ditanya lokasi, jawab: Kami berlokasi di Jepara, Jawa Tengah.
                        
                        Customer: ${content}
                        CS:`
                        
                        const result = await model.generateContent(prompt)
                        const response = await result.response
                        replyContent = response.text()
                        console.log('AI Response generated:', replyContent)
                    } catch (error) {
                        console.error("Gemini Error:", error)
                        replyContent = "Maaf, sistem AI kami sedang sibuk. Mohon tunggu sebentar atau hubungi Admin."
                    }
                } else {
                    console.log('AI not configured (genAI is null)')
                    replyContent = "Halo! Terima kasih sudah menghubungi Harkat Furniture. Admin kami akan segera membalas pesan Anda."
                }
            }
        }

        if (shouldReply && replyContent) {
            botReply = await db.insert(messages).values({
                id: createId(),
                conversationId: conversationId,
                sender: 'SYSTEM',
                content: replyContent,
                type: 'text',
                status: 'SENT'
            }).returning()
        }
    }

    return NextResponse.json({ 
        success: true, 
        data: {
            userMessage: userMessage[0],
            botReply: botReply ? botReply[0] : null
        }
    })

  } catch (error) {
    console.error('Send Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
