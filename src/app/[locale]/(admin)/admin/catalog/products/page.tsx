'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  MoreVertical,
  Download,
  RefreshCw,
  Star,
  StarOff,
  Eye,
  EyeOff,
  CheckSquare,
  Filter,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

interface ProductVariant {
  id?: string
  sku: string
  price: number
  costPrice: number
  stockCount: number
  lowStockThreshold: number
  shelfLocation: string
  weight: number
  length: number
  width: number
  height: number
  salesCount?: number
  inStock?: boolean
  attributes?: {
    attributeValue: {
      value: string
      attribute: { name: string }
    }
  }[]
}

interface Product {
  id: string
  name: string
  slug: string
  category: string
  description: string
  status: string
  featured: boolean
  createdAt: string
  images: string | string[]
  variants: ProductVariant[]
}

type StatusFilter = 'all' | 'ACTIVE' | 'DRAFT' | 'lowstock'

export default function ProductsPage() {
  // CSRF Protection
  const { csrfToken } = useCsrf()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [dbCategories, setDbCategories] = useState<{id: string, name: string}[]>([])
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 15

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'living-room',
    description: '',
    featured: false,
    status: 'ACTIVE',
    images: [] as string[],
    sku: '',
    price: '',
    costPrice: '',
    stockCount: '',
    lowStockThreshold: '5',
    shelfLocation: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    color: 'Natural',
    material: 'Teak Wood',
    variants: [] as any[]
  })

  // Bulk Update State
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')

  // Categories from products (for filter) and database
  const categories = ['all', ...new Set(products.map(p => p.category))]

  // Fetch categories from database
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/catalog/categories')
      if (res.ok) {
        const data = await res.json()
        setDbCategories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: searchTerm,
        category: selectedCategory
      })
      const response = await fetch(`/api/admin/products?${query.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setTotalCount(data.pagination.total)
        }
      } else {
        toast.error(`Gagal memuat produk: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, selectedCategory])

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchProducts()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedCategory])

  useEffect(() => {
    fetchProducts()
  }, [currentPage])

  // Filter products by status
  const filteredProducts = products.filter(product => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'lowstock') {
      const v = product.variants[0]
      return v && v.stockCount <= v.lowStockThreshold
    }
    return product.status === statusFilter
  })

  const stats = {
    total: totalCount,
    active: products.filter(p => p.status === 'ACTIVE').length,
    draft: products.filter(p => p.status === 'DRAFT').length,
    lowStock: products.filter(p => {
      const v = p.variants[0]
      return v && v.stockCount <= v.lowStockThreshold
    }).length,
    featured: products.filter(p => p.featured).length
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'living-room',
      description: '',
      featured: false,
      status: 'ACTIVE',
      images: [],
      sku: '',
      price: '',
      costPrice: '',
      stockCount: '',
      lowStockThreshold: '5',
      shelfLocation: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      color: 'Natural',
      material: 'Teak Wood',
      variants: []
    })
    setIsEditing(false)
    setEditId(null)
  }

  const handleStartEdit = (product: Product) => {
    const v = product.variants[0] || {}
    
    let color = ''
    let material = ''
    
    if (v.attributes && Array.isArray(v.attributes)) {
      v.attributes.forEach((attr: any) => {
        // Backend returns flattened { name, value }
        const name = (attr.name || attr.attributeValue?.attribute?.name || '').toLowerCase()
        const value = attr.value || attr.attributeValue?.value
        if (name === 'color' || name === 'warna') color = value
        if (name === 'Material') material = value
      })
    }

    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      featured: product.featured,
      status: product.status,
      images: product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [],
      sku: v.sku || '',
      price: v.price?.toString() || '',
      costPrice: v.costPrice?.toString() || '',
      stockCount: v.stockCount?.toString() || '',
      lowStockThreshold: v.lowStockThreshold?.toString() || '5',
      shelfLocation: v.shelfLocation || '',
      weight: v.weight?.toString() || '',
      length: v.length?.toString() || '',
      width: v.width?.toString() || '',
      height: v.height?.toString() || '',
      color: color,
      material: material,
      variants: product.variants.map(va => ({
         id: va.id,
         sku: va.sku,
         price: va.price,
         stockCount: va.stockCount,
         attributes: va.attributes
      }))
    })
    setEditId(product.id)
    setIsEditing(true)
    setShowAddDialog(true)
  }

  const handleSaveProduct = async () => {
    try {
      if (isEditing && editId) {
        const response = await fetchWithCsrf(
          `/api/admin/products/${editId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              category: formData.category,
              description: formData.description,
              featured: formData.featured,
              status: formData.status,
              images: formData.images,
              sku: formData.sku,
              price: parseFloat(formData.price),
              costPrice: parseFloat(formData.costPrice),
              stockCount: parseInt(formData.stockCount),
              lowStockThreshold: parseInt(formData.lowStockThreshold),
              shelfLocation: formData.shelfLocation,
              weight: parseFloat(formData.weight),
              length: parseFloat(formData.length),
              width: parseFloat(formData.width),
              height: parseFloat(formData.height),
              color: formData.color,
              material: formData.material,
              variants: formData.variants
            })
          },
          csrfToken
        )
        if (response.ok) {
          toast.success('Produk berhasil diupdate')
          setShowAddDialog(false)
          resetForm()
          fetchProducts()
        } else {
          toast.error('Gagal update produk')
        }
      } else {
        const payload = {
          name: formData.name,
          category: formData.category,
          description: formData.description,
          featured: formData.featured,
          status: formData.status,
          images: formData.images.length > 0 ? formData.images : [],
          variants: [
            {
              sku: formData.sku,
              price: formData.price,
              costPrice: formData.costPrice,
              stockCount: formData.stockCount,
              lowStockThreshold: formData.lowStockThreshold,
              shelfLocation: formData.shelfLocation,
              weight: formData.weight,
              length: formData.length,
              width: formData.width,
              height: formData.height,
              attributes: [
                { name: 'Color', value: formData.color },
                { name: 'Material', value: formData.material }
              ]
            }
          ]
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
  
        if (response.ok) {
          toast.success('Produk berhasil dibuat')
          setShowAddDialog(false)
          resetForm()
          fetchProducts()
        } else {
          const err = await response.json()
          toast.error('Gagal menambah produk: ' + (err.details || err.error))
        }
      }
    } catch (error) {
      toast.error('Network error')
    }
  }

  const handleDeleteProduct = async () => {
    if (!deleteId) return
    try {
      const response = await fetchWithCsrf(
        `/api/admin/products/${deleteId}`,
        { method: 'DELETE' },
        csrfToken
      )
      if (response.ok) {
        toast.success('Produk dihapus')
        setDeleteId(null)
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch (error) {
      toast.error('Gagal menghapus produk')
    }
  }

  const toggleFeatured = async (product: Product) => {
    try {
      const response = await fetchWithCsrf(
        `/api/admin/products/${product.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured: !product.featured })
        },
        csrfToken
      )
      if (response.ok) {
        toast.success(product.featured ? 'Produk dihapus dari featured' : 'Produk ditambahkan ke featured')
        fetchProducts()
      }
    } catch {
      toast.error('Gagal update status')
    }
  }

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE'
    try {
      const response = await fetchWithCsrf(
        `/api/admin/products/${product.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        },
        csrfToken
      )
      if (response.ok) {
        toast.success(`Status diubah ke ${newStatus}`)
        fetchProducts()
      }
    } catch {
      toast.error('Gagal update status')
    }
  }

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete') => {
    if (selectedProducts.size === 0) {
      toast.error('Pilih produk terlebih dahulu')
      return
    }

    setBulkActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const productId of selectedProducts) {
      try {
        let response
        if (action === 'delete') {
          response = await fetchWithCsrf(
            `/api/admin/products/${productId}`,
            { method: 'DELETE' },
            csrfToken
          )
        } else {
          const payload: any = {}
          if (action === 'activate') payload.status = 'ACTIVE'
          if (action === 'deactivate') payload.status = 'DRAFT'
          if (action === 'feature') payload.featured = true
          if (action === 'unfeature') payload.featured = false

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
        if (response.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) toast.success(`${successCount} produk berhasil diproses`)
    if (failCount > 0) toast.error(`${failCount} produk gagal diproses`)
    
    setSelectedProducts(new Set())
    fetchProducts()
    setBulkActionLoading(false)
  }

  const applyBulkPrice = () => {
    if (!bulkPrice) return
    const newVars = formData.variants.map(v => ({ ...v, price: bulkPrice }))
    setFormData({ ...formData, variants: newVars })
    toast.success('Harga semua varian diupdate')
  }

  const applyBulkStock = () => {
    if (!bulkStock) return
    const newVars = formData.variants.map(v => ({ ...v, stockCount: bulkStock }))
    setFormData({ ...formData, variants: newVars })
    toast.success('Stok semua varian diupdate')
  }

  const exportToCSV = () => {
    const headers = ['SKU', 'Nama', 'Kategori', 'Harga', 'Stok', 'Status', 'Featured']
    const rows = products.map(p => {
      const v = p.variants[0] || {}
      return [
        v.sku,
        p.name,
        p.category,
        v.price,
        v.stockCount,
        p.status,
        p.featured ? 'Yes' : 'No'
      ]
    })
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Produk diexport')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Compact Header - Single Row Like Orders */}
      <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
        
        {/* Row 1: Title & Actions */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-stone-900 shrink-0">Produk</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchProducts}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={exportToCSV}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
            <Button size="sm" className="h-7 text-xs px-3 bg-stone-900 hover:bg-stone-800" onClick={() => { resetForm(); setShowAddDialog(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Baru
            </Button>
          </div>
        </div>

        {/* Row 2: Tabs & Search & Filters - Like Orders */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-stone-50/50">
          {/* Left: Tabs */}
          <div className="flex items-center gap-1">
            {[
              { value: 'all', label: 'Semua', count: stats.total },
              { value: 'ACTIVE', label: 'Aktif', count: stats.active },
              { value: 'DRAFT', label: 'Draft', count: stats.draft },
              { value: 'lowstock', label: 'Low Stock', count: stats.lowStock },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value as StatusFilter)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === tab.value 
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200' 
                    : 'text-stone-500 hover:bg-white hover:text-stone-700'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                  statusFilter === tab.value ? 'bg-stone-100 text-stone-600' : 'bg-stone-200/50 text-stone-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Right: Search, Filter & Bulk Actions */}
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-white border-stone-200"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white border-stone-200">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {categories.filter(c => c !== 'all').map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProducts.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={bulkActionLoading}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('activate')}><Eye className="w-4 h-4 mr-2" />Set Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}><EyeOff className="w-4 h-4 mr-2" />Set Draft</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('feature')}><Star className="w-4 h-4 mr-2" />Set Featured</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('unfeature')}><StarOff className="w-4 h-4 mr-2" />Remove Featured</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedProducts(new Set())}>Clear ({selectedProducts.size})</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-white relative mx-3 mb-3">
          {/* Fixed Header */}
          <div className="bg-stone-50 border-b z-20 shrink-0">
            <table className="w-full text-sm text-left table-fixed">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[50px] pl-4 py-3">
                    <Checkbox 
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[300px] font-semibold py-3">Produk</TableHead>
                  <TableHead className="w-[120px] font-semibold py-3">SKU</TableHead>
                  <TableHead className="w-[120px] font-semibold py-3">Kategori</TableHead>
                  <TableHead className="w-[80px] font-semibold text-center py-3">Stok</TableHead>
                  <TableHead className="w-[120px] font-semibold text-right py-3">Harga</TableHead>
                  <TableHead className="w-[100px] font-semibold text-center py-3">Status</TableHead>
                  <TableHead className="w-[60px] text-right pr-4 py-3">Aksi</TableHead>
                </TableRow>
              </TableHeader>
            </table>
          </div>

          {/* Scrollable Body */}
          <div className="absolute inset-0 top-[45px] bottom-[52px] overflow-y-auto">
            <table className="w-full text-sm text-left table-fixed">
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
                    Tidak ada produk ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const v = product.variants[0] || {}
                  const isLowStock = v.stockCount <= v.lowStockThreshold
                  const images = product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : []
                  
                  return (
                    <TableRow 
                      key={product.id} 
                      className={`hover:bg-stone-50 ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}
                    >
                      <TableCell className="w-[50px] pl-4">
                        <Checkbox 
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell className="w-[300px]">
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-10 w-10 bg-stone-100 rounded overflow-hidden shrink-0">
                            {images[0] ? (
                              <img src={images[0]} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-stone-900 flex items-center gap-1 truncate" title={product.name}>
                              <span className="truncate">{product.name}</span>
                              {product.featured && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px] font-mono text-xs text-stone-600 truncate">{v.sku || '-'}</TableCell>
                      <TableCell className="w-[120px]">
                        <Badge variant="outline" className="text-xs truncate max-w-full block text-center">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="w-[80px] text-center">
                        <div className={`font-semibold ${isLowStock ? 'text-amber-600' : 'text-stone-900'}`}>
                          {v.stockCount}
                          {isLowStock && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px] text-right font-medium">
                        Rp {v.price?.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="w-[100px] text-center">
                        <Badge className={`${product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'} hover:bg-opacity-80`} variant="secondary">
                          {product.status === 'ACTIVE' ? 'Aktif' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[60px] text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartEdit(product)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFeatured(product)}>
                              {product.featured ? (
                                <><StarOff className="mr-2 h-4 w-4" /> Hapus Featured</>
                              ) : (
                                <><Star className="mr-2 h-4 w-4" /> Set Featured</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(product)}>
                              {product.status === 'ACTIVE' ? (
                                <><EyeOff className="mr-2 h-4 w-4" /> Set Draft</>
                              ) : (
                                <><Eye className="mr-2 h-4 w-4" /> Set Aktif</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(product.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
              </TableBody>
            </table>
          </div>

          {/* Pagination */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-stone-100 p-3 flex items-center justify-between bg-white z-10">
            <div className="text-sm text-stone-500">
              Halaman {currentPage} dari {totalPages} ({totalCount} item)
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Produk dan semua variannya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Product Modal */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            <DialogDescription>{isEditing ? 'Update detail produk.' : 'Buat produk baru dengan detail inventory.'}</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Info Umum</TabsTrigger>
              <TabsTrigger value="pricing">Harga & Stok</TabsTrigger>
              <TabsTrigger value="variants">Varian ({formData.variants.length})</TabsTrigger>
              <TabsTrigger value="shipping">Pengiriman</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Produk</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Kursi Kayu Jati"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Pilih Kategori</option>
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Deskripsi</Label>
                  <div className="min-h-[200px]">
                    <RichTextEditor 
                      value={formData.description} 
                      onChange={val => setFormData({...formData, description: val})} 
                      placeholder="Deskripsi lengkap produk..."
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Gambar Produk</Label>
                  
                  {/* Image Grid */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mb-4">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group bg-stone-50">
                          <img src={img} alt={`Product ${index}`} className="w-full h-full object-cover"/>
                          <button
                            onClick={() => {
                              const newImages = [...formData.images]
                              newImages.splice(index, 1)
                              setFormData({...formData, images: newImages})
                            }}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            type="button"
                            title="Hapus gambar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*"
                      multiple
                      className="cursor-pointer"
                      onChange={async (e) => {
                        const files = e.target.files
                        if (!files || files.length === 0) return
                        
                        const loadingToast = toast.loading(`Mengupload ${files.length} gambar...`)
                        
                        try {
                          const newUrls: string[] = []
                          
                          // Upload files sequentially to avoid overwhelming server
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i]
                            const data = new FormData()
                            data.append('file', file)
                            
                            const res = await fetch('/api/upload/products', {
                              method: 'POST',
                              body: data
                            })
                            
                            if (res.ok) {
                              const json = await res.json()
                              newUrls.push(json.url)
                            }
                          }
                          
                          if (newUrls.length > 0) {
                            setFormData(prev => ({ 
                              ...prev, 
                              images: [...(prev.images || []), ...newUrls] 
                            }))
                            toast.success(`${newUrls.length} gambar berhasil diupload`)
                          } else {
                            toast.error('Gagal mengupload gambar')
                          }
                        } catch (err) {
                          console.error(err)
                          toast.error('Error saat upload')
                        } finally {
                          toast.dismiss(loadingToast)
                          // Reset input value to allow selecting same files again if needed
                          e.target.value = ''
                        }
                      }}
                    />
                    <p className="text-xs text-stone-500 mt-1">
                      Pilih satu atau banyak foto sekaligus. Foto pertama akan menjadi cover.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="featured" 
                    checked={formData.featured}
                    onCheckedChange={checked => setFormData({...formData, featured: checked})}
                  />
                  <Label htmlFor="featured">Produk Unggulan</Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-4 pt-4">
              {/* Warning for Multi-Variant Products */}
              {isEditing && editId && products.find(p => p.id === editId)?.variants.length! > 1 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
                    <div>
                      <strong>Produk Multi-Varian:</strong> Saat ini Anda sedang mengedit stok/harga untuk 
                      <span className="font-semibold underline ml-1">Varian Utama</span> saja. 
                      Stok varian lain tidak berubah. Edit varian spesifik akan segera hadir.
                    </div>
                  </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Lokasi Rak</Label>
                  <Input value={formData.shelfLocation} onChange={e => setFormData({...formData, shelfLocation: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-600 font-semibold">Harga Jual (Rp)</Label>
                  <Input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-600 font-semibold">Harga Modal/HPP (Rp)</Label>
                  <Input type="number" min="0" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Stok Awal</Label>
                  <Input type="number" min="0" value={formData.stockCount} onChange={e => setFormData({...formData, stockCount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Batas Stok Rendah</Label>
                  <Input type="number" min="0" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} />
                </div>
              </div>
            </TabsContent>
            


            <TabsContent value="variants" className="pt-4">
              {/* Bulk Update Toolbar */}
              <div className="flex flex-wrap items-center gap-4 mb-3 bg-stone-50 p-2 rounded-md border border-stone-200">
                  <span className="text-xs font-semibold text-stone-600">Bulk Update:</span>
                  <div className="flex items-center gap-2">
                     <Input 
                        placeholder="Harga Semua" 
                        className="h-7 w-28 text-xs bg-white" 
                        type="number"
                        min="0"
                        value={bulkPrice}
                        onChange={e => setBulkPrice(e.target.value)}
                     />
                     <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white" onClick={applyBulkPrice}>Set All</Button>
                  </div>
                  <div className="flex items-center gap-2">
                     <Input 
                        placeholder="Stok Semua" 
                        className="h-7 w-24 text-xs bg-white" 
                        type="number"
                        min="0"
                        value={bulkStock}
                        onChange={e => setBulkStock(e.target.value)}
                     />
                     <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white" onClick={applyBulkStock}>Set All</Button>
                  </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-xs uppercase font-semibold text-stone-600 border-b">
                    <tr>
                      <th className="px-4 py-3">Varian & Atribut</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Harga</th>
                      <th className="px-4 py-3 text-center">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {formData.variants.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-stone-500">Tidak ada varian tambahan</td></tr>
                    ) : (
                      formData.variants.map((v, i) => (
                      <tr key={v.id || i} className="hover:bg-stone-50/50">
                        <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {/* Backend returns flattened attributes in page GET, so we check that */}
                              {v.attributes?.map((a: any, j: number) => (
                                <Badge key={j} variant="secondary" className="text-[10px] font-normal border-stone-200">
                                   {a.name}: {a.value}
                                </Badge>
                              ))}
                              {(!v.attributes || v.attributes.length === 0) && <span className="text-stone-400 text-xs italic">Default</span>}
                            </div>
                        </td>
                        <td className="px-4 py-2">
                            <Input 
                              className="h-8 text-xs w-32 font-mono" 
                              value={v.sku} 
                              onChange={e => {
                                const newVars = [...formData.variants]
                                newVars[i].sku = e.target.value
                                setFormData({...formData, variants: newVars})
                              }} 
                            />
                        </td>
                        <td className="px-4 py-2 text-right">
                            <Input 
                              className="h-8 text-xs w-28 text-right ml-auto" 
                              type="number" 
                              min="0"
                              value={v.price} 
                              onChange={e => {
                                const newVars = [...formData.variants]
                                newVars[i].price = e.target.value
                                setFormData({...formData, variants: newVars})
                              }} 
                            />
                        </td>
                        <td className="px-4 py-2 text-center">
                            <Input 
                              className="h-8 text-xs w-20 text-center mx-auto" 
                              type="number" 
                              min="0"
                              value={v.stockCount} 
                              onChange={e => {
                                const newVars = [...formData.variants]
                                newVars[i].stockCount = e.target.value
                                setFormData({...formData, variants: newVars})
                              }} 
                            />
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-stone-500 mt-2 text-right">*Perubahan pada tab ini akan langsung disimpan saat klik tombol Simpan.</p>
            </TabsContent>
            
            <TabsContent value="shipping" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Berat (kg)</Label>
                  <Input type="number" min="0" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Dimensi (cm)</Label>
                  <div className="flex gap-2">
                    <Input placeholder="P" type="number" min="0" onChange={e => setFormData({...formData, length: e.target.value})} value={formData.length} />
                    <Input placeholder="L" type="number" min="0" onChange={e => setFormData({...formData, width: e.target.value})} value={formData.width} />
                    <Input placeholder="T" type="number" min="0" onChange={e => setFormData({...formData, height: e.target.value})} value={formData.height} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Warna</Label>
                  <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Input value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleSaveProduct}>{isEditing ? 'Simpan' : 'Buat Produk'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}