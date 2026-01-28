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

    // Parse dimensions & Weight
    const desc = product.description || '';
    let length = '0', width = '0', height = '0', weight = '1';

    // 1. Try to get from Specifications (Most Accurate)
    try {
        const specs = product.specifications 
            ? (typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications)
            : {};
        
        // Keys found in Shopee: "Panjang", "Lebar", "Tinggi", "Berat Produk"
        const p = specs['Panjang'] || specs['Length'] || '';
        const l = specs['Lebar'] || specs['Width'] || '';
        const t = specs['Tinggi'] || specs['Height'] || '';
        const b = specs['Berat Produk'] || specs['Berat'] || specs['Weight'] || '';

        // Helper to extract numbers
        const cleanVal = (val: string) => val ? (val.match(/\d+/) || ['0'])[0] : '0';
        const cleanWeight = (val: string) => {
            if (!val) return '1';
            const num = val.match(/([\d,\.]+)/);
            if (!num) return '1';
            let valNum = parseFloat(num[1].replace(',', '.'));
            // Convert grams to kg if labeled 'g' or 'gr'
            if (/gr|gram/i.test(val) && !/kg/i.test(val)) valNum = valNum / 1000;
            return Math.ceil(valNum).toString();
        }

        if (p) length = cleanVal(p);
        if (l) width = cleanVal(l);
        if (t) height = cleanVal(t);
        if (b) weight = cleanWeight(b);
    } catch (e) {
        console.error("Error parsing specs for dimensions", e);
    }

    // 2. Fallback to Description Pattern Matching if dimensions are still 0
    if (length === '0' && width === '0' && height === '0') {
        const dimsMatch = desc.match(/(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)/);
        if (dimsMatch) {
            length = dimsMatch[1];
            width = dimsMatch[2];
            height = dimsMatch[3];
        } else {
            const pMatch = desc.match(/[Pp](?:anjang)?\s*[:.]?\s*(\d+)/);
            const lMatch = desc.match(/[Ll](?:ebar)?\s*[:.]?\s*(\d+)/);
            const tMatch = desc.match(/[Tt](?:inggi)?\s*[:.]?\s*(\d+)/);
        
            if (pMatch) length = pMatch[1];
            if (lMatch) width = lMatch[1];
            if (tMatch) height = tMatch[1];
        }
    }

    // Extract colors or generic variants
    let initialColors = '';
    try {
        const rawVariants = product.variants ? (Array.isArray(product.variants) ? product.variants : JSON.parse(product.variants as unknown as string)) : [];
        
        // Filter out junk variants (Chat, Favorite, etc) - failsafe for existing bad data
        const variants = rawVariants.filter((v: any) => {
             const labelBad = /Favorit|Favorite|Share|Bagikan|Chat|Percakapan|Beli|Keranjang/i.test(v.name || '');
             const optionsBad = v.options?.some((opt: string) => /Chat Sekarang|Beli Sekarang|Masukkan Keranjang/i.test(opt));
             return !labelBad && !optionsBad;
        });

        if (variants.length > 0) {
            // Prioritize Color/Warna variants
            const colorVariant = variants.find((v: any) => /Warna|Color|Variasi/i.test(v.name));
            if (colorVariant?.options) {
                initialColors = colorVariant.options.join(', ');
            } else {
                // If no color variant found, take the first variant available (e.g. "Ukuran", "Daun Pintu")
                // This ensures we populate the variants field with something relevant
                initialColors = variants[0].options?.join(', ') || '';
            }
        }
    } catch (e) {
        console.error('Error parsing variants for import dialog:', e);
    }

    setEditData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      categoryId: matchedCategory?.id || '',
      stockCount: '10',
      colors: initialColors,
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

      {/* Table - Responsive Container */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col w-full">
        <div className="bg-white rounded-lg border w-full flex-1 flex flex-col overflow-hidden shadow-sm">
           {/* Header - Fixed */}
           <div className="bg-stone-50 border-b z-10">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40px] px-2 text-center h-10">
                      <Checkbox 
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[60px] px-2 h-10">Image</TableHead>
                    <TableHead className="px-4 h-10">Produk</TableHead>
                    <TableHead className="w-[90px] px-2 h-10">Source</TableHead>
                    <TableHead className="w-[120px] px-2 h-10">Detail</TableHead>
                    <TableHead className="w-[110px] px-2 text-right h-10">Harga</TableHead>
                    <TableHead className="w-[90px] px-2 text-center h-10">Status</TableHead>
                    <TableHead className="w-[90px] px-2 text-center h-10">Tanggal</TableHead>
                    <TableHead className="w-[80px] px-2 text-right h-10">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
           </div>
           
           {/* Body - Scrollable */}
           <div className="overflow-y-auto flex-1 p-0">
             <Table>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-stone-400" />
                        <span className="text-stone-500">Loading products...</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center text-stone-400">
                        <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>Tidak ada produk ditemukan.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(product => (
                      <TableRow key={product.id} className="group hover:bg-stone-50 transition-colors">
                        <TableCell className="w-[40px] px-2 text-center">
                          <Checkbox 
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleSelectProduct(product.id)}
                          />
                        </TableCell>
                        <TableCell className="w-[60px] px-2 py-3">
                          <div className="relative w-10 h-10 bg-stone-100 rounded overflow-hidden border border-stone-200 shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={JSON.stringify(product.name)}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}
                            {product.images && product.images.length > 1 && (
                              <div className="absolute bottom-0 right-0 left-0 bg-black/50 text-white text-[8px] font-medium text-center">
                                +{product.images.length - 1}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <div className="max-w-[400px] xl:max-w-none grid gap-1">
                            <p className="font-medium text-sm text-stone-900 line-clamp-2 leading-snug" title={product.name}>
                              {product.name}
                            </p>
                            {product.sourceUrl && (
                              <a
                                href={product.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 w-fit"
                              >
                                Lihat Link Asli <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[90px] px-2 align-top py-3">
                          <Badge className={SOURCE_COLORS[product.source] || 'bg-gray-100'} variant="secondary">
                            {SOURCE_ICONS[product.source]} <span className="ml-1 capitalize">{product.source}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[120px] px-2 align-top py-3">
                           <div className="text-xs text-stone-500 max-h-[60px] overflow-hidden">
                            {product.variants && (Array.isArray(product.variants) ? product.variants : JSON.parse(product.variants as unknown as string || '[]')).length > 0 ? (
                               <div className="space-y-1">
                                  {(Array.isArray(product.variants) ? product.variants : JSON.parse(product.variants as unknown as string || '[]')).slice(0, 2).map((v: any, i: number) => (
                                     <div key={i} className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px] truncate border border-stone-200">
                                        {v.name}: {v.options?.length}
                                     </div>
                                  ))}
                                  {(Array.isArray(product.variants) ? product.variants : JSON.parse(product.variants as unknown as string || '[]')).length > 2 && (
                                    <span className="text-[9px] text-stone-400 pl-1">+ more</span>
                                  )}
                               </div>
                            ) : '-'}
                           </div>
                        </TableCell>
                        <TableCell className="w-[110px] px-2 text-right align-top py-3 font-mono text-sm">
                          {product.price ? `Rp${(product.price / 1000).toFixed(0)}rb` : '-'}
                        </TableCell>
                        <TableCell className="w-[90px] px-2 text-center align-top py-3">
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border
                            ${product.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              product.status === 'IMPORTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              'bg-rose-50 text-rose-700 border-rose-200'}
                          `}>
                            {product.status}
                          </span>
                        </TableCell>
                        <TableCell className="w-[90px] px-2 text-center text-xs text-stone-500 align-top py-3">
                          {new Date(product.scrapedAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </TableCell>
                        <TableCell className="w-[80px] px-2 text-right align-top py-3">
                          <div className="flex items-center justify-end gap-1">
                            {product.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => openImportDialog(product)}
                                title="Import"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
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
