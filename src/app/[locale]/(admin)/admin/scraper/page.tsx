'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Search, 
  Trash2, 
  Check, 
  X, 
  ExternalLink,
  Download,
  Package,
  ShoppingBag,
  Filter,
  Pencil
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface ScrapedProduct {
  id: string
  source: string
  sourceUrl: string | null
  sourceProductId: string | null
  name: string
  description: string | null
  price: number | null
  originalPrice: number | null
  images: string[]
  category: string | null
  variants: any[]
  specifications: Record<string, string>
  status: string
  scrapedAt: string
  scrapedBy?: {
    name: string | null
    email: string
  }
}

const SOURCE_COLORS: Record<string, string> = {
  shopee: 'bg-orange-100 text-orange-700',
  tokopedia: 'bg-green-100 text-green-700',
  tiktok: 'bg-slate-100 text-slate-700'
}

const SOURCE_ICONS: Record<string, string> = {
  shopee: '🛒',
  tokopedia: '🟢',
  tiktok: '🎵'
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ScraperPage() {
  const [products, setProducts] = useState<ScrapedProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [selectedProduct, setSelectedProduct] = useState<ScrapedProduct | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stockCount: '10',
    colors: '',
    weight: '0',
    length: '0',
    width: '0',
    height: '0'
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        source: sourceFilter
      })
      const res = await fetch(`/api/scraper/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/catalog/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories')
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleImport = async () => {
    if (!selectedProduct) return

    setImporting(true)
    try {
      const res = await fetch('/api/scraper/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          action: 'import',
          name: editData.name,
          images: selectedProduct.images,
          description: editData.description,
          price: editData.price ? parseFloat(editData.price) : selectedProduct.price,
          categoryId: editData.categoryId || null,
          stockCount: editData.stockCount,
          colors: editData.colors,
          weight: editData.weight,
          length: editData.length,
          width: editData.width,
          height: editData.height
        })
      })

      if (res.ok) {
        toast.success('Produk berhasil diimport!')
        setShowImportDialog(false)
        setSelectedProduct(null)
        fetchProducts()
      } else {
        toast.error('Gagal import produk')
      }
    } catch (error) {
      toast.error('Error import produk')
    } finally {
      setImporting(false)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch('/api/scraper/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject' })
      })

      if (res.ok) {
        toast.success('Produk ditolak')
        fetchProducts()
      }
    } catch (error) {
      toast.error('Gagal menolak produk')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/scraper/products?id=${deleteId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Produk dihapus')
        setDeleteId(null)
        setShowDeleteDialog(false)
        fetchProducts()
      }
    } catch (error) {
      toast.error('Gagal hapus produk')
    }
  }

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedProducts).map(id =>
        fetch(`/api/scraper/products?id=${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      toast.success(`${selectedProducts.size} produk berhasil dihapus`)
      setSelectedProducts(new Set())
      setShowBulkDeleteDialog(false)
      fetchProducts()
    } catch (error) {
      toast.error('Gagal hapus produk')
    }
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProducts(newSelected)
  }

  const openImportDialog = (product: ScrapedProduct) => {
    setSelectedProduct(product)
    // Try to find matching category
    const matchedCategory = categories.find(c => 
      c.name.toLowerCase().includes(product.category?.toLowerCase() || '') ||
      product.category?.toLowerCase().includes(c.name.toLowerCase())
    )

    // Parse dimensions
    const desc = product.description || '';
    let length = '0', width = '0', height = '0';
    
    // Pattern 1: 120x50x200
    const dimsMatch = desc.match(/(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)/);
    if (dimsMatch) {
      length = dimsMatch[1];
      width = dimsMatch[2];
      height = dimsMatch[3];
    } else {
      // Pattern 2: P 120 L 50 T 200
      const pMatch = desc.match(/[Pp](?:anjang)?\s*[:.]?\s*(\d+)/);
      const lMatch = desc.match(/[Ll](?:ebar)?\s*[:.]?\s*(\d+)/);
      const tMatch = desc.match(/[Tt](?:inggi)?\s*[:.]?\s*(\d+)/);
      
      if (pMatch) length = pMatch[1];
      if (lMatch) width = lMatch[1];
      if (tMatch) height = tMatch[1];
    }

    // Extract colors
    let initialColors = '';
    try {
        const variants = product.variants ? (Array.isArray(product.variants) ? product.variants : JSON.parse(product.variants as unknown as string)) : [];
        const colorVariant = variants.find((v: any) => /Warna|Color|Variasi/i.test(v.name));
        if (colorVariant?.options) initialColors = colorVariant.options.join(', ');
    } catch (e) {}

    setEditData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      categoryId: matchedCategory?.id || '',
      stockCount: '10',
      weight: '10', // Default
      length,
      width,
      height
    })
    setShowImportDialog(true)
  }

  const openEditDialog = (product: ScrapedProduct) => {
    setSelectedProduct(product)
    setEditData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      categoryId: ''
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedProduct) return

    setSaving(true)
    try {
      const res = await fetch('/api/scraper/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          name: editData.name,
          description: editData.description,
          price: editData.price ? parseFloat(editData.price) : null
        })
      })

      if (res.ok) {
        toast.success('Produk berhasil diupdate!')
        setShowEditDialog(false)
        setSelectedProduct(null)
        fetchProducts()
      } else {
        toast.error('Gagal update produk')
      }
    } catch (error) {
      toast.error('Error update produk')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: products.length,
    pending: products.filter(p => p.status === 'PENDING').length,
    imported: products.filter(p => p.status === 'IMPORTED').length,
    rejected: products.filter(p => p.status === 'REJECTED').length
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-stone-900">🛒 Marketplace Scraper</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {stats.pending} Pending
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {stats.imported} Imported
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchProducts}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/harkat-scraper-extension" download>
                <Download className="w-4 h-4 mr-2" />
                Download Extension
              </a>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-2 bg-stone-50">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Cari produk..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IMPORTED">Imported</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Source</SelectItem>
              <SelectItem value="shopee">🛒 Shopee</SelectItem>
              <SelectItem value="tokopedia">🟢 Tokopedia</SelectItem>
              <SelectItem value="tiktok">🎵 TikTok</SelectItem>
            </SelectContent>
          </Select>
          {selectedProducts.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus {selectedProducts.size} Produk
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-stone-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    Tidak ada produk. Install extension dan mulai scraping!
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative w-12 h-12 bg-stone-100 rounded overflow-hidden group">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        {product.images && product.images.length > 1 && (
                          <div className="absolute bottom-0 right-0 left-0 bg-black/60 text-white text-[9px] font-medium text-center py-0.5">
                            +{product.images.length - 1}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="font-medium text-stone-900 truncate">{product.name}</p>
                        {product.sourceUrl && (
                          <a
                            href={product.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Lihat asli <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={SOURCE_COLORS[product.source] || 'bg-gray-100'}>
                        {SOURCE_ICONS[product.source]} {product.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.variants && (Array.isArray(product.variants) ? product.variants : JSON.parse(product.variants as unknown as string || '[]')).length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {(Array.isArray(product.variants) ? product.variants : JSON.parse(product.variants as unknown as string || '[]')).map((v: any, i: number) => (
                             <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded w-fit">
                                {v.name}: {v.options?.length} opsi
                             </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.price ? `Rp ${product.price.toLocaleString('id-ID')}` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          product.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : product.status === 'IMPORTED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-stone-500">
                      {new Date(product.scrapedAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {product.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => openImportDialog(product)}
                              title="Import ke Katalog"
                            >
                              <Check className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(product.id)}
                              title="Tolak"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setDeleteId(product.id)
                          setShowDeleteDialog(true)
                        }}
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Import Produk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 flex-1 overflow-y-auto pr-1">
            {selectedProduct?.images && selectedProduct.images.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-stone-500">
                  {selectedProduct.images.length} Gambar Ditemukan
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-lg border">
                  {(selectedProduct.images as unknown as string[]).map((img, i) => (
                    <div key={i} className="relative aspect-square bg-white rounded-md overflow-hidden border border-stone-200 group">
                      <img
                        src={img}
                        alt={`Product ${i+1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                      <button
                        onClick={() => {
                           const newImages = [...(selectedProduct.images as unknown as string[])]
                           newImages.splice(i, 1)
                           setSelectedProduct({ ...selectedProduct, images: newImages as any })
                        }}
                        type="button"
                        className="absolute top-0.5 right-0.5 bg-red-500/90 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus gambar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Nama Produk</Label>
              <Input
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editData.description}
                onChange={e => setEditData({ ...editData, description: e.target.value })}
                className="h-[120px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editData.price}
                  onChange={e => setEditData({ ...editData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stok Awal (Qty)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editData.stockCount}
                  onChange={e => setEditData({ ...editData, stockCount: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Kategori</Label>
                <Select 
                  value={editData.categoryId} 
                  onValueChange={v => setEditData({ ...editData, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            </div>

            {/* Colors Input */}
            <div className="space-y-2 mt-2">
               <Label>Varian Warna</Label>
               <Input 
                  placeholder="Contoh: Merah, Biru, Hijau (Pisahkan dengan koma)"
                  value={editData.colors}
                  onChange={e => setEditData({...editData, colors: e.target.value})}
               />
               <p className="text-[10px] text-stone-500">
                  *Masukkan varian warna yang dipisahkan koma. Kosongkan jika tidak ada varian.
               </p>
            </div>
            
            {/* Dimensions */}
            <div className="grid grid-cols-4 gap-2">
               <div className="space-y-1">
                 <Label className="text-xs">Panjang</Label>
                 <div className="relative">
                   <Input 
                      type="number" 
                      min="0"
                      value={editData.length} 
                      onChange={e => setEditData({...editData, length: e.target.value})}
                      className="h-8 text-sm"
                   />
                   <span className="absolute right-2 top-2 text-xs text-stone-400">cm</span>
                 </div>
               </div>
               <div className="space-y-1">
                 <Label className="text-xs">Lebar</Label>
                 <div className="relative">
                   <Input 
                      type="number" 
                      min="0"
                      value={editData.width} 
                      onChange={e => setEditData({...editData, width: e.target.value})}
                      className="h-8 text-sm"
                   />
                   <span className="absolute right-2 top-2 text-xs text-stone-400">cm</span>
                 </div>
               </div>
               <div className="space-y-1">
                 <Label className="text-xs">Tinggi</Label>
                 <div className="relative">
                   <Input 
                      type="number" 
                      min="0"
                      value={editData.height} 
                      onChange={e => setEditData({...editData, height: e.target.value})}
                      className="h-8 text-sm"
                   />
                   <span className="absolute right-2 top-2 text-xs text-stone-400">cm</span>
                 </div>
               </div>
               <div className="space-y-1">
                 <Label className="text-xs">Berat</Label>
                 <div className="relative">
                   <Input 
                      type="number" 
                      min="0"
                      value={editData.weight} 
                      onChange={e => setEditData({...editData, weight: e.target.value})}
                      className="h-8 text-sm"
                   />
                   <span className="absolute right-2 top-2 text-xs text-stone-400">kg</span>
                 </div>
               </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Import ke Katalog
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Produk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 flex-1 overflow-y-auto pr-1">
            {selectedProduct?.images && selectedProduct.images.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-stone-500">
                  {selectedProduct.images.length} Gambar Ditemukan
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-lg border">
                  {(selectedProduct.images as unknown as string[]).map((img, i) => (
                    <div key={i} className="relative aspect-square bg-white rounded-md overflow-hidden border border-stone-200 group">
                      <img
                        src={img}
                        alt={`Product ${i+1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Nama Produk</Label>
              <Input
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editData.description}
                onChange={e => setEditData({ ...editData, description: e.target.value })}
                className="h-[120px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Harga (Rp)</Label>
              <Input
                type="number"
                value={editData.price}
                onChange={e => setEditData({ ...editData, price: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Data produk yang di-scrape akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedProducts.size} Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua produk yang dipilih akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Hapus {selectedProducts.size} Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
