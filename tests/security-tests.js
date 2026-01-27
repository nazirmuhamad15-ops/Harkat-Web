#!/usr/bin/env node

/**
 * Security Implementation Test Suite
 * Tests CSRF protection, input validation, and rate limiting
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

// Colors for console output
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

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
}

function recordResult(passed) {
  results.total++
  if (passed) results.passed++
  else results.failed++
}

// Helper to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ============================================
// 1. CSRF PROTECTION TESTS
// ============================================

async function testCsrfProtection() {
  log('\n📋 Testing CSRF Protection...', 'blue')
  
  // Test 1: Get CSRF token (requires auth)
  try {
    const response = await fetch(`${BASE_URL}/api/csrf-token`)
    const passed = response.status === 401 || response.status === 200
    logTest(
      'CSRF Token Endpoint Exists',
      passed,
      `Status: ${response.status}`
    )
    recordResult(passed)
  } catch (error) {
    logTest('CSRF Token Endpoint Exists', false, error.message)
    recordResult(false)
  }
  
  // Test 2: POST without CSRF token should fail
  try {
    const response = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Product' })
    })
    const passed = response.status === 401 || response.status === 403
    logTest(
      'POST without CSRF token blocked',
      passed,
      `Status: ${response.status} (expected 401 or 403)`
    )
    recordResult(passed)
  } catch (error) {
    logTest('POST without CSRF token blocked', false, error.message)
    recordResult(false)
  }
  
  // Test 3: POST with invalid CSRF token should fail
  try {
    const response = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'invalid-token-123'
      },
      body: JSON.stringify({ name: 'Test Product' })
    })
    const passed = response.status === 401 || response.status === 403
    logTest(
      'POST with invalid CSRF token blocked',
      passed,
      `Status: ${response.status} (expected 401 or 403)`
    )
    recordResult(passed)
  } catch (error) {
    logTest('POST with invalid CSRF token blocked', false, error.message)
    recordResult(false)
  }
  
  // Test 4: Origin header validation
  try {
    const response = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil.com',
        'x-csrf-token': 'some-token'
      },
      body: JSON.stringify({ name: 'Test Product' })
    })
    const passed = response.status === 403
    logTest(
      'POST from unauthorized origin blocked',
      passed,
      `Status: ${response.status} (expected 403)`
    )
    recordResult(passed)
  } catch (error) {
    logTest('POST from unauthorized origin blocked', false, error.message)
    recordResult(false)
  }
}

// ============================================
// 2. INPUT VALIDATION TESTS
// ============================================

async function testInputValidation() {
  log('\n📋 Testing Input Validation...', 'blue')
  
  // Test 1: Invalid email
  try {
    const response = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'John Doe',
        customerEmail: 'not-an-email',
        customerPhone: '081234567890',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE'
      })
    })
    const data = await response.json()
    const passed = response.status === 400 && data.error === 'Validation failed'
    logTest(
      'Invalid email rejected',
      passed,
      `Status: ${response.status}, Error: ${data.error || 'none'}`
    )
    recordResult(passed)
  } catch (error) {
    logTest('Invalid email rejected', false, error.message)
    recordResult(false)
  }
  
  // Test 2: XSS attempt in name
  try {
    const response = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: '<script>alert("XSS")</script>',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE'
      })
    })
    const data = await response.json()
    const passed = response.status === 400
    logTest(
      'XSS attempt in name rejected',
      passed,
      `Status: ${response.status}`
    )
    recordResult(passed)
  } catch (error) {
    logTest('XSS attempt in name rejected', false, error.message)
    recordResult(false)
  }
  
  // Test 3: Invalid phone number
  try {
    const response = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '123',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE'
      })
    })
    const data = await response.json()
    const passed = response.status === 400
    logTest(
      'Invalid phone number rejected',
      passed,
      `Status: ${response.status}`
    )
    recordResult(passed)
  } catch (error) {
    logTest('Invalid phone number rejected', false, error.message)
    recordResult(false)
  }
  
  // Test 4: Quantity out of range
  try {
    const response = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1000, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'JNE'
      })
    })
    const data = await response.json()
    const passed = response.status === 400
    logTest(
      'Quantity > 100 rejected',
      passed,
      `Status: ${response.status}`
    )
    recordResult(passed)
  } catch (error) {
    logTest('Quantity > 100 rejected', false, error.message)
    recordResult(false)
  }
  
  // Test 5: Invalid shipping vendor
  try {
    const response = await fetch(`${BASE_URL}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'John Doe',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        shippingAddress: '{"street":"Test"}',
        items: [{ productVariantId: 'abc', quantity: 1, price: 100 }],
        shippingCost: 10000,
        shippingVendor: 'INVALID_VENDOR'
      })
    })
    const data = await response.json()
    const passed = response.status === 400
    logTest(
      'Invalid shipping vendor rejected',
      passed,
      `Status: ${response.status}`
    )
    recordResult(passed)
  } catch (error) {
    logTest('Invalid shipping vendor rejected', false, error.message)
    recordResult(false)
  }
}

// ============================================
// 3. RATE LIMITING TESTS
// ============================================

async function testRateLimiting() {
  log('\n📋 Testing Rate Limiting...', 'blue')
  
  // Test 1: 5 login attempts should work
  log('   Attempting 5 login requests...', 'yellow')
  let allPassed = true
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      })
      
      if (response.status === 429) {
        allPassed = false
        log(`   Attempt ${i}: Rate limited (unexpected)`, 'red')
        break
      } else {
        log(`   Attempt ${i}: ${response.status} (OK)`, 'green')
      }
      
      await delay(100) // Small delay between requests
    } catch (error) {
      allPassed = false
      log(`   Attempt ${i}: Error - ${error.message}`, 'red')
      break
    }
  }
  
  logTest('First 5 login attempts allowed', allPassed)
  recordResult(allPassed)
  
  // Test 2: 6th attempt should be rate limited
  try {
    await delay(200)
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    })
    
    const passed = response.status === 429
    const data = await response.json().catch(() => ({}))
    
    logTest(
      '6th login attempt rate limited',
      passed,
      `Status: ${response.status} (expected 429)`
    )
    
    if (passed && response.headers.get('retry-after')) {
      log(`   Retry-After header: ${response.headers.get('retry-after')}s`, 'yellow')
    }
    
    recordResult(passed)
  } catch (error) {
    logTest('6th login attempt rate limited', false, error.message)
    recordResult(false)
  }
  
  // Wait for rate limit to reset
  log('   Waiting 60 seconds for rate limit reset...', 'yellow')
  await delay(60000)
  
  // Test 3: After reset, should work again
  try {
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    })
    
    const passed = response.status !== 429
    logTest(
      'After 60s, rate limit reset',
      passed,
      `Status: ${response.status} (expected not 429)`
    )
    recordResult(passed)
  } catch (error) {
    logTest('After 60s, rate limit reset', false, error.message)
    recordResult(false)
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  log('🔒 Security Implementation Test Suite', 'blue')
  log('=====================================\n', 'blue')
  log(`Testing against: ${BASE_URL}\n`, 'yellow')
  
  try {
    await testCsrfProtection()
    await testInputValidation()
    await testRateLimiting()
    
    // Print summary
    log('\n=====================================', 'blue')
    log('📊 Test Summary', 'blue')
    log('=====================================', 'blue')
    log(`Total Tests: ${results.total}`)
    log(`Passed: ${results.passed}`, 'green')
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
        results.failed === 0 ? 'green' : 'yellow')
    
    if (results.failed === 0) {
      log('\n✅ All tests passed!', 'green')
      process.exit(0)
    } else {
      log('\n⚠️  Some tests failed. Please review the output above.', 'yellow')
      process.exit(1)
    }
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Run tests
runTests()
