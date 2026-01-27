'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Truck, Plus, Fuel, Settings, AlertCircle, Wrench, Calendar, DollarSign, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Vehicle {
  id: string
  name: string
  licensePlate: string
  type: string
  capacityKg: number
  status: string
  lastService: string | null
  _count: {
    fuelLogs: number
  }
}

interface MaintenanceLog {
  id: string
  serviceDate: string
  vehicle: {
    name: string
    licensePlate: string
  }
  description: string
  cost: number
  garageName: string
  odometer: number
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', licensePlate: '', type: 'Blind Van', capacityKg: '' })

  const [activeTab, setActiveTab] = useState<'vehicles' | 'maintenance'>('vehicles')
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false)
  const [maintFormData, setMaintFormData] = useState({ 
      vehicleId: '', description: '', cost: '', odometer: '', serviceDate: '', garageName: '' 
  })

  useEffect(() => {
    fetchVehicles()
    fetchMaintenance()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/admin/fleet/vehicles')
      if (res.ok) {
        const data = await res.json()
        setVehicles(data.data || [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data kendaraan')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenance = async () => {
      try {
          const res = await fetch('/api/admin/fleet/maintenance')
          if (res.ok) {
              const data = await res.json()
              setMaintenanceLogs(data.data || [])
          }
      } catch (e) { console.error(e) }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.licensePlate) {
        toast.error('Mohon lengkapi nama dan plat nomor')
        return
    }

    try {
        const res = await fetch('/api/admin/fleet/vehicles', {
            method: 'POST',
            body: JSON.stringify(formData)
        })
        if (res.ok) {
            toast.success('Kendaraan berhasil ditambahkan')
            setIsAddOpen(false)
            fetchVehicles()
            setFormData({ name: '', licensePlate: '', type: 'Blind Van', capacityKg: '' })
        } else {
            toast.error('Gagal menambahkan kendaraan')
        }
    } catch (e) {
        toast.error('Terjadi kesalahan')
    }
  }

  const handleCreateMaintenance = async () => {
      if (!maintFormData.vehicleId || !maintFormData.description) {
          toast.error('Mohon lengkapi data servis')
          return
      }

      try {
          const res = await fetch('/api/admin/fleet/maintenance', {
              method: 'POST',
              body: JSON.stringify(maintFormData)
          })
          if (res.ok) {
              toast.success('Log maintenance berhasil disimpan')
              setIsMaintenanceOpen(false)
              fetchMaintenance()
              fetchVehicles() 
              setMaintFormData({ vehicleId: '', description: '', cost: '', odometer: '', serviceDate: '', garageName: '' })
          } else {
              toast.error('Gagal menyimpan log')
          }
      } catch (e) {
          toast.error('Terjadi kesalahan')
      }
  }

  if (loading) {
     return (
        <div className="h-full flex items-center justify-center">
           <p className="text-stone-500 text-sm">Loading fleet data...</p>
        </div>
     )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 bg-white px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-100 rounded-lg">
             <Truck className="w-5 h-5 text-stone-700" />
          </div>
          <div>
             <h1 className="text-lg font-bold text-stone-900">Fleet Management</h1>
             <p className="text-xs text-stone-500">Kelola armada dan jadwal maintenance</p>
          </div>
        </div>
        
        <div className="flex bg-stone-100 p-1 rounded-lg">
            <button
                onClick={() => setActiveTab('vehicles')}
                className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    activeTab === 'vehicles' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
            >
                Vehicles
            </button>
            <button
                onClick={() => setActiveTab('maintenance')}
                className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    activeTab === 'maintenance' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
            >
                Maintenance Logs
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-transparent px-4 pb-4">
      {activeTab === 'vehicles' ? (
      <div className="flex-1 overflow-auto">
        <div className="flex justify-end mb-4">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
                <Button className="bg-stone-900 hover:bg-stone-800">
                    <Plus className="mr-2 h-4 w-4" /> 
                    Tambah Kendaraan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Armada Baru</DialogTitle>
                    <DialogDescription>Masukkan detail kendaraan operasional baru.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Nama Kendaraan</Label>
                    <Input className="border-stone-200" placeholder="Contoh: Truck Engkel A" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                    <Label>Nomor Polisi</Label>
                    <Input className="border-stone-200" placeholder="B 1234 XX" value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Tipe</Label>
                        <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                            <SelectTrigger className="border-stone-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Blind Van">Blind Van</SelectItem>
                                <SelectItem value="Pickup Box">Pickup Box</SelectItem>
                                <SelectItem value="Engkel Truck">Engkel Truck</SelectItem>
                                <SelectItem value="CDD Truck">CDD Truck</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Kapasitas (Kg)</Label>
                        <Input className="border-stone-200" type="number" min="0" placeholder="1000" value={formData.capacityKg} onChange={e => setFormData({...formData, capacityKg: e.target.value})} />
                    </div>
                </div>
                <Button onClick={handleCreate} className="mt-2 bg-stone-900 w-full">Simpan Kendaraan</Button>
                </div>
            </DialogContent>
            </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(vehicle => (
            <Card key={vehicle.id} className="border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 border-b border-stone-50 bg-stone-50/50">
                    <div>
                        <CardTitle className="text-base font-bold text-stone-900">
                            {vehicle.name}
                        </CardTitle>
                        <div className="flex items-center mt-1 text-xs font-medium text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md w-fit">
                            {vehicle.licensePlate}
                        </div>
                    </div>
                    {vehicle.status === 'AVAILABLE' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    ) : (
                        <Badge variant="destructive">Maintenance</Badge>
                    )}
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex items-center text-xs text-stone-500 mb-4 space-x-2">
                        <Badge variant="secondary" className="bg-stone-100 text-stone-600 font-normal">
                             {vehicle.type}
                        </Badge>
                        <span>•</span>
                        <span>Max {vehicle.capacityKg} kg</span>
                    </div>
                
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col items-center justify-center p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                            <Fuel className="h-4 w-4 text-orange-500 mb-1.5" />
                            <span className="text-xs font-medium text-stone-600">{vehicle._count.fuelLogs} Refuels</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <Wrench className="h-4 w-4 text-blue-500 mb-1.5" />
                            <span className="text-[10px] font-medium text-stone-600 text-center leading-tight">
                                {vehicle.lastService ? `Last: ${new Date(vehicle.lastService).toLocaleDateString()}` : 'No Service Record'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
            ))}
            {vehicles.length === 0 && (
                <div className="col-span-3">
                    <div className="flex flex-col items-center justify-center py-12 bg-white border border-dashed border-stone-200 rounded-lg">
                        <div className="p-3 bg-stone-50 rounded-full mb-3">
                            <Truck className="h-6 w-6 text-stone-400" />
                        </div>
                        <h3 className="text-sm font-medium text-stone-900">Belum ada kendaraan</h3>
                        <p className="text-xs text-stone-500 mt-1">Tambahkan kendaraan operasional pertama Anda.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
      ) : (
          <div className="flex-1 overflow-auto flex flex-col">
              <div className="flex justify-end mb-4 shrink-0">
                  <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
                      <DialogTrigger asChild>
                          <Button className="bg-stone-900 hover:bg-stone-800">
                             <Plus className="mr-2 h-4 w-4" /> 
                             Catat Maintenance
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Catat Service / Perbaikan</DialogTitle>
                              <DialogDescription>Input detail maintenance kendaraan.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                  <Label>Pilih Kendaraan</Label>
                                  <Select value={maintFormData.vehicleId} onValueChange={v => setMaintFormData({...maintFormData, vehicleId: v})}>
                                      <SelectTrigger className="border-stone-200"><SelectValue placeholder="Pilih Kendaraan..." /></SelectTrigger>
                                      <SelectContent>
                                          {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.licensePlate})</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-2">
                                  <Label>Deskripsi Service</Label>
                                  <Input className="border-stone-200" placeholder="Ganti Oli, Service Rutin, Ganti Ban..." value={maintFormData.description} onChange={e => setMaintFormData({...maintFormData, description: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                      <Label>Biaya (Rp)</Label>
                                      <Input className="border-stone-200" type="number" min="0" value={maintFormData.cost} onChange={e => setMaintFormData({...maintFormData, cost: e.target.value})} />
                                  </div>
                                  <div className="grid gap-2">
                                      <Label>Odometer (km)</Label>
                                      <Input className="border-stone-200" type="number" min="0" value={maintFormData.odometer} onChange={e => setMaintFormData({...maintFormData, odometer: e.target.value})} />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                      <Label>Tanggal</Label>
                                      <Input className="border-stone-200" type="date" value={maintFormData.serviceDate} onChange={e => setMaintFormData({...maintFormData, serviceDate: e.target.value})} />
                                  </div>
                                  <div className="grid gap-2">
                                      <Label>Bengkel</Label>
                                      <Input className="border-stone-200" placeholder="Nama Bengkel" value={maintFormData.garageName} onChange={e => setMaintFormData({...maintFormData, garageName: e.target.value})} />
                                  </div>
                              </div>
                              <Button onClick={handleCreateMaintenance} disabled={!maintFormData.vehicleId} className="bg-stone-900 w-full mt-2">Simpan Log</Button>
                          </div>
                      </DialogContent>
                  </Dialog>
              </div>
              
              <div className="border border-stone-200 rounded-lg overflow-hidden flex-1 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-stone-700 uppercase bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Tanggal</th>
                                <th className="px-6 py-3 font-semibold">Kendaraan</th>
                                <th className="px-6 py-3 font-semibold">Deskripsi</th>
                                <th className="px-6 py-3 font-semibold">Biaya</th>
                                <th className="px-6 py-3 font-semibold">Bengkel</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {maintenanceLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                                        Belum ada riwayat maintenance.
                                    </td>
                                </tr>
                            ) : (
                                maintenanceLogs.map(log => (
                                    <tr key={log.id} className="border-b border-stone-100 hover:bg-stone-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-stone-900">
                                                <Calendar className="w-3.5 h-3.5 mr-2 text-stone-400" />
                                                {new Date(log.serviceDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-stone-900">{log.vehicle.name}</div>
                                            <div className="text-xs text-stone-500">{log.vehicle.licensePlate}</div>
                                        </td>
                                        <td className="px-6 py-4 text-stone-600">{log.description}</td>
                                        <td className="px-6 py-4 font-medium text-stone-900">
                                            Rp {log.cost.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-stone-600">
                                            <div className="flex items-center">
                                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                                                {log.garageName || '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}
      </div>
    </div>
  )
}
