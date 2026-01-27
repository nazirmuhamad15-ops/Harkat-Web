#!/usr/bin/env node

/**
 * Quick Security Test (No Rate Limit Wait)
 */

const BASE_URL = 'http://localhost:3000'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌'
  const color = passed ? 'green' : 'red'
  log(`${icon} ${name}`, color)
  if (details) log(`   ${details}`, 'yellow')
}

const results = { total: 0, passed: 0, failed: 0 }

function recordResult(passed) {
  results.total++
  if (passed) results.passed++
  else results.failed++
}

async function runQuickTests() {
  log('🔒 Quick Security Test Suite', 'blue')
  log('============================\n', 'blue')
  
  // Test 1: CSRF Token Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/csrf-token`)
    const passed = res.status === 401 || res.status === 200
    logTest('CSRF Token Endpoint', passed, `Status: ${res.status}`)
    recordResult(passed)
  } catch (e) {
    logTest('CSRF Token Endpoint', false, e.message)
    recordResult(false)
  }
  
  // Test 2: POST without CSRF token
  try {
    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    })
    const passed = res.status === 401 || res.status === 403
    logTest('POST without CSRF blocked', passed, `Status: ${res.status}`)
    recordResult(passed)
  } catch (e) {
    logTest('POST without CSRF blocked', false, e.message)
    recordResult(false)
  }
  
  // Test 3: Invalid email validation
  try {
    const res = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: 'not-an-email',
        customerName: 'Test',
        customerPhone: '081234567890',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE',
        volumetricWeight: 0,
        finalWeight: 1
      })
    })
    const data = await res.json()
    const passed = res.status === 400 && data.error === 'Validation failed'
    logTest('Invalid email rejected', passed, `Status: ${res.status}`)
    recordResult(passed)
  } catch (e) {
    logTest('Invalid email rejected', false, e.message)
    recordResult(false)
  }
  
  // Test 4: XSS in name
  try {
    const res = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: '<script>alert("XSS")</script>',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE',
        volumetricWeight: 0,
        finalWeight: 1
      })
    })
    const passed = res.status === 400
    logTest('XSS attempt rejected', passed, `Status: ${res.status}`)
    recordResult(passed)
  } catch (e) {
    logTest('XSS attempt rejected', false, e.message)
    recordResult(false)
  }
  
  // Test 5: Invalid phone
  try {
    const res = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '123',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE',
        volumetricWeight: 0,
        finalWeight: 1
      })
    })
    const passed = res.status === 400
    logTest('Invalid phone rejected', passed, `Status: ${res.status}`)
    recordResult(passed)
  } catch (e) {
    logTest('Invalid phone rejected', false, e.message)
    recordResult(false)
  }
  
  // Test 6: Rate limiting (first 3 attempts)
  log('\n📋 Testing Rate Limiting (3 attempts)...', 'blue')
  let rateLimitPassed = true
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
      })
      if (res.status === 429) {
        log(`   Attempt ${i}: Rate limited (unexpected)`, 'red')
        rateLimitPassed = false
        break
      } else {
        log(`   Attempt ${i}: ${res.status} ✓`, 'green')
      }
      await new Promise(r => setTimeout(r, 100))
    } catch (e) {
      log(`   Attempt ${i}: Error - ${e.message}`, 'red')
      rateLimitPassed = false
      break
    }
  }
  logTest('First 3 login attempts allowed', rateLimitPassed)
  recordResult(rateLimitPassed)
  
  // Summary
  log('\n============================', 'blue')
  log('📊 Test Summary', 'blue')
  log('============================', 'blue')
  log(`Total: ${results.total}`)
  log(`Passed: ${results.passed}`, 'green')
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed === 0 ? 'green' : 'yellow')
  
  if (results.failed === 0) {
    log('\n✅ All tests passed!', 'green')
    process.exit(0)
  } else {
    log('\n⚠️  Some tests failed.', 'yellow')
    process.exit(1)
  }
}

runQuickTests()
