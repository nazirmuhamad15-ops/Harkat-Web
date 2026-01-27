'use client'

import { useState, useRef, useOptimistic, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, Fuel, Receipt, AlertCircle, Loader2, ArrowRight, History, MapPin, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { submitFuelLog } from './actions'
import { Badge } from '@/components/ui/badge'

type FuelLog = {
  id: string
  vehicle: { name: string; licensePlate: string }
  cost: number
  liters: number
  odometer: number
  createdAt: Date
}

export function FuelLogForm({ 
  initialLogs, 
  vehicles, 
  activeOrders 
}: { 
  initialLogs: FuelLog[]
  vehicles: any[]
  activeOrders: any[]
}) {
  const [optimisticLogs, addOptimisticLog] = useOptimistic(
    initialLogs,
    (state, newLog: FuelLog) => [newLog, ...state]
  )
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    orderId: '',
    liters: '',
    cost: '',
    odometer: '',
    notes: '',
    receiptUrl: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receiptUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.vehicleId) {
        toast.error('Pilih kendaraan terlebih dahulu')
        return
    }

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)
    
    // Optimistic Update
    const newOptimisticLog: FuelLog = {
      id: Math.random().toString(), // Temp ID
      vehicle: { 
        name: selectedVehicle?.name || 'Mobil', 
        licensePlate: selectedVehicle?.licensePlate || '-' 
      },
      cost: parseFloat(formData.cost),
      liters: parseFloat(formData.liters),
      odometer: parseInt(formData.odometer),
      createdAt: new Date()
    }

    startTransition(async () => {
      addOptimisticLog(newOptimisticLog)
      
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value)
      })

      const result = await submitFuelLog(submitData)

      if (result.success) {
        toast.success('Log BBM berhasil disimpan')
        setFormData({
            vehicleId: '',
            orderId: '',
            liters: '',
            cost: '',
            odometer: '',
            notes: '',
            receiptUrl: ''
        })
      } else {
        toast.error(result.error || 'Gagal menyimpan log')
      }
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="rounded-[2.5rem] border-stone-100 shadow-xl shadow-stone-200/50 overflow-hidden border-0 bg-white">
        <CardHeader className="bg-stone-900 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Fuel className="w-5 h-5 text-white" />
             </div>
             <CardTitle className="text-2xl font-serif font-black">Input Log BBM</CardTitle>
          </div>
          <p className="text-stone-400 text-xs font-medium">Catat pengeluaran bahan bakar untuk kendaraan operasional.</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">Pilih Kendaraan</Label>
                    <Select value={formData.vehicleId} onValueChange={v => setFormData({...formData, vehicleId: v})}>
                        <SelectTrigger className="h-14 rounded-2xl border-stone-100 bg-stone-50 focus:bg-white focus:ring-stone-900/5 transition-all outline-none">
                            <SelectValue placeholder="Pilih unit armada" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-stone-100 shadow-2xl">
                            {vehicles.map((v: any) => (
                                <SelectItem key={v.id} value={v.id} className="rounded-xl py-3 cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-stone-900">{v.name}</span>
                                        <span className="text-[10px] text-stone-400 font-black">{v.licensePlate}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">Tugas Terkait (Opsional)</Label>
                    <Select value={formData.orderId} onValueChange={v => setFormData({...formData, orderId: v})}>
                        <SelectTrigger className="h-14 rounded-2xl border-stone-100 bg-stone-50 focus:bg-white transition-all">
                            <SelectValue placeholder="Sambungkan ke pengiriman" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-stone-100 shadow-2xl">
                            <SelectItem value="none" className="rounded-xl py-3">Tidak ada tugas khusus</SelectItem>
                            {activeOrders.map((order: any) => (
                                <SelectItem key={order.id} value={order.id} className="rounded-xl py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-stone-900">#{order.orderNumber}</span>
                                        <span className="text-[10px] text-stone-400 font-black">{order.customerName}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">Jumlah (Liter)</Label>
                    <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold"
                        value={formData.liters}
                        onChange={e => setFormData({...formData, liters: e.target.value})}
                        required
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">Biaya (Rp)</Label>
                    <Input 
                        type="number" 
                        placeholder="Rp 0" 
                        className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold"
                        value={formData.cost}
                        onChange={e => setFormData({...formData, cost: e.target.value})}
                        required
                    />
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">Odometer Terakhir (KM)</Label>
                <div className="relative">
                    <Input 
                        type="number" 
                        placeholder="000.000" 
                        className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-serif font-bold text-lg tracking-widest"
                        value={formData.odometer}
                        onChange={e => setFormData({...formData, odometer: e.target.value})}
                        required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 font-black text-[10px] uppercase">Kilometer</div>
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <Label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">Foto Struk Pembelian</Label>
                <div className="flex items-center gap-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full h-40 rounded-4xl border-2 border-dashed border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-all group relative overflow-hidden active:scale-95"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {formData.receiptUrl ? (
                            <>
                                <img src={formData.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 rounded-full bg-white shadow-xl shadow-stone-200/50 group-hover:scale-110 transition-transform">
                                    <Camera className="h-6 w-6 text-stone-400" />
                                </div>
                                <span className="text-xs text-stone-400 font-black uppercase tracking-widest">Ambil Foto Struk</span>
                            </div>
                        )}
                    </Button>
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        capture="environment"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            <Button 
                type="submit" 
                className="w-full h-20 rounded-3xl bg-stone-900 hover:bg-stone-800 text-white text-lg font-serif font-bold shadow-2xl shadow-stone-200 active:scale-95 transition-all" 
                disabled={isPending || !formData.vehicleId}
            >
                {isPending ? (
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Menyimpan...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Receipt className="w-5 h-5" />
                        <span>Simpan Log BBM</span>
                    </div>
                )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-stone-900" />
                <h2 className="text-xl font-serif font-black text-stone-900">Riwayat Terakhir</h2>
            </div>
            <Badge variant="outline" className="rounded-full border-stone-200 text-stone-400 font-black text-[9px] px-2 py-0.5 tracking-widest">
                5 INPUT TERAKHIR
            </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {optimisticLogs.map((log: FuelLog) => (
            <Card key={log.id} className="rounded-3xl border-stone-100 bg-white shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center shrink-0">
                                <Truck className="w-6 h-6 text-stone-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-900 leading-tight mb-1">{log.vehicle.name}</h3>
                                <div className="flex items-center gap-3">
                                   <Badge variant="outline" className="text-[9px] font-black h-5 border-stone-200 text-stone-400 px-1.5 rounded-md">
                                       {log.vehicle.licensePlate}
                                   </Badge>
                                   <span className="text-[10px] text-stone-300 font-bold">
                                       {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                   </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-serif font-black text-stone-900 text-lg">{formatCurrency(log.cost)}</p>
                            <p className="text-[10px] text-stone-400 font-black uppercase tracking-tighter mt-1">
                                {log.liters} L <span className="mx-1">•</span> {log.odometer.toLocaleString()} KM
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            ))}
            {optimisticLogs.length === 0 && (
                <div className="text-center py-16 bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <History className="w-6 h-6 text-stone-100" />
                    </div>
                    <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Belum ada riwayat</p>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
