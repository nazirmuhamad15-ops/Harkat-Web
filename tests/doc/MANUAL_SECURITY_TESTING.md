# Manual Security Testing Guide

## Prerequisites

```bash
# Start the development server
npm run dev
```

Server should be running on `http://localhost:3000`

---

## Test 1: CSRF Protection

### 1.1 Get CSRF Token (Should require auth)

```bash
curl http://localhost:3000/api/csrf-token
```

**Expected:**
- Status: `401 Unauthorized` (if not logged in)
- OR Status: `200 OK` with `{ "csrfToken": "...", "expiresIn": 3600 }`

**✅ PASS if:** Returns 401 or 200 with token

---

### 1.2 POST without CSRF Token (Should be blocked)

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product"}'
```

**Expected:**
- Status: `401 Unauthorized` (no session) OR `403 Forbidden` (missing CSRF token)

**✅ PASS if:** Request is blocked (401 or 403)

---

### 1.3 POST with Invalid CSRF Token (Should be blocked)

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: invalid-token-123" \
  -d '{"name": "Test Product"}'
```

**Expected:**
- Status: `403 Forbidden`
- Body: `{ "error": "Invalid CSRF token", ... }`

**✅ PASS if:** Returns 403 with CSRF error

---

### 1.4 POST from Unauthorized Origin (Should be blocked)

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil.com" \
  -H "x-csrf-token: some-token" \
  -d '{"name": "Test Product"}'
```

**Expected:**
- Status: `403 Forbidden`
- Body: `{ "error": "Forbidden", "message": "Request origin is not allowed." }`

**✅ PASS if:** Returns 403 with origin error

---

## Test 2: Input Validation

### 2.1 Invalid Email (Should be rejected)

```bash
curl -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "not-an-email",
    "customerPhone": "081234567890",
    "shippingAddress": "{\"street\":\"Jl. Test\",\"city\":\"Jakarta\"}",
    "items": [{"productVariantId": "abc123", "quantity": 1, "price": 100000}],
    "shippingCost": 20000,
    "shippingVendor": "JNE",
    "volumetricWeight": 0,
    "finalWeight": 5
  }'
```

**Expected:**
- Status: `400 Bad Request`
- Body: `{ "error": "Validation failed", "details": [...] }`
- Details should mention "Invalid email format"

**✅ PASS if:** Returns 400 with validation error

---

### 2.2 XSS Attempt in Name (Should be rejected)

```bash
curl -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "<script>alert(\"XSS\")</script>",
    "customerEmail": "test@example.com",
    "customerPhone": "081234567890",
    "shippingAddress": "{\"street\":\"Jl. Test\"}",
    "items": [{"productVariantId": "abc", "quantity": 1, "price": 100}],
    "shippingCost": 10000,
    "shippingVendor": "JNE",
    "volumetricWeight": 0,
    "finalWeight": 1
  }'
```

**Expected:**
- Status: `400 Bad Request`
- Details should mention "Name contains invalid characters"

**✅ PASS if:** Returns 400 with validation error

---

### 2.3 Invalid Phone Number (Should be rejected)

```bash
curl -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "test@example.com",
    "customerPhone": "123",
    "shippingAddress": "{\"street\":\"Test\"}",
    "items": [{"productVariantId": "abc", "quantity": 1, "price": 100}],
    "shippingCost": 10000,
    "shippingVendor": "JNE",
    "volumetricWeight": 0,
    "finalWeight": 1
  }'
```

**Expected:**
- Status: `400 Bad Request`
- Details should mention "Invalid Indonesian phone number format"

**✅ PASS if:** Returns 400 with phone validation error

---

### 2.4 Quantity Out of Range (Should be rejected)

```bash
curl -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "test@example.com",
    "customerPhone": "081234567890",
    "shippingAddress": "{\"street\":\"Test\"}",
    "items": [{"productVariantId": "abc", "quantity": 1000, "price": 100}],
    "shippingCost": 10000,
    "shippingVendor": "JNE",
    "volumetricWeight": 0,
    "finalWeight": 1
  }'
```

**Expected:**
- Status: `400 Bad Request`
- Details should mention "Quantity cannot exceed 100"

**✅ PASS if:** Returns 400 with quantity error

---

### 2.5 Invalid Shipping Vendor (Should be rejected)

```bash
curl -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "test@example.com",
    "customerPhone": "081234567890",
    "shippingAddress": "{\"street\":\"Test\"}",
    "items": [{"productVariantId": "abc", "quantity": 1, "price": 100}],
    "shippingCost": 10000,
    "shippingVendor": "INVALID_VENDOR",
    "volumetricWeight": 0,
    "finalWeight": 1
  }'
```

**Expected:**
- Status: `400 Bad Request`
- Details should mention "Invalid shipping vendor"

**✅ PASS if:** Returns 400 with vendor error

---

## Test 3: Rate Limiting

### 3.1 First 5 Login Attempts (Should work)

Run this command 5 times:

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Expected:**
- Attempts 1-5: Status `401 Unauthorized` or similar (wrong password)

**✅ PASS if:** All 5 attempts get through (not 429)

---

### 3.2 6th Login Attempt (Should be rate limited)

Run the same command a 6th time:

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type": application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Expected:**
- Status: `429 Too Many Requests`
- Body: `{ "error": "Too many login attempts", ... }`
- Header: `Retry-After: 60`

**✅ PASS if:** Returns 429 with rate limit message

---

### 3.3 After 60 Seconds (Should reset)

Wait 60 seconds, then try again:

```bash
# Wait 60 seconds
sleep 60

# Try again
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Expected:**
- Status: NOT `429` (should be 401 or similar)

**✅ PASS if:** Request goes through (not rate limited)

---

## Browser Testing (Frontend)

### Test CSRF Token Hook

1. Open browser to `http://localhost:3000`
2. Open DevTools Console
3. Paste this code:

```javascript
// Test useCsrfToken hook
fetch('/api/csrf-token')
  .then(res => res.json())
  .then(data => {
    console.log('✅ CSRF Token:', data.csrfToken)
    console.log('✅ Expires In:', data.expiresIn, 'seconds')
  })
  .catch(err => console.error('❌ Error:', err))
```

**Expected:**
- If logged in: Shows CSRF token
- If not logged in: 401 error

---

### Test CSRF Protection in Action

1. Login to admin panel
2. Open DevTools Console
3. Try to create a product without CSRF token:

```javascript
fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Product' })
})
  .then(res => res.json())
  .then(data => console.log('Response:', data))
```

**Expected:**
- Status: 403
- Error: "Invalid CSRF token"

---

## Test Results Checklist

### CSRF Protection
- [ ] CSRF token endpoint requires auth
- [ ] POST without CSRF token is blocked
- [ ] POST with invalid CSRF token is blocked
- [ ] POST from unauthorized origin is blocked

### Input Validation
- [ ] Invalid email is rejected
- [ ] XSS attempt in name is rejected
- [ ] Invalid phone number is rejected
- [ ] Quantity > 100 is rejected
- [ ] Invalid shipping vendor is rejected

### Rate Limiting
- [ ] First 5 login attempts work
- [ ] 6th login attempt is rate limited
- [ ] After 60s, rate limit resets

---

## Quick Test Script

Save this as `quick-test.sh`:

```bash
#!/bin/bash

echo "🔒 Quick Security Tests"
echo "======================="

echo ""
echo "Test 1: CSRF Protection"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

echo ""
echo "Test 2: Input Validation (Invalid Email)"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "not-an-email"}'

echo ""
echo "Test 3: Rate Limiting (Attempt 1)"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "wrong"}'

echo ""
echo "✅ Tests complete!"
```

Run with:
```bash
chmod +x quick-test.sh
./quick-test.sh
```

---

**Testing Guide Version:** 1.0  
**Last Updated:** 17 Januari 2026
