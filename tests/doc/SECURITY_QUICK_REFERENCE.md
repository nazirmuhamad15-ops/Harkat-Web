# 🔒 Security Quick Reference

## CSRF Protection

### Get Token (Frontend)
```tsx
import { useCsrfToken } from '@/hooks/use-csrf-token'

const { csrfToken } = useCsrfToken()
```

### Use Token (API Call)
```tsx
fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken || ''
  },
  body: JSON.stringify(data)
})
```

### Error Handling
```tsx
if (response.status === 403) {
  // CSRF token invalid
  window.location.reload()
}
```

---

## Input Validation

### Create Schema
```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,13}$/)
})
```

### Validate Input
```typescript
try {
  const validated = schema.parse(rawData)
  // ✅ Use validated data
} catch (error) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    )
  }
}
```

---

## Rate Limiting

### Check Limit
```typescript
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({ interval: 60 * 1000 })

const allowed = await limiter.check(10, ip)
if (!allowed) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': '60' } }
  )
}
```

---

## Common Patterns

### Protected API Route
```typescript
export async function POST(request: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 2. CSRF check (automatic via middleware)
  
  // 3. Input validation
  const rawData = await request.json()
  const validated = schema.parse(rawData)
  
  // 4. Business logic
  const result = await db.create({ data: validated })
  
  return NextResponse.json({ result })
}
```

### Protected Form (Frontend)
```tsx
function MyForm() {
  const { csrfToken } = useCsrfToken()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken || ''
      },
      body: JSON.stringify(formData)
    })
    
    if (response.status === 400) {
      const { details } = await response.json()
      // Show validation errors
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

---

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Invalid input (validation failed) |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | CSRF token invalid / No permission |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Security Headers

```typescript
// next.config.ts
headers: [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'x-csrf-token', value: csrfToken }  // Add to responses
]
```

---

## Testing Commands

```bash
# Test CSRF protection
curl -X POST http://localhost:3000/api/admin/products \
  -H "x-csrf-token: invalid" \
  -H "Cookie: session=..." \
  -d '{"name": "Test"}'
# Expected: 403

# Test input validation
curl -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "not-an-email"}'
# Expected: 400

# Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -d '{"email": "test@test.com", "password": "wrong"}'
done
# 6th request: 429
```

---

## Troubleshooting

### CSRF Token Issues
- ✅ Check if user is logged in
- ✅ Verify token is being sent in header
- ✅ Check token hasn't expired (1 hour)
- ✅ Ensure origin header matches

### Validation Errors
- ✅ Check schema matches input structure
- ✅ Verify all required fields are present
- ✅ Check data types (string vs number)
- ✅ Review error.errors array for details

### Rate Limiting
- ✅ Wait 60 seconds and retry
- ✅ Check if IP is being detected correctly
- ✅ Verify rate limit settings
- ✅ Use different IP if testing

---

**Quick Reference Version:** 1.0  
**Last Updated:** 17 Januari 2026
