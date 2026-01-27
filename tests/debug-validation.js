#!/usr/bin/env node

async function testValidation() {
  console.log('Testing Order Validation...\n')
  
  const testData = {
    customerName: 'John Doe',
    customerEmail: 'not-an-email',
    customerPhone: '081234567890',
    shippingAddress: JSON.stringify({ street: 'Test Street', city: 'Jakarta' }),
    items: [{ productVariantId: 'abc123', quantity: 1, price: 100000 }],
    shippingCost: 20000,
    shippingVendor: 'JNE',
    volumetricWeight: 0,
    finalWeight: 5
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    
    const contentType = response.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('\nResponse Body:')
      console.log(JSON.stringify(data, null, 2))
    } else {
      const text = await response.text()
      console.log('\nResponse Text:')
      console.log(text)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testValidation()
