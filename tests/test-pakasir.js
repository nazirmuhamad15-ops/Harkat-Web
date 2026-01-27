// Test Pakasir SDK
import { Pakasir } from 'pakasir-sdk';

const pakasir = new Pakasir({
  slug: 'harkat-furniture',
  apikey: 'yjuF8BGXuDiEamGkIpYN3xq0YXLLhq6f'
});

async function testPakasir() {
  try {
    console.log('Testing Pakasir SDK...');
    
    // Test 1: Get payment info (fee calculation)
    console.log('\n1. Testing fee calculation...');
    const feeInfo = await pakasir.getPaymentInfo('qris', 100000);
    console.log('Fee Info:', feeInfo);
    
    // Test 2: Create payment
    console.log('\n2. Testing payment creation...');
    const payment = await pakasir.createPayment(
      'all',
      'TEST-' + Date.now(),
      100000,
      'http://localhost:3000/track?order=TEST&status=success'
    );
    console.log('Payment Created:', payment);
    console.log('Payment URL:', payment.payment_url);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPakasir();
