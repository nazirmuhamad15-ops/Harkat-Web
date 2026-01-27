'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  Navigation,
  ArrowRight,
  Phone
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DriverTask {
  id: string
  status: string
  order: {
    orderNumber: string
    customerName: string
    customerPhone: string
    shippingAddress: string
    trackingNumber: string
  }
}

export default function DriverDashboardPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<DriverTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/driver/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (addressStr: string) => {
    if (!addressStr) return 'No address provided';
    try {
      if (addressStr.trim().startsWith('{')) {
        const parsed = JSON.parse(addressStr);
        const parts = [
          parsed.address,
          parsed.city,
          parsed.province,
          parsed.zip
        ].filter(Boolean);
        return parts.join(', ');
      }
      return addressStr;
    } catch (e) {
      return addressStr;
    }
  }

  const taskStats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === 'ASSIGNED').length,
    inProgress: tasks.filter(t => ['PICKED_UP', 'IN_TRANSIT'].includes(t.status)).length,
    delivered: tasks.filter(t => t.status === 'DELIVERED').length,
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative">
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
          Halo, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-stone-500 text-sm mt-1 font-medium">
          Ada <span className="text-stone-900">{tasks.length} tugas</span> pengiriman untuk Anda hari ini.
        </p>
      </div>

      {/* Stats Cards - Modern & Slim */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tugas', value: taskStats.total, icon: Package, color: 'text-stone-600', bg: 'bg-stone-100' },
          { label: 'Ditugaskan', value: taskStats.assigned, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Proses', value: taskStats.inProgress, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Selesai', value: taskStats.delivered, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-stone-100 shadow-sm overflow-hidden group hover:border-stone-200 transition-all">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className={`p-2 w-fit rounded-lg ${stat.bg} ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{stat.label}</p>
                <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-stone-900">Tugas Hari Ini</h2>
          <Badge variant="outline" className="border-stone-200 text-stone-500 font-normal">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-stone-100 h-32 rounded-2xl border border-stone-200" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-200 shadow-inner">
            <div className="bg-stone-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                <Truck className="w-10 h-10 text-stone-200" />
            </div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">Belum Ada Tugas</h3>
            <p className="text-stone-400 text-sm max-w-[200px] mx-auto">Tunggu admin memberikan penugasan baru untuk Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <Link key={task.id} href={`/driver/tasks/${task.id}`}>
                <Card className="border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer rounded-2xl group active:scale-[0.98]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-stone-900 text-white hover:bg-stone-800 rounded-md text-[10px] px-1.5 py-0">
                             #{task.order.orderNumber}
                           </Badge>
                           <span className="text-stone-400 text-xs font-medium">•</span>
                           <span className="text-stone-900 font-bold text-sm tracking-tight">{task.order.customerName}</span>
                        </div>
                      </div>
                      <Badge 
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 ${
                          task.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                          task.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'PICKED_UP' ? 'bg-amber-100 text-amber-700' :
                          'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {task.status === 'ASSIGNED' ? 'DITUGASKAN' : 
                         task.status === 'PICKED_UP' ? 'DIAMBIL' :
                         task.status === 'IN_TRANSIT' ? 'DI PERJALANAN' :
                         task.status === 'DELIVERED' ? 'TERKIRIM' : task.status}
                      </Badge>
                    </div>

                     <div className="flex items-center text-stone-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                       <div className="bg-stone-100 p-1.5 rounded-md mr-3 shrink-0">
                         <Navigation className="w-3.5 h-3.5" />
                       </div>
                       <span className="font-medium text-stone-600">{formatAddress(task.order.shippingAddress)}</span>
                     </div>
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 text-xs font-bold border-stone-200 text-stone-600"
                            onClick={(e) => {
                                e.preventDefault()
                                const address = formatAddress(task.order.shippingAddress)
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
                            }}
                        >
                            <Navigation className="w-3.5 h-3.5 mr-2" />
                            Navigasi
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 text-xs font-bold border-stone-200 text-stone-600"
                            onClick={(e) => {
                                e.preventDefault()
                                window.location.href = `tel:${task.order.customerPhone}`
                            }}
                        >
                            <Phone className="w-3.5 h-3.5 mr-2" />
                            Telepon
                        </Button>
                    </div>

                     <div className="pt-4 border-t border-stone-50 flex items-center justify-between">
                          <div className="flex -space-x-1">
                              <div className="w-6 h-6 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-400">
                                  {task.order.customerName.charAt(0)}
                              </div>
                          </div>
                          <div className="flex items-center text-stone-900 text-[11px] font-bold group-hover:translate-x-1 transition-transform">
                              Detail Tugas
                              <ArrowRight className="w-3 h-3 ml-1.5" />
                          </div>
                     </div>
                   </CardContent>
                 </Card>
               </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}