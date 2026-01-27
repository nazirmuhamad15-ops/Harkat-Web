'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Tag, Search, Filter } from 'lucide-react'
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
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Coupon {
  id: string
  code: string
  description?: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  startDate?: string
  endDate?: string
  usageLimit?: number
  usedCount: number
  isActive: boolean
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({
      discountType: 'PERCENTAGE',
      isActive: true
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      if (!data.error) {
        setCoupons(data)
      }
    } catch (error) {
      toast.error('Gagal mengambil data kupon')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
        const url = isEditing 
            ? `/api/admin/coupons/${currentCoupon.id}`
            : '/api/admin/coupons'
        
        const method = isEditing ? 'PATCH' : 'POST'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentCoupon)
        })

        if (res.ok) {
            toast.success(isEditing ? 'Kupon diupdate' : 'Kupon dibuat')
            setIsDialogOpen(false)
            fetchCoupons()
        } else {
            const err = await res.json()
            toast.error(err.error || 'Gagal menyimpan')
        }
    } catch (error) {
        toast.error('Terjadi kesalahan')
    }
  }

  const handleDelete = async (id: string) => {
      if (!confirm('Yakin hapus kupon ini?')) return
      try {
          const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
          if (res.ok) {
              toast.success('Kupon dihapus')
              fetchCoupons()
          }
      } catch (error) {
          toast.error('Gagal menghapus')
      }
  }

  const openAddDialog = () => {
      setCurrentCoupon({
        discountType: 'PERCENTAGE',
        isActive: true,
        startDate: new Date().toISOString().split('T')[0]
      })
      setIsEditing(false)
      setIsDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setCurrentCoupon({
        ...coupon,
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : undefined,
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : undefined,
    })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
        {/* Header */}
        <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Coupons & Vouchers
                    </h1>
                    <p className="text-sm text-stone-500 mt-1">Manage discount codes for your store</p>
                </div>
                <Button onClick={openAddDialog} className="bg-stone-900 hover:bg-stone-800">
                    <Plus className="w-4 h-4 mr-2" />
                    New Coupon
                </Button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-stone-500">
                                        No coupons found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-medium text-base">{coupon.code}</TableCell>
                                        <TableCell>
                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                                {coupon.discountType}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-bold text-green-600">
                                            {coupon.discountType === 'PERCENTAGE' 
                                                ? `${coupon.discountValue}%` 
                                                : `Rp ${coupon.discountValue.toLocaleString('id-ID')}`
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                        </TableCell>
                                        <TableCell className="text-sm text-stone-500">
                                            {coupon.startDate ? format(new Date(coupon.startDate), 'dd MMM yyyy') : '-'} 
                                            {' -> '} 
                                            {coupon.endDate ? format(new Date(coupon.endDate), 'dd MMM yyyy') : 'Forever'}
                                        </TableCell>
                                        <TableCell>
                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                coupon.isActive 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {coupon.isActive ? 'Active' : 'Inactive'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(coupon)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(coupon.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
                    <DialogDescription>Create a new discount code for your customers.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Code</Label>
                            <Input 
                                placeholder="SUMMER2025" 
                                value={currentCoupon.code || ''} 
                                onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select 
                                value={currentCoupon.discountType} 
                                onValueChange={(v: any) => setCurrentCoupon({...currentCoupon, discountType: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                    <SelectItem value="FIXED">Fixed Amount (Rp)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Value</Label>
                        <Input 
                            type="number" 
                            placeholder={currentCoupon.discountType === 'PERCENTAGE' ? '10' : '50000'}
                            value={currentCoupon.discountValue || ''}
                            onChange={e => setCurrentCoupon({...currentCoupon, discountValue: parseFloat(e.target.value)})}
                        />
                        <p className="text-xs text-stone-500">
                            {currentCoupon.discountType === 'PERCENTAGE' ? 'Example: 10 for 10%' : 'Example: 50000 for Rp 50.000'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                            placeholder="Promo Spesial Kemerdekaan" 
                            value={currentCoupon.description || ''}
                            onChange={e => setCurrentCoupon({...currentCoupon, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Min Order (Rp)</Label>
                            <Input 
                                type="number" 
                                value={currentCoupon.minOrderAmount || ''}
                                onChange={e => setCurrentCoupon({...currentCoupon, minOrderAmount: parseFloat(e.target.value)})}
                            />
                        </div>
                        {currentCoupon.discountType === 'PERCENTAGE' && (
                            <div className="space-y-2">
                                <Label>Max Discount (Rp)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="Optional cap"
                                    value={currentCoupon.maxDiscountAmount || ''}
                                    onChange={e => setCurrentCoupon({...currentCoupon, maxDiscountAmount: parseFloat(e.target.value)})}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input 
                                type="date" 
                                value={currentCoupon.startDate || ''}
                                onChange={e => setCurrentCoupon({...currentCoupon, startDate: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input 
                                type="date" 
                                value={currentCoupon.endDate || ''}
                                onChange={e => setCurrentCoupon({...currentCoupon, endDate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Usage Limit</Label>
                            <Input 
                                type="number" 
                                placeholder="Total limit (global)"
                                value={currentCoupon.usageLimit || ''}
                                onChange={e => setCurrentCoupon({...currentCoupon, usageLimit: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Switch 
                                checked={currentCoupon.isActive}
                                onCheckedChange={c => setCurrentCoupon({...currentCoupon, isActive: c})}
                            />
                            <Label>Active Status</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-stone-900">Save Coupon</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
