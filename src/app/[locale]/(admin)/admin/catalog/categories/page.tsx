'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Search, 
  Edit, 
  FolderOpen, 
  Package, 
  RefreshCw,
  Save,
  X,
  Image as ImageIcon,
  MoreHorizontal
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface Category {
  id: string
  name: string
  slug?: string
  description: string | null
  image?: string | null
  createdAt?: string
  _count?: {
    products: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    image: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/catalog/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data || [])
      }
    } catch (e) {
      toast.error('Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const resetForm = () => {
    setFormData({ name: '', description: '', image: '' })
    setIsEditing(false)
    setEditId(null)
  }

  const handleStartEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || ''
    })
    setEditId(category.id)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Nama kategori wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      if (isEditing && editId) {
        // Update
        const res = await fetch('/api/admin/catalog/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...formData })
        })
        if (res.ok) {
          toast.success('Kategori berhasil diupdate')
          setIsDialogOpen(false)
          resetForm()
          fetchCategories()
        } else {
          toast.error('Gagal update kategori')
        }
      } else {
        // Create
        const res = await fetch('/api/admin/catalog/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (res.ok) {
          toast.success('Kategori berhasil dibuat')
          setIsDialogOpen(false)
          resetForm()
          fetchCategories()
        } else {
          toast.error('Gagal membuat kategori')
        }
      }
    } catch (e) {
      toast.error('Error menyimpan kategori')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/catalog/categories?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Kategori dihapus')
        setDeleteId(null)
        fetchCategories()
      } else {
        toast.error('Gagal menghapus kategori')
      }
    } catch (e) {
      toast.error('Error menghapus kategori')
    }
  }

  // Bulk Actions
  const toggleSelectCategory = (id: string) => {
    setSelectedCategories(prev => {
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
    if (selectedCategories.size === filtered.length) {
      setSelectedCategories(new Set())
    } else {
      setSelectedCategories(new Set(filtered.map(c => c.id)))
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedCategories.size === 0) {
      toast.error('Pilih kategori terlebih dahulu')
      return
    }

    setBulkActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const categoryId of selectedCategories) {
      try {
        const category = categories.find(c => c.id === categoryId)
        if (!category) continue

        const res = await fetch('/api/admin/catalog/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: categoryId,
            name: category.name,
            description: category.description,
            image: category.image,
            isActive: action === 'activate'
          })
        })

        if (res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) toast.success(`${successCount} kategori berhasil diupdate`)
    if (failCount > 0) toast.error(`${failCount} kategori gagal diupdate`)
    
    setSelectedCategories(new Set())
    fetchCategories()
    setBulkActionLoading(false)
  }

  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      toast.error('Pilih kategori terlebih dahulu')
      return
    }

    setBulkActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const categoryId of selectedCategories) {
      try {
        const res = await fetch(`/api/admin/catalog/categories?id=${categoryId}`, {
          method: 'DELETE'
        })

        if (res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) toast.success(`${successCount} kategori berhasil dihapus`)
    if (failCount > 0) toast.error(`${failCount} kategori gagal dihapus`)
    
    setSelectedCategories(new Set())
    setShowBulkDeleteConfirm(false)
    fetchCategories()
    setBulkActionLoading(false)
  }

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: categories.length,
    totalProducts: categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      {/* High Density Header */}
      <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
        
        {/* Row 1: Title & Stats & Actions */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-stone-900">Kategori</h1>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-50 border border-stone-100">
                    <FolderOpen className="w-3 h-3 text-stone-500" />
                    <span className="text-xs font-semibold text-stone-700">{stats.total} <span className="text-[10px] font-normal text-stone-500">Kategori</span></span>
                </div>
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-50 border border-stone-100">
                    <Package className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-semibold text-stone-700">{stats.totalProducts} <span className="text-[10px] font-normal text-stone-500">Produk</span></span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchCategories}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" className="h-8 text-xs bg-stone-900 hover:bg-stone-800" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
               <Plus className="w-3.5 h-3.5 mr-1.5" />
               Baru
            </Button>
          </div>
        </div>

        {/* Row 2: Search */}
        <div className="flex items-center gap-2 px-4 py-2 bg-stone-50/50">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
             <Input 
               placeholder="Cari kategori..." 
               className="h-8 pl-8 text-xs bg-white border-stone-200"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           <Badge variant="outline" className="text-stone-500 text-[10px] h-7 bg-white">
             {filtered.length} results
           </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-white relative mx-3 mb-3">
          {/* Fixed Header */}
          <div className="bg-stone-50 border-b z-20 shrink-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 font-semibold w-12">Img</TableHead>
                  <TableHead className="font-semibold">Nama</TableHead>
                  <TableHead className="font-semibold">Deskripsi</TableHead>
                  <TableHead className="font-semibold text-center">Produk</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="w-24 text-right pr-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* Scrollable Body */}
          <div className="absolute inset-0 top-[45px] overflow-y-auto">
            <Table>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-stone-500">
                      <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      Tidak ada kategori ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(category => (
                    <TableRow key={category.id} className="hover:bg-stone-50">
                      <TableCell className="pl-4">
                        <div className="w-10 h-10 bg-stone-100 rounded overflow-hidden flex items-center justify-center">
                          {category.image && category.image.trim() !== '' ? (
                            <img 
                              src={category.image} 
                              alt={category.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('image-error');
                                // Create replacement icon
                                const iconContainer = document.createElement('div');
                                iconContainer.innerHTML = '<svg class="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                                e.currentTarget.parentElement?.appendChild(iconContainer.firstChild as Node);
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-stone-900">{category.name}</p>
                        <p className="text-xs text-stone-500">{category.slug}</p>
                      </TableCell>
                      <TableCell className="text-sm text-stone-600 max-w-[200px] truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {category._count?.products || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={category.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}>
                          {category.isActive !== false ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleStartEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Kategori *</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Sofa" 
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Deskripsi kategori..." 
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Gambar Kategori</Label>
              <div className="flex items-center gap-3">
                {formData.image ? (
                  <div className="relative w-20 h-20 border rounded overflow-hidden">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, image: ''})}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center text-stone-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="category-image-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      setUploading(true)
                      try {
                        const formDataUpload = new FormData()
                        formDataUpload.append('file', file)
                        
                        const res = await fetch('/api/upload/categories', {
                          method: 'POST',
                          body: formDataUpload
                        })
                        
                        if (res.ok) {
                          const data = await res.json()
                          setFormData({...formData, image: data.url})
                          toast.success('Gambar berhasil diupload')
                        } else {
                          toast.error('Gagal upload gambar')
                        }
                      } catch (error) {
                        toast.error('Error upload gambar')
                      } finally {
                        setUploading(false)
                        e.target.value = ''
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById('category-image-upload')?.click()}
                  >
                    {uploading ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><ImageIcon className="w-4 h-4 mr-2" /> Upload Gambar</>
                    )}
                  </Button>
                  <p className="text-[10px] text-stone-500 mt-1">Max 5MB. JPG, PNG, WebP, GIF</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={submitting || !formData.name}>
              {submitting ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> {isEditing ? 'Simpan' : 'Buat'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus permanen.
              Pastikan tidak ada produk yang menggunakan kategori ini.
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
    </div>
  )
}
