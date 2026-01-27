
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Image as ImageIcon, ExternalLink, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'
import Image from 'next/image'
import { ImageUpload } from '@/components/ui/image-upload'

interface Banner {
  id: string
  title: string
  description?: string
  image: string
  link?: string
  ctaText?: string
  order: number
  isActive: boolean
  bgColor?: string
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({})


  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      const data = await res.json()
      if (data.success) {
        setBanners(data.banners)
      }
    } catch (error) {
      toast.error('Failed to load banners')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = isEditing && currentBanner.id 
        ? `/api/admin/banners/${currentBanner.id}` 
        : '/api/admin/banners'
      
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBanner)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(isEditing ? 'Banner updated' : 'Banner created')
        fetchBanners()
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Banner deleted')
        setBanners(banners.filter(b => b.id !== id))
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const resetForm = () => {
    setCurrentBanner({
      isActive: true,
      order: 0,
      bgColor: 'bg-gray-100',
      ctaText: 'Shop Now'
    })
    setIsEditing(false)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (banner: Banner) => {
    setCurrentBanner(banner)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hero Banners</h1>
          <p className="text-muted-foreground mt-2">Manage the main sliders on the homepage.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title & Description</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="relative h-16 w-24 rounded-md overflow-hidden bg-gray-100">
                      {banner.image ? (
                        <Image src={banner.image} alt={banner.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{banner.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{banner.description}</div>
                  </TableCell>
                  <TableCell>
                    {banner.link && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Link href={banner.link} target="_blank" className="hover:underline flex items-center">
                          Link <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{banner.order}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.isActive ? 'Active' : 'Draft'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(banner.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No banners found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
            <DialogDescription>
              Configure the hero slider content.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                value={currentBanner.title || ''} 
                onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})} 
                required 
                placeholder="e.g. Summer Sale"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Banner Image *</Label>
              <ImageUpload 
                value={currentBanner.image || ''}
                onChange={(url) => setCurrentBanner({ ...currentBanner, image: url })}
                onRemove={() => setCurrentBanner({ ...currentBanner, image: '' })}
                endpoint="/api/upload/banners"
                className="h-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={currentBanner.description || ''} 
                onChange={e => setCurrentBanner({...currentBanner, description: e.target.value})} 
                placeholder="Short subtitle"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="ctaText">Button Text</Label>
                <Input 
                  id="ctaText" 
                  value={currentBanner.ctaText || 'Shop Now'} 
                  onChange={e => setCurrentBanner({...currentBanner, ctaText: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link URL</Label>
                <Input 
                  id="link" 
                  value={currentBanner.link || ''} 
                  onChange={e => setCurrentBanner({...currentBanner, link: e.target.value})} 
                  placeholder="/shop/category"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input 
                  id="order" 
                  type="number"
                  value={currentBanner.order || 0} 
                  onChange={e => setCurrentBanner({...currentBanner, order: parseInt(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <Input
                      id="bgColor"
                      value={currentBanner.bgColor || 'bg-gray-100'}
                      onChange={e => setCurrentBanner({...currentBanner, bgColor: e.target.value})}
                      placeholder="bg-blue-50"
                  />
                  <p className="text-xs text-gray-500">Tailwind class (e.g. bg-blue-50)</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="isActive" 
                checked={currentBanner.isActive ?? true}
                onCheckedChange={checked => setCurrentBanner({...currentBanner, isActive: checked})}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{isEditing ? 'Save Changes' : 'Create Banner'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
