import crypto from 'crypto';

interface IpaymuConfig {
  apiKey: string;
  virtualAccount: string;
  sandbox: boolean;
}

const config: IpaymuConfig = {
  apiKey: process.env.IPAYMU_API_KEY || '',
  virtualAccount: process.env.IPAYMU_VA || '',
  sandbox: process.env.IPAYMU_SANDBOX === 'true'
};

export const IpaymuService = {
  /**
   * Generate Signature for IPaymu API
   * HMAC_SHA256(body + method + va + apiKey)
   */
  generateSignature(body: string, method: string): string {
    const signatureSource = body + method + config.virtualAccount + config.apiKey;
    return crypto.createHmac('sha256', config.apiKey).update(signatureSource).digest('hex');
  },

  /**
   * Initialize Payment
   */
  async initPayment(orderId: string, amount: number, customer: { name: string, email: string, phone: string }, items: any[]) {
    const url = config.sandbox 
      ? 'https://sandbox.ipaymu.com/api/v2/payment' 
      : 'https://my.ipaymu.com/api/v2/payment';

    // Construct Payload
    const payload = {
      product: items.map(i => i.name),
      qty: items.map(i => i.quantity),
      price: items.map(i => i.price),
      returnUrl: `${process.env.NEXTAUTH_URL}/track?order=${orderId}&status=success`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/checkout?status=cancel`,
      notifyUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/ipaymu`,
      referenceId: orderId,
      buyerName: customer.name,
      buyerEmail: customer.email,
      buyerPhone: customer.customerPhone || customer.phone,
      paymentMethod: 'va', // Default to Virtual Account
      autoRedirect: true
    };

    const body = JSON.stringify(payload);
    const signature = this.generateSignature(body, 'POST');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'signature': signature,
          'va': config.virtualAccount,
          'timestamp': Date.now().toString()
        },
        body: body,
        signal: controller.signal
      });
      
      clearTimeout(timeout);

      const data = await res.json();
      
      if (!res.ok) {
        console.error('IPaymu Error:', data);
        // Fallback Mock URL for testing if Sandbox fails or keys invalid
        if (config.sandbox && (data.Status === 401 || !config.apiKey)) {
           console.warn('⚠️ Using Mock Payment URL due to invalid Sandbox keys');
           return {
             success: true,
             url: `${process.env.NEXTAUTH_URL}/track?order=${orderId}&status=mock_paid` 
           };
        }
        throw new Error(data.Message || 'Payment init failed');
      }

      return {
        success: true,
        url: data.Data.Url,
        sessionId: data.Data.SessionID
      };

    } catch (error) {
      console.error('Payment Service Error:', error);
      // Fallback
      return { success: false, error: 'Payment Service Unavailable' };
    }
  }
};
