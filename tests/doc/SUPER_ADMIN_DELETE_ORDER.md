# Super Admin - Delete Order Feature

## Overview
Implementasi fitur hapus order untuk Super Admin. Fitur ini memungkinkan Super Admin untuk menghapus order customer secara permanen dari sistem, baik satu per satu maupun secara masal (bulk delete).

## Security
- **Role-Based Access Control (RBAC)**: Hanya user dengan role `SUPER_ADMIN` yang dapat menghapus order
- **Backend Validation**: API endpoint melakukan validasi role di server-side untuk mencegah unauthorized access
- **Frontend Conditional Rendering**: Tombol hapus hanya muncul untuk Super Admin

## Changes Made

### 1. Backend API - DELETE Endpoint
**File**: `src/app/api/admin/orders/[id]/route.ts`

Menambahkan DELETE method yang:
- Memvalidasi bahwa user adalah SUPER_ADMIN
- Menghapus order items terlebih dahulu (foreign key constraint)
- Menghapus order dari database
- Mengembalikan konfirmasi dengan order number yang dihapus

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
)
```

### 2. Frontend UI - Orders Page
**File**: `src/app/(admin)/admin/sales/orders/page.tsx`

Menambahkan:
- **Delete Button**: Tombol "Hapus Order" di dropdown menu individual order (hanya untuk SUPER_ADMIN)
- **Bulk Delete Button**: Tombol "Hapus Semua (X)" di dropdown menu bulk actions (hanya untuk SUPER_ADMIN)
- **Confirmation Dialog**: Dialog konfirmasi sebelum menghapus order (mendukung single dan bulk delete)
- **Loading State**: Indikator loading saat proses penghapusan
- **Error Handling**: Toast notification untuk sukses/gagal dengan counter untuk bulk delete

## User Flow

### Single Order Delete
1. **Super Admin** membuka halaman Orders (`/admin/sales/orders`)
2. Klik icon **More (⋯)** pada order yang ingin dihapus
3. Pilih **"Hapus Order"** dari dropdown menu (dengan icon trash merah)
4. Dialog konfirmasi muncul dengan peringatan:
   - Menampilkan order number
   - Peringatan bahwa tindakan tidak dapat dibatalkan
   - Informasi bahwa semua data akan dihapus permanen
5. Klik **"Ya, Hapus Order"** untuk konfirmasi
6. Order dan semua item terkait dihapus dari database
7. Toast notification sukses muncul
8. Daftar order di-refresh otomatis

### Bulk Delete (Hapus Masal)
1. **Super Admin** membuka halaman Orders (`/admin/sales/orders`)
2. **Centang checkbox** pada beberapa order yang ingin dihapus
3. Klik icon **More (⋯)** di bagian filter (muncul saat ada order yang dipilih)
4. Pilih **"Hapus Semua (X)"** dari dropdown menu (dengan icon trash merah)
   - X = jumlah order yang dipilih
5. Dialog konfirmasi muncul dengan peringatan:
   - Menampilkan jumlah order yang akan dihapus
   - Peringatan bahwa tindakan tidak dapat dibatalkan
   - Informasi bahwa semua data akan dihapus permanen
6. Klik **"Ya, Hapus X Order"** untuk konfirmasi
7. Semua order yang dipilih dihapus satu per satu
8. Toast notification menampilkan hasil:
   - Jumlah order yang berhasil dihapus
   - Jumlah order yang gagal dihapus (jika ada)
9. Daftar order di-refresh otomatis
10. Seleksi di-clear otomatis

## Technical Details

### Database Operations
1. Delete `order_items` where `orderId = {id}`
2. Delete `orders` where `id = {id}`

### Error Handling
- 403 Forbidden: Jika user bukan SUPER_ADMIN
- 404 Not Found: Jika order tidak ditemukan
- 500 Internal Server Error: Jika terjadi error database

### UI Components Used
- `Dialog` - Confirmation modal (supports both single and bulk delete)
- `DropdownMenu` - Action menu (individual and bulk actions)
- `Button` - Delete action button
- `Checkbox` - For selecting multiple orders
- `Toast` - Success/error notifications
- `Trash2` icon - Delete indicator

## Security Considerations

✅ **Backend validation** - API tidak bergantung pada frontend
✅ **Role check** - Hanya SUPER_ADMIN yang dapat delete
✅ **Confirmation dialog** - Mencegah accidental deletion
✅ **Audit trail** - Console logs untuk tracking
✅ **Foreign key handling** - Order items dihapus terlebih dahulu

## Testing Checklist

### Single Delete
- [ ] Login sebagai SUPER_ADMIN
- [ ] Verifikasi tombol "Hapus Order" muncul di dropdown
- [ ] Klik "Hapus Order" dan verifikasi dialog konfirmasi muncul
- [ ] Klik "Batal" dan verifikasi dialog tertutup tanpa menghapus
- [ ] Klik "Ya, Hapus Order" dan verifikasi order terhapus
- [ ] Verifikasi toast notification sukses muncul
- [ ] Verifikasi order hilang dari daftar
- [ ] Test dengan order yang memiliki banyak items

### Bulk Delete
- [ ] Login sebagai SUPER_ADMIN
- [ ] Centang 2-3 order dari daftar
- [ ] Verifikasi tombol bulk action (⋯) muncul
- [ ] Klik tombol bulk action dan verifikasi "Hapus Semua (X)" muncul
- [ ] Klik "Hapus Semua" dan verifikasi dialog konfirmasi muncul
- [ ] Verifikasi dialog menampilkan jumlah order yang benar
- [ ] Klik "Batal" dan verifikasi dialog tertutup tanpa menghapus
- [ ] Klik "Ya, Hapus X Order" dan verifikasi semua order terhapus
- [ ] Verifikasi toast notification menampilkan jumlah yang benar
- [ ] Verifikasi semua order hilang dari daftar
- [ ] Verifikasi seleksi di-clear otomatis
- [ ] Test dengan jumlah order yang banyak (10+)

### Permission Testing
- [ ] Login sebagai ADMIN (bukan SUPER_ADMIN)
- [ ] Verifikasi tombol "Hapus Order" TIDAK muncul di dropdown
- [ ] Centang beberapa order
- [ ] Verifikasi "Hapus Semua" TIDAK muncul di bulk actions
- [ ] Test error handling (network error, dll)

## Notes

- Fitur ini **permanent deletion** - tidak ada soft delete
- Order yang sudah dihapus tidak dapat di-recover
- Pertimbangkan untuk menambahkan audit log di masa depan
- Mungkin perlu menambahkan export/backup sebelum delete untuk compliance
