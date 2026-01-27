"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Pencil, Check, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { toast } from "sonner"

export type StockItem = {
  id: string
  name: string
  sku: string
  image: string | null
  stock: number
  threshold: number
  shelf: string
  attributes: string
}

export const columns = (
    refreshData: () => void
): ColumnDef<StockItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-stone-100"
        >
          Produk
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const image = row.original.image
        return (
            <div className="flex items-center gap-3">
                {image && (
                    <img src={image} alt={row.getValue("name")} className="w-8 h-8 rounded object-cover border border-stone-200" />
                )}
                <div className="flex flex-col">
                   <span className="font-bold text-stone-900 text-sm">{row.getValue("name")}</span>
                   <span className="text-[10px] text-stone-500 font-mono">{row.original.sku}</span>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <div className="font-mono text-xs text-stone-500">{row.getValue("sku")}</div>
  },
  {
      id: "actions",
      header: "Edit & Aksi",
      cell: ({ row }) => {
        return <EditableRow item={row.original} onUpdate={refreshData} />
      },
  },
]

function EditableRow({ item, onUpdate }: { item: StockItem, onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Edit States
    const [stock, setStock] = useState(item.stock.toString())
    const [threshold, setThreshold] = useState(item.threshold.toString())
    const [shelf, setShelf] = useState(item.shelf)

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/stock', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  id: item.id,
                  stock: stock,
                  shelf: shelf,
                  threshold: threshold
                })
              })
            
            if (res.ok) {
                toast.success('Stok berhasil diupdate')
                onUpdate()
                setIsEditing(false)
            } else {
                toast.error('Gagal update stok')
            }
        } catch (e) {
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setStock(item.stock.toString())
        setThreshold(item.threshold.toString())
        setShelf(item.shelf)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-md border border-stone-200 shadow-sm -ml-4 w-full justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-20">
                         <label className="text-[9px] uppercase font-bold text-stone-400">Stok</label>
                         <Input 
                            value={stock} 
                            onChange={(e) => setStock(e.target.value)} 
                            className="h-7 text-xs" 
                            type="number" 
                         />
                    </div>
                    <div className="w-20">
                         <label className="text-[9px] uppercase font-bold text-stone-400">Min</label>
                         <Input 
                            value={threshold} 
                            onChange={(e) => setThreshold(e.target.value)} 
                            className="h-7 text-xs" 
                            type="number" 
                         />
                    </div>
                    <div className="w-24">
                         <label className="text-[9px] uppercase font-bold text-stone-400">Lokasi</label>
                         <Input 
                            value={shelf} 
                            onChange={(e) => setShelf(e.target.value)} 
                            className="h-7 text-xs" 
                         />
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={handleCancel} disabled={loading}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    // Read-only View
    const stockVal = parseFloat(item.stock.toString())
    const thresholdVal = item.threshold
    const stockColor = stockVal === 0 ? "text-red-600" : stockVal <= thresholdVal ? "text-amber-600" : "text-stone-900" 

    return (
        <div className="flex items-center justify-between w-full">
            <div className="grid grid-cols-4 gap-4 flex-1 items-center">
                 {/* Stock */}
                 <div className={`font-bold text-center ${stockColor}`}>
                    {stockVal}
                 </div>
                 {/* Threshold */}
                 <div className="text-xs text-stone-500 text-center">
                    Min: {thresholdVal}
                 </div>
                 {/* Location */}
                 <div className="text-center">
                    <Badge variant="outline" className="font-normal">{item.shelf || '-'}</Badge>
                 </div>
                 {/* Status */}
                 <div className="text-center">
                      {stockVal === 0 ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 text-[10px]">Habis</Badge>
                      ) : stockVal <= thresholdVal ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 text-[10px]">Menipis</Badge>
                      ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 text-[10px]">Tersedia</Badge>
                      )}
                 </div>
            </div>

            <Button size="icon" variant="ghost" className="h-8 w-8 text-stone-400 hover:text-stone-900 ml-4 hover:bg-stone-100" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
    )
}
