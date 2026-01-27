// Pakasir REST API Configuration
const PAKASIR_API_BASE = 'https://app.pakasir.com/api';
const PAKASIR_PAY_BASE = 'https://app.pakasir.com/pay';

// Payment method types supported by Pakasir
export type PaymentMethod = 
  | 'qris' 
  | 'bca_va' 
  | 'bni_va' 
  | 'bri_va' 
  | 'mandiri_va' 
  | 'permata_va'
  | 'paypal' 
  | 'all';

/**
 * Create a new payment transaction using Pakasir REST API
 * @param method - Payment method (use 'all' to let user choose)
 * @param orderId - Unique order identifier
 * @param amount - Payment amount in Rupiah
 * @param redirectUrl - URL to redirect after payment completion
 * @returns Payment details including payment URL
 */
export async function createPayment(
  method: PaymentMethod,
  orderId: string,
  amount: number,
  redirectUrl?: string
) {
  try {
    const slug = process.env.PAKASIR_SLUG;
    const apiKey = process.env.PAKASIR_API_KEY;
    const isSandbox = process.env.PAKASIR_SANDBOX === 'true';

    // Validate environment variables
    if (!slug || !apiKey) {
      console.warn('[Pakasir] Missing credentials, using mock payment URL');
      return {
        success: true,
        paymentUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/track?order=${orderId}&status=mock`,
        paymentMethod: method,
        paymentNumber: `MOCK-${orderId}`,
        fee: 0,
        totalPayment: amount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      };
    }

    console.log('[Pakasir] Creating payment via REST API...');
    console.log('[Pakasir] Config:', { slug, method, orderId, amount, sandbox: isSandbox });

    // For 'all' method, use URL-based redirect instead of API
    if (method === 'all') {
      const baseRedirectUrl = redirectUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/track?order=${orderId}&status=success`;
      
      // In sandbox mode, add auto-confirm parameter
      const finalRedirectUrl = isSandbox 
        ? `${baseRedirectUrl}&sandbox=true`
        : baseRedirectUrl;
      
      const paymentUrl = `${PAKASIR_PAY_BASE}/${slug}/${amount}?order_id=${orderId}&redirect=${encodeURIComponent(finalRedirectUrl)}`;
      
      console.log('[Pakasir] Using URL-based payment:', paymentUrl);
      console.log('[Pakasir] Sandbox mode:', isSandbox);
      
      return {
        success: true,
        paymentUrl,
        paymentMethod: 'all',
        paymentNumber: orderId,
        fee: 0, // Will be calculated by Pakasir
        totalPayment: amount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        sandbox: isSandbox
      };
    }

    // For specific payment methods, use API
    const response = await fetch(`${PAKASIR_API_BASE}/transactioncreate/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: slug,
        order_id: orderId,
        amount: amount,
        api_key: apiKey
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pakasir API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Pakasir] Payment created successfully:', data);
    
    const payment = data.payment;
    
    return {
      success: true,
      paymentUrl: `${PAKASIR_PAY_BASE}/${slug}/${amount}?order_id=${orderId}`,
      paymentMethod: payment.payment_method,
      paymentNumber: payment.payment_number,
      fee: payment.fee,
      totalPayment: payment.total_payment,
      expiresAt: payment.expired_at,
      status: payment.status || 'pending'
    };
  } catch (error: any) {
    console.error('[Pakasir] Payment creation failed');
    console.error('[Pakasir] Error:', error.message);
    
    // Fallback for development/testing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Pakasir] Using fallback mock payment URL for development');
      return {
        success: true,
        paymentUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/track?order=${orderId}&status=mock`,
        paymentMethod: method,
        paymentNumber: `MOCK-${orderId}`,
        fee: 0,
        totalPayment: amount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      };
    }
    
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * Check payment status using Pakasir REST API
 * @param orderId - Order identifier
 * @param amount - Payment amount
 * @returns Payment status and details
 */
export async function checkPaymentStatus(
  orderId: string,
  amount: number
) {
  try {
    const slug = process.env.PAKASIR_SLUG;
    const apiKey = process.env.PAKASIR_API_KEY;

    if (!slug || !apiKey) {
      throw new Error('Missing Pakasir credentials');
    }

    const url = `${PAKASIR_API_BASE}/transactiondetail?project=${slug}&amount=${amount}&order_id=${orderId}&api_key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Pakasir API error: ${response.status}`);
    }

    const data = await response.json();
    const transaction = data.transaction;
    
    return {
      success: true,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      paymentNumber: orderId,
      amount: transaction.amount,
      fee: 0,
      totalPayment: transaction.amount,
      completedAt: transaction.completed_at,
      expiresAt: null
    };
  } catch (error: any) {
    console.error('[Pakasir] Status check failed:', error);
    throw new Error(`Failed to check payment status: ${error.message}`);
  }
}

/**
 * Simulate payment for testing (sandbox only)
 * @param orderId - Order identifier
 * @param amount - Payment amount
 * @returns Simulated payment result
 */
export async function simulatePayment(
  orderId: string,
  amount: number
) {
  try {
    const slug = process.env.PAKASIR_SLUG;
    const apiKey = process.env.PAKASIR_API_KEY;

    if (!slug || !apiKey) {
      throw new Error('Missing Pakasir credentials');
    }

    const response = await fetch(`${PAKASIR_API_BASE}/paymentsimulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: slug,
        order_id: orderId,
        amount: amount,
        api_key: apiKey
      })
    });

    if (!response.ok) {
      throw new Error(`Pakasir API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[Pakasir] Payment simulation failed:', error);
    throw new Error(`Failed to simulate payment: ${error.message}`);
  }
}
