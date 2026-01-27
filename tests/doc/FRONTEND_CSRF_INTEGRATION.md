# Frontend Integration Guide

## Step 1: Wrap Admin Layout with CSRF Provider

Update `src/app/(admin)/admin/layout.tsx`:

```tsx
import { CsrfProvider } from '@/components/providers/csrf-provider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CsrfProvider>
      {/* Your existing layout code */}
      {children}
    </CsrfProvider>
  )
}
```

---

## Step 2: Update Product Page to Use CSRF

Update `src/app/(admin)/admin/catalog/products/page.tsx`:

### Add Import

```tsx
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'
```

### Use CSRF Hook

```tsx
export default function ProductsPage() {
  const { csrfToken, loading: csrfLoading } = useCsrf()
  
  // ... existing state
```

### Update API Calls

#### 1. Create Product (Line 344)

**Before:**
```tsx
const response = await fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
```

**After:**
```tsx
const response = await fetchWithCsrf(
  '/api/admin/products',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  },
  csrfToken
)
```

#### 2. Update Product (Line 284)

**Before:**
```tsx
const response = await fetch(`/api/admin/products/${editId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
```

**After:**
```tsx
const response = await fetchWithCsrf(
  `/api/admin/products/${editId}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({...})
  },
  csrfToken
)
```

#### 3. Delete Product (Line 368)

**Before:**
```tsx
const response = await fetch(`/api/admin/products/${deleteId}`, { 
  method: 'DELETE' 
})
```

**After:**
```tsx
const response = await fetchWithCsrf(
  `/api/admin/products/${deleteId}`,
  { method: 'DELETE' },
  csrfToken
)
```

#### 4. Toggle Featured (Line 384)

**Before:**
```tsx
const response = await fetch(`/api/admin/products/${product.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ featured: !product.featured })
})
```

**After:**
```tsx
const response = await fetchWithCsrf(
  `/api/admin/products/${product.id}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ featured: !product.featured })
  },
  csrfToken
)
```

#### 5. Toggle Status (Line 401)

**Before:**
```tsx
const response = await fetch(`/api/admin/products/${product.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: newStatus })
})
```

**After:**
```tsx
const response = await fetchWithCsrf(
  `/api/admin/products/${product.id}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  },
  csrfToken
)
```

#### 6. Bulk Actions (Lines 448-461)

**Before:**
```tsx
if (action === 'delete') {
  response = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
} else {
  response = await fetch(`/api/admin/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
```

**After:**
```tsx
if (action === 'delete') {
  response = await fetchWithCsrf(
    `/api/admin/products/${productId}`,
    { method: 'DELETE' },
    csrfToken
  )
} else {
  response = await fetchWithCsrf(
    `/api/admin/products/${productId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    csrfToken
  )
}
```

---

## Step 3: Update Other Admin Pages

Apply the same pattern to other admin pages:

### Orders Page (`src/app/(admin)/admin/orders/page.tsx`)

```tsx
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'

export default function OrdersPage() {
  const { csrfToken } = useCsrf()
  
  // Update status
  const updateOrderStatus = async (orderId: string, status: string) => {
    const response = await fetchWithCsrf(
      `/api/admin/orders/${orderId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      },
      csrfToken
    )
    // ... handle response
  }
}
```

### Users Page (`src/app/(admin)/admin/system/users/page.tsx`)

```tsx
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'

export default function UsersPage() {
  const { csrfToken } = useCsrf()
  
  // Create user
  const createUser = async (userData: any) => {
    const response = await fetchWithCsrf(
      '/api/admin/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      },
      csrfToken
    )
    // ... handle response
  }
  
  // Delete user
  const deleteUser = async (userId: string) => {
    const response = await fetchWithCsrf(
      `/api/admin/users/${userId}`,
      { method: 'DELETE' },
      csrfToken
    )
    // ... handle response
  }
}
```

---

## Step 4: Update Driver App (if applicable)

Update `src/app/(driver)/driver/layout.tsx`:

```tsx
import { CsrfProvider } from '@/components/providers/csrf-provider'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <CsrfProvider>
      {children}
    </CsrfProvider>
  )
}
```

Then update driver pages similarly:

```tsx
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'

export default function FuelLogPage() {
  const { csrfToken } = useCsrf()
  
  const submitFuelLog = async (data: any) => {
    const response = await fetchWithCsrf(
      '/api/driver/fuel',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      csrfToken
    )
    // ... handle response
  }
}
```

---

## Step 5: Error Handling

Add global error handling for CSRF failures:

```tsx
const response = await fetchWithCsrf(url, options, csrfToken)

if (response.status === 403) {
  const data = await response.json()
  if (data.error === 'Invalid CSRF token') {
    toast.error('Session expired. Please refresh the page.')
    // Optionally auto-refresh:
    setTimeout(() => window.location.reload(), 2000)
    return
  }
}

if (!response.ok) {
  toast.error('Operation failed')
  return
}

// Success
const result = await response.json()
toast.success('Operation successful')
```

---

## Step 6: Loading State

Show loading indicator while CSRF token is being fetched:

```tsx
export default function ProductsPage() {
  const { csrfToken, loading: csrfLoading } = useCsrf()
  
  if (csrfLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }
  
  // ... rest of component
}
```

---

## Complete Example: Product Create Function

```tsx
const handleSaveProduct = async () => {
  // Check if CSRF token is available
  if (!csrfToken) {
    toast.error('Security token not available. Please refresh the page.')
    return
  }
  
  try {
    const payload = {
      name: formData.name,
      category: formData.category,
      // ... other fields
    }
    
    const response = await fetchWithCsrf(
      '/api/admin/products',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      csrfToken
    )
    
    if (response.status === 403) {
      const data = await response.json()
      if (data.error === 'Invalid CSRF token') {
        toast.error('Session expired. Refreshing page...')
        setTimeout(() => window.location.reload(), 2000)
        return
      }
    }
    
    if (!response.ok) {
      const err = await response.json()
      toast.error('Failed to create product: ' + (err.details || err.error))
      return
    }
    
    toast.success('Product created successfully')
    setShowAddDialog(false)
    resetForm()
    fetchProducts()
    
  } catch (error) {
    console.error('Network error:', error)
    toast.error('Network error. Please check your connection.')
  }
}
```

---

## Testing Checklist

After implementing CSRF protection:

- [ ] Login to admin panel
- [ ] Open DevTools Console
- [ ] Check for CSRF token fetch: `GET /api/csrf-token`
- [ ] Create a product - should include `x-csrf-token` header
- [ ] Update a product - should include `x-csrf-token` header
- [ ] Delete a product - should include `x-csrf-token` header
- [ ] Check Network tab for all POST/PATCH/DELETE requests
- [ ] Verify no 403 errors related to CSRF
- [ ] Test with invalid token (manually change header) - should get 403

---

## Migration Checklist

### Admin Pages
- [ ] `src/app/(admin)/admin/layout.tsx` - Add CsrfProvider
- [ ] `src/app/(admin)/admin/catalog/products/page.tsx` - Update all API calls
- [ ] `src/app/(admin)/admin/catalog/categories/page.tsx` - Update all API calls
- [ ] `src/app/(admin)/admin/orders/page.tsx` - Update all API calls
- [ ] `src/app/(admin)/admin/system/users/page.tsx` - Update all API calls
- [ ] `src/app/(admin)/admin/system/settings/page.tsx` - Update all API calls

### Driver Pages
- [ ] `src/app/(driver)/driver/layout.tsx` - Add CsrfProvider
- [ ] `src/app/(driver)/driver/fuel/page.tsx` - Update all API calls
- [ ] `src/app/(driver)/driver/tasks/page.tsx` - Update all API calls

### Customer Pages (if applicable)
- [ ] `src/app/(customer)/customer/layout.tsx` - Add CsrfProvider
- [ ] Update any customer API calls

---

## Rollback Plan

If issues occur:

1. **Remove CSRF Provider** from layouts
2. **Revert API calls** to use plain `fetch`
3. **Comment out CSRF middleware** in `src/middleware.ts`:
   ```tsx
   // const csrfCheck = await csrfProtection(req)
   // if (csrfCheck) return csrfCheck
   ```
4. **Restart server**

---

**Integration Guide Version:** 1.0  
**Last Updated:** 17 Januari 2026
