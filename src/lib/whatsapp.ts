export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    // Format phone number to JID (e.g., 628123456789@s.whatsapp.net)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    const jid = `${formattedPhone}@s.whatsapp.net`;

    const baseUrl = (process.env.WHATSAPP_SERVICE_URL || 'https://harkat-whatsapp-bot-production.up.railway.app').replace(/\/$/, '');
    const url = baseUrl.endsWith('/send') ? baseUrl : `${baseUrl}/send`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jid, message }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send WhatsApp message');
    }

    return await response.json();
  } catch (error) {
    console.error('WhatsApp Utility Error:', error);
    return { success: false, error };
  }
}
