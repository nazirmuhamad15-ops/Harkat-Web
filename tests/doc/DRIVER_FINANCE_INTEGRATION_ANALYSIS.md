# 🔍 Analisis Integrasi Driver & Finance Dashboard
**Tanggal Analisis**: 17 Januari 2026  
**Scope**: Driver App ↔ Finance Dashboard Integration

---

## 📊 Executive Summary

| Aspek | Status | Catatan |
|-------|--------|---------|
| **1. Fuel Logs → Net Profit** | ⚠️ **TIDAK TERINTEGRASI** | Fuel cost belum mengurangi profit per-order |
| **2. e-POD Image Compression** | ✅ **SUDAH DIKOMPRESI** | JPEG 60% quality |
| **3. GPS Tracking** | ✅ **TERSIMPAN** | Update setiap 120s ke DB |

---

## 1️⃣ Fuel Logs & Net Profit Integration

### ❌ **FINDING: TIDAK TERINTEGRASI**

#### **Current Implementation:**

**File**: `src/app/api/driver/fuel/route.ts`
```typescript
const fuelLog = await db.fuelLog.create({
    data: {
        vehicleId,
        driverId: session.user.id,
        liters: parseFloat(liters),
        cost: parseFloat(cost),  // ✅ Tersimpan di DB
        odometer: parseInt(odometer),
        receiptUrl,
        notes
    }
})
```

**Database Schema** (`prisma/schema.prisma`):
```prisma
model FuelLog {
  id          String   @id @default(cuid())
  vehicleId   String
  driverId    String
  liters      Float
  cost        Float    // ✅ Ada field cost
  odometer    Int
  receiptUrl  String?
  notes       String?
  createdAt   DateTime @default(now())

  vehicle     Vehicle @relation(...)
  driver      User    @relation(...)
}
```

**Finance Dashboard** (`src/app/api/admin/dashboard/stats/route.ts`):
```typescript
// ✅ SUDAH BENAR: Total fuel cost diambil dari DB
const totalFuelCosts = await db.fuelLog.aggregate({
  _sum: {
    cost: true
  }
})
const totalFuelCost = totalFuelCosts._sum.cost || 0

// ✅ SUDAH BENAR: Net Profit dikurangi fuel cost
const netProfit = totalRevenue - totalHPP - totalShipping - totalGatewayFee - totalFuelCost
```

### ⚠️ **ISSUE DITEMUKAN:**

**Fuel cost TIDAK dikaitkan dengan order tertentu!**

- ✅ Fuel cost **tersimpan** di tabel `fuel_logs`
- ✅ Total fuel cost **mengurangi** Net Profit global
- ❌ Fuel cost **TIDAK** mengurangi profit **per-order** tertentu
- ❌ Tidak ada relasi `orderId` di tabel `FuelLog`

### 📋 **Analisis:**

| Aspek | Implementasi Saat Ini | Seharusnya |
|-------|------------------------|------------|
| **Fuel Cost Storage** | ✅ Tersimpan di `fuel_logs` | ✅ Correct |
| **Global Net Profit** | ✅ Dikurangi total fuel cost | ✅ Correct |
| **Per-Order Profit** | ❌ Tidak ada relasi ke order | ⚠️ **MISSING** |
| **Driver Task Link** | ❌ Tidak ada `orderId` di FuelLog | ⚠️ **MISSING** |

### 🔧 **REKOMENDASI PERBAIKAN:**

#### **Option 1: Link Fuel Log ke Order (Recommended)**
Tambahkan relasi `orderId` ke tabel `FuelLog`:

```prisma
model FuelLog {
  id          String   @id @default(cuid())
  vehicleId   String
  driverId    String
  orderId     String?  // ✅ NEW: Link to specific order/delivery
  liters      Float
  cost        Float
  odometer    Int
  receiptUrl  String?
  notes       String?
  createdAt   DateTime @default(now())

  vehicle     Vehicle @relation(...)
  driver      User    @relation(...)
  order       Order?  @relation(fields: [orderId], references: [id]) // ✅ NEW
}
```

**UI Update** (`src/app/(driver)/driver/fuel/page.tsx`):
```typescript
// Add order selection to fuel form
const [formData, setFormData] = useState({
    vehicleId: '',
    orderId: '',     // ✅ NEW: Select which delivery this fuel is for
    liters: '',
    cost: '',
    odometer: '',
    notes: '',
    receiptUrl: ''
})
```

#### **Option 2: Allocate Fuel Cost Proportionally**
Jika fuel cost tidak bisa di-link ke order spesifik, alokasikan secara proporsional:

```typescript
// Calculate fuel cost per order based on distance/weight
const fuelCostPerOrder = (totalFuelCost / totalOrders) * order.weight_factor
```

---

## 2️⃣ e-POD Image Compression

### ✅ **FINDING: SUDAH DIKOMPRESI**

#### **Implementation:**

**File**: `src/components/driver/camera-capture.tsx`
```typescript
const capturePhoto = () => {
  if (videoRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      // ✅ COMPRESSION: JPEG with 60% quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  }
};
```

**Upload Flow**:
```
Driver Capture Photo
  ↓
JPEG Compression (60% quality)  ✅
  ↓
Base64 Encoding
  ↓
Send to API (/api/driver/tasks/[id]/complete)
  ↓
Store in DB (deliveryPhotoUrl)  ⚠️ Base64 in DB (Not R2)
```

### ⚠️ **ISSUE DITEMUKAN:**

**File**: `src/app/api/driver/tasks/[id]/complete/route.ts`
```typescript
const updatedTask = await db.driverTask.update({
    where: { id: taskId },
    data: {
        status: 'DELIVERED',
        // ⚠️ STORING BASE64 DIRECTLY IN DATABASE
        deliveryPhotoUrl: photo,  // Base64 string (can be 100KB+)
        signatureUrl: signature,  // Base64 string
        deliveryNotes: notes,
        deliveredAt: new Date(timestamp),
    }
})
```

### 📊 **Analysis:**

| Aspek | Status | Detail |
|-------|--------|--------|
| **Client-Side Compression** | ✅ **DONE** | JPEG 60% quality |
| **Upload to R2** | ❌ **NOT IMPLEMENTED** | Storing Base64 in DB instead |
| **Database Size** | ⚠️ **CONCERN** | Base64 increases size by ~33% |

### 🔧 **REKOMENDASI:**

#### **Upload to Cloudflare R2** (Production-Ready):

```typescript
// src/app/api/driver/tasks/[id]/complete/route.ts
import { uploadToR2 } from '@/lib/r2'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { photo, signature, notes, timestamp } = await request.json()
  
  // ✅ Convert Base64 to Buffer
  const photoBuffer = Buffer.from(photo.split(',')[1], 'base64')
  const signatureBuffer = Buffer.from(signature.split(',')[1], 'base64')
  
  // ✅ Upload to R2
  const photoUrl = await uploadToR2(
    photoBuffer, 
    `pod/${taskId}-${Date.now()}.jpg`, 
    'image/jpeg'
  )
  const signatureUrl = await uploadToR2(
    signatureBuffer, 
    `signatures/${taskId}-${Date.now()}.png`, 
    'image/png'
  )
  
  // ✅ Store R2 URLs (not Base64)
  const updatedTask = await db.driverTask.update({
    where: { id: taskId },
    data: {
      deliveryPhotoUrl: photoUrl,  // ✅ R2 URL
      signatureUrl: signatureUrl,  // ✅ R2 URL
      deliveryNotes: notes,
      deliveredAt: new Date(timestamp),
    }
  })
}
```

---

## 3️⃣ GPS Tracking Integration

### ✅ **FINDING: TERSIMPAN DENGAN BENAR**

#### **Implementation:**

**File**: `src/app/api/driver/gps/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const { lat, lng } = await request.json()
  
  // ✅ Find active task for this driver
  const activeTask = await db.driverTask.findFirst({
    where: {
      driverId: session.user.id,
      status: {
        in: ['PICKED_UP', 'IN_TRANSIT'],  // ✅ Only active deliveries
      },
    },
  })

  if (activeTask) {
    // ✅ Update GPS coordinates
    await db.driverTask.update({
      where: { id: activeTask.id },
      data: {
        currentLat: lat,           // ✅ Stored
        currentLng: lng,           // ✅ Stored
        lastGpsPing: new Date(),   // ✅ Timestamp
      },
    })
  }
  
  return NextResponse.json({ success: true })
}
```

**Database Schema**:
```prisma
model DriverTask {
  id          String      @id @default(cuid())
  orderId     String
  driverId    String
  status      TaskStatus  @default(ASSIGNED)
  
  // ✅ GPS Tracking Fields
  currentLat  Float?
  currentLng  Float?
  lastGpsPing DateTime?
  
  // e-POD Fields
  deliveryPhotoUrl String?
  signatureUrl     String?
  deliveredAt      DateTime?
  deliveryNotes    String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  order  Order  @relation(...)
  driver User   @relation(...)
}
```

### 📊 **GPS Update Flow:**

```
Driver App (Every 120s)
  ↓
navigator.geolocation.getCurrentPosition()
  ↓
POST /api/driver/gps
  { lat: -6.xxx, lng: 106.xxx }
  ↓
Find Active Task (PICKED_UP / IN_TRANSIT)
  ↓
Update DriverTask:
  - currentLat
  - currentLng
  - lastGpsPing
  ↓
✅ Saved to Database
```

### ⚠️ **ISSUE: Tracking Page Not Showing GPS**

**File**: `src/app/track/page.tsx`

```typescript
// ❌ MISSING: No GPS coordinates displayed
export default function TrackOrder() {
  const [orderData, setOrderData] = useState<OrderTracking | null>(null)
  
  // Fetch order data
  const response = await fetch(`/api/public/track/${trackingNumber}`)
  const data = await response.json()
  setOrderData(data.data)
  
  // ❌ No map component
  // ❌ No driver location display
}
```

**API Response** (`/api/public/track/[trackingNumber]`):
```typescript
// ❌ MISSING: GPS coordinates not included in response
interface OrderTracking {
  id: string
  orderNumber: string
  status: string
  // ... other fields
  // ❌ MISSING: driverLocation: { lat, lng, lastUpdate }
}
```

### 🔧 **REKOMENDASI PERBAIKAN:**

#### **1. Update Track API to Include GPS**

```typescript
// src/app/api/public/track/[trackingNumber]/route.ts
export async function GET(request: NextRequest, { params }: { params: { trackingNumber: string } }) {
  const order = await db.order.findFirst({
    where: { trackingNumber: params.trackingNumber },
    include: {
      orderItems: { include: { product: true } },
      // ✅ NEW: Include driver task with GPS
      driverTasks: {
        where: {
          status: { in: ['PICKED_UP', 'IN_TRANSIT'] }
        },
        select: {
          currentLat: true,
          currentLng: true,
          lastGpsPing: true,
          status: true
        }
      }
    }
  })
  
  return NextResponse.json({
    data: {
      ...order,
      // ✅ NEW: Driver location
      driverLocation: order.driverTasks[0] ? {
        lat: order.driverTasks[0].currentLat,
        lng: order.driverTasks[0].currentLng,
        lastUpdate: order.driverTasks[0].lastGpsPing
      } : null
    }
  })
}
```

#### **2. Add Map to Tracking Page**

```typescript
// src/app/track/page.tsx
import { GoogleMap, Marker } from '@react-google-maps/api'

export default function TrackOrder() {
  const [orderData, setOrderData] = useState<OrderTracking | null>(null)
  
  return (
    <div>
      {/* ... existing code ... */}
      
      {/* ✅ NEW: Live Map */}
      {orderData?.driverLocation && (
        <Card>
          <CardHeader>
            <CardTitle>Live Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleMap
              center={{
                lat: orderData.driverLocation.lat,
                lng: orderData.driverLocation.lng
              }}
              zoom={15}
            >
              <Marker 
                position={{
                  lat: orderData.driverLocation.lat,
                  lng: orderData.driverLocation.lng
                }}
                icon="/truck-icon.png"
              />
            </GoogleMap>
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(orderData.driverLocation.lastUpdate).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## 📋 Summary & Action Items

### ✅ **Working Correctly:**
1. ✅ GPS coordinates **tersimpan** di database setiap 120 detik
2. ✅ e-POD photos **dikompresi** (JPEG 60%) sebelum upload
3. ✅ Total fuel cost **mengurangi** global Net Profit

### ⚠️ **Issues Found:**

| Issue | Priority | Impact | Status |
|-------|----------|--------|--------|
| Fuel cost tidak linked ke order spesifik | 🟡 **MEDIUM** | Profit per-order tidak akurat | ⚠️ **NEEDS FIX** |
| e-POD disimpan sebagai Base64 di DB | 🟡 **MEDIUM** | Database bloat | ⚠️ **NEEDS FIX** |
| GPS tidak ditampilkan di `/track` page | 🟡 **MEDIUM** | Customer tidak bisa lihat driver | ⚠️ **NEEDS FIX** |

### 🔧 **Recommended Fixes:**

#### **Priority 1: Link Fuel Cost to Orders**
```sql
-- Add orderId to fuel_logs
ALTER TABLE fuel_logs ADD COLUMN orderId TEXT;
```

#### **Priority 2: Upload e-POD to R2**
```typescript
// Replace Base64 storage with R2 upload
const photoUrl = await uploadToR2(photoBuffer, `pod/${taskId}.jpg`, 'image/jpeg')
```

#### **Priority 3: Display GPS on Tracking Page**
```typescript
// Add Google Maps component to /track page
<GoogleMap center={driverLocation} />
```

---

## 🎯 Conclusion

**Integrasi Driver ↔ Finance:**
- ✅ **Fuel cost** sudah mengurangi **global** Net Profit
- ⚠️ **Fuel cost** belum mengurangi **per-order** profit
- ✅ **GPS tracking** berfungsi dan tersimpan
- ⚠️ **GPS** belum ditampilkan ke customer
- ✅ **e-POD compression** sudah implementasi
- ⚠️ **e-POD storage** masih di database (bukan R2)

**Overall Status**: 🟡 **PARTIALLY IMPLEMENTED**

---

**Prepared by**: Antigravity AI  
**Date**: 2026-01-17
