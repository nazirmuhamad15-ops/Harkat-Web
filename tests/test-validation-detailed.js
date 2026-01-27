#!/usr/bin/env node

async function testValidation() {
  console.log('🧪 Testing Order Validation\n')
  
  const tests = [
    {
      name: 'Invalid Email',
      data: {
        customerName: 'John Doe',
        customerEmail: 'not-an-email',
        customerPhone: '081234567890',
        shippingAddress: JSON.stringify({ street: 'Test' }),
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE',
        volumetricWeight: 0,
        finalWeight: 1
      },
      expectedStatus: 400
    },
    {
      name: 'XSS in Name',
      data: {
        customerName: '<script>alert("XSS")</script>',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        shippingAddress: JSON.stringify({ street: 'Test' }),
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE',
        volumetricWeight: 0,
        finalWeight: 1
      },
      expectedStatus: 400
    },
    {
      name: 'Invalid Phone',
      data: {
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '123',
        shippingAddress: JSON.stringify({ street: 'Test' }),
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE',
        volumetricWeight: 0,
        finalWeight: 1
      },
      expectedStatus: 400
    }
  ]
  
  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`)
    console.log('─'.repeat(50))
    
    try {
      const response = await fetch('http://localhost:3000/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data)
      })
      
      const status = response.status
      const data = await response.json()
      
      const passed = status === test.expectedStatus
      console.log(`Status: ${status} ${passed ? '✅' : '❌'}`)
      console.log(`Error: ${data.error || 'none'}`)
      
      if (data.details) {
        if (Array.isArray(data.details) && data.details.length > 0) {
          console.log('Details:')
          data.details.forEach(d => {
            console.log(`  - ${d.field}: ${d.message}`)
          })
        } else if (typeof data.details === 'string') {
          console.log(`Details: ${data.details}`)
        } else {
          console.log('Details: (empty array)')
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Test Complete')
}

testValidation()
