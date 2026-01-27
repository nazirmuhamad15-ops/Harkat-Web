'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  RefreshCw,
  Download,
  Loader2,
  Pencil
} from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from './data-table'
import { columns, StockItem } from './columns'

function BulkEditDialog({ 
    selected, 
    onUpdate, 
    onComplete 
}: { 
    selected: StockItem[], 
    onUpdate: (ids: string[], data: any) => Promise<void>, 
    onComplete: () => void 
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [stock, setStock] = useState('')
    const [threshold, setThreshold] = useState('')
    const [shelf, setShelf] = useState('')

    const handleSave = async () => {
        if (!stock && !threshold && !shelf) {
            setOpen(false)
            return
        }

        setLoading(true)
        try {
            const updates: any = {}
            if (stock) updates.stock = stock
            if (threshold) updates.threshold = threshold
            if (shelf) updates.shelf = shelf

            await onUpdate(selected.map(s => s.id), updates)
            setOpen(false)
            onComplete()
            setStock('')
            setThreshold('')
            setShelf('')
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="h-7 text-xs">
                    <Pencil className="w-3 h-3 mr-2" />
                    Bulk Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Edit Stock</DialogTitle>
                    <DialogDescription>
                        Update properties for {selected.length} selected items. Leave fields blank to keep existing values.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">Stock</Label>
                        <Input id="stock" value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="col-span-3" placeholder="Enter value to set all..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="threshold" className="text-right">Threshold</Label>
                        <Input id="threshold" value={threshold} onChange={(e) => setThreshold(e.target.value)} type="number" className="col-span-3" placeholder="Enter value to set all..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shelf" className="text-right">Location</Label>
                        <Input id="shelf" value={shelf} onChange={(e) => setShelf(e.target.value)} className="col-span-3" placeholder="Enter value to set all..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rowSelection, setRowSelection] = useState({})

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stock')
      if (res.ok) {
        const data = await res.json()
        setItems(data.data)
      }
    } catch (e) {
      toast.error('Gagal memuat data stok')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  // Reset selection on data reload if needed, or keep it. 
  // TanStack table might lose selection if data reference changes completely and IDs are not tracked carefully, but we'll see.
  
  const handleBulkUpdate = async (ids: string[], data: any) => {
      // Create an array of promises for concurrent updates
      // Note: Ideally backend should support bulk update, but this works for now
      try {
          const promises = ids.map(id => fetch('/api/admin/stock', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  id,
                  ...data
              })
          }))
          
          await Promise.all(promises)
          toast.success(`Updated ${ids.length} items successfully`)
          fetchStock()
      } catch (e) {
          toast.error('Failed to update some items')
      }
  }

  const stats = {
    total: items.length,
    lowStock: items.filter(i => i.stock > 0 && i.stock <= i.threshold).length,
    outOfStock: items.filter(i => i.stock === 0).length,
    inStock: items.filter(i => i.stock > i.threshold).length,
    totalUnits: items.reduce((sum, i) => sum + i.stock, 0)
  }

  const exportToCSV = () => {
    const headers = ['SKU', 'Produk', 'Stok', 'Threshold', 'Lokasi', 'Status']
    const rows = items.map(i => [
      i.sku,
      i.name,
      i.stock,
      i.threshold,
      i.shelf,
      i.stock === 0 ? 'Out of Stock' : i.stock <= i.threshold ? 'Low Stock' : 'In Stock'
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `stock_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Laporan stok diexport')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Compact Header with Stats */}
      <div className="flex items-center justify-between shrink-0 px-4 py-2 border-b border-stone-100 bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-stone-900">Stok Inventory</h1>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-50 border border-stone-100">
                <Package className="w-3 h-3 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">{stats.total} <span className="text-[10px] font-normal text-stone-500">Items</span></span>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${stats.inStock > 0 ? 'bg-green-50 border-green-100' : 'bg-stone-50 border-stone-100'}`}>
                <CheckCircle className={`w-3 h-3 ${stats.inStock > 0 ? 'text-green-600' : 'text-stone-400'}`} />
                <span className={`text-xs font-semibold ${stats.inStock > 0 ? 'text-green-700' : 'text-stone-500'}`}>{stats.inStock} <span className="text-[10px] font-normal opacity-70">Ready</span></span>
            </div>
            {(stats.lowStock > 0 || stats.outOfStock > 0) && (
                <>
                 <div className="h-4 w-px bg-stone-200" />
                 {stats.lowStock > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-100">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700">{stats.lowStock} <span className="text-[10px] font-normal opacity-70">Low</span></span>
                    </div>
                 )}
                 {stats.outOfStock > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 border border-red-100">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-semibold text-red-700">{stats.outOfStock} <span className="text-[10px] font-normal opacity-70">Empty</span></span>
                    </div>
                 )}
                </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchStock} disabled={loading}>
             <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
           </Button>
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 px-4 pb-4 min-h-0 overflow-hidden flex flex-col">
        <DataTable 
            columns={columns(fetchStock)} 
            data={items} 
            searchKey="name"
            onExport={exportToCSV}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            bulkActions={(selected) => (
                <BulkEditDialog 
                    selected={selected} 
                    onUpdate={handleBulkUpdate} 
                    onComplete={() => setRowSelection({})} 
                />
            )}
        />
      </div>
    </div>
  )
}

