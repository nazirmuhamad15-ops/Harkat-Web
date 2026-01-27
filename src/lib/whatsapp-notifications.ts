// WhatsApp Notification Service
// Helper functions to send WhatsApp notifications

const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://harkat-whatsapp-bot-production.up.railway.app'

interface OrderData {
  orderNumber: string
  customerName: string
  customerPhone: string
  totalAmount: number
  items?: { name: string; quantity: number }[]
}

interface ShippingData {
  orderNumber: string
  customerName: string
  customerPhone: string
  trackingNumber: string
  courierName?: string
  estimatedDelivery?: string
}

// Format phone number to WhatsApp JID
function formatPhoneToJID(phone: string): string {
  let formatted = phone.replace(/\D/g, '')
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1)
  }
  if (!formatted.startsWith('62')) {
    formatted = '62' + formatted
  }
  return `${formatted}@s.whatsapp.net`
}

// Send WhatsApp message via Railway bot
async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const jid = formatPhoneToJID(phone)
    
    const response = await fetch(`${WHATSAPP_BOT_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid, message })
    })
    
    if (response.ok) {
      console.log(`✅ WhatsApp sent to ${phone}`)
      return true
    } else {
      console.error(`❌ WhatsApp failed to ${phone}:`, await response.text())
      return false
    }
  } catch (error) {
    console.error(`❌ WhatsApp error:`, error)
    return false
  }
}

// Send Order Confirmation
export async function sendOrderConfirmation(order: OrderData): Promise<boolean> {
  const message = `Halo ${order.customerName}! 👋

Terima kasih telah berbelanja di *Harkat Furniture*.

📦 *Order #${order.orderNumber}*
💰 Total: Rp ${order.totalAmount.toLocaleString('id-ID')}

Kami akan segera memproses pesanan Anda.

Terima kasih! 🙏`

  return sendWhatsAppMessage(order.customerPhone, message)
}

// Send Shipping Update
export async function sendShippingUpdate(data: ShippingData): Promise<boolean> {
  const message = `Halo ${data.customerName}! 📦

Pesanan Anda sudah dikirim!

📦 Order: #${data.orderNumber}
🚚 No. Resi: ${data.trackingNumber}
${data.courierName ? `📍 Kurir: ${data.courierName}` : ''}
${data.estimatedDelivery ? `📅 Estimasi: ${data.estimatedDelivery}` : ''}

Track pesanan Anda di website kami.

Terima kasih! 🙏`

  return sendWhatsAppMessage(data.customerPhone, message)
}

// Send Payment Reminder
export async function sendPaymentReminder(order: OrderData): Promise<boolean> {
  const message = `Halo ${order.customerName}! 👋

Kami ingin mengingatkan bahwa pesanan Anda belum dibayar:

📦 Order: #${order.orderNumber}
💰 Total: Rp ${order.totalAmount.toLocaleString('id-ID')}


Silakan selesaikan pembayaran agar pesanan dapat diproses:
👉 ${process.env.NEXTAUTH_URL || 'https://harkatfurniture.web.id'}/track?order=${order.orderNumber}

Terima kasih! 🙏`

  return sendWhatsAppMessage(order.customerPhone, message)
}

// Send Delivery Confirmation
export async function sendDeliveryConfirmation(order: OrderData): Promise<boolean> {
  const message = `Halo ${order.customerName}! 🎉

Pesanan Anda sudah sampai!

📦 Order: #${order.orderNumber}

Terima kasih telah berbelanja di Harkat Furniture.
Semoga puas dengan produk kami! ⭐

Ada pertanyaan? Balas pesan ini.`

  return sendWhatsAppMessage(order.customerPhone, message)
}

// Broadcast message to multiple customers
export async function broadcastMessage(phones: string[], message: string): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (const phone of phones) {
    const result = await sendWhatsAppMessage(phone, message)
    if (result) {
      success++
    } else {
      failed++
    }
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return { success, failed }
}

// Export main function
export { sendWhatsAppMessage, formatPhoneToJID }
