'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { 
  Search, 
  Eye, 
  Truck, 
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Download,
  RefreshCw,
  Users,
  Printer,
  MessageCircle,
  Calendar,
  CheckSquare,
  Square,
  MoreHorizontal,
  User,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'
import { CalendarDateRangePicker } from '@/components/ui/date-range-picker'
import { DatePicker } from '@/components/ui/date-picker'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  paymentStatus: string
  total: number
  subtotal: number
  shippingCost: number
  shippingAddress: string
  shippingVendor?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  productName: string
  quantity: number
  price: number
  total: number
}

export default function OrdersPage() {
  const { csrfToken } = useCsrf()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // dateFilter removed in favor of searchParams
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [assigningDriver, setAssigningDriver] = useState(false)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const fetchDrivers = useCallback(async () => {
      try {
          const res = await fetch('/api/admin/fleet/drivers')
          if (res.ok) {
              const data = await res.json()
              setDrivers(data.drivers || [])
          }
      } catch (err) {
          console.error("Failed to fetch drivers", err)
      }
  }, [])

  const handleAssignDriver = async () => {
    if (!selectedOrder || !selectedDriverId) return
    setAssigningDriver(true)
    try {
        const res = await fetchWithCsrf('/api/admin/fleet/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: selectedOrder.id,
                driverId: selectedDriverId,
                scheduledDate: scheduledDate ? scheduledDate.toISOString() : new Date().toISOString()
            })
        }, csrfToken)

        if (res.ok) {
            toast.success("Driver berhasil ditugaskan")
            fetchOrders() // Refresh orders to see status update
            setSelectedDriverId('')
            setScheduledDate(undefined)
            // Optionally close dialog or just refresh order details?
            // Since selectedOrder is static state, we might need to refresh it too?
            // logic above refreshes the LIST `orders`. But `selectedOrder` object is stale.
            // Ideally we re-fetch the single order or close dialog.
            // For now let's just toast.
        } else {
            const err = await res.json()
            toast.error(err.error || "Gagal menugaskan driver")
        }
    } catch (e) {
        toast.error("Terjadi kesalahan")
    } finally {
        setAssigningDriver(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return
    
    setDeletingOrderId(orderToDelete.id)
    try {
      const response = await fetchWithCsrf(`/api/admin/orders/${orderToDelete.id}`, {
        method: 'DELETE'
      }, csrfToken)

      if (response.ok) {
        const data = await response.json()
        toast.success(`Order ${data.deletedOrderNumber} berhasil dihapus`)
        fetchOrders()
        setShowDeleteConfirm(false)
        setOrderToDelete(null)
        if (selectedOrder?.id === orderToDelete.id) {
          setSelectedOrder(null)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menghapus order')
      }
    } catch (error) {
      console.error('Failed to delete order:', error)
      toast.error('Gagal menghapus order')
    } finally {
      setDeletingOrderId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Pilih order terlebih dahulu')
      return
    }

    setBulkActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const orderId of selectedOrders) {
      try {
        const response = await fetchWithCsrf(`/api/admin/orders/${orderId}`, {
          method: 'DELETE'
        }, csrfToken)
        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} order berhasil dihapus`)
    }
    if (failCount > 0) {
      toast.error(`${failCount} order gagal dihapus`)
    }

    setSelectedOrders(new Set())
    setShowDeleteConfirm(false)
    fetchOrders()
    setBulkActionLoading(false)
  }

  const statusTabs = [
    { value: 'all', label: 'Semua', icon: Package, color: 'text-stone-600' },
    { value: 'PENDING', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
    { value: 'PROCESSING', label: 'Proses', icon: Package, color: 'text-purple-600' },
    { value: 'SHIPPED', label: 'Dikirim', icon: Truck, color: 'text-blue-600' },
    { value: 'DELIVERED', label: 'Selesai', icon: CheckCircle, color: 'text-green-600' },
    { value: 'CANCELLED', label: 'Batal', icon: XCircle, color: 'text-red-600' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PAID': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAddress = (addressStr: any) => {
    if (!addressStr) return 'No address provided'
    let data = addressStr
    if (typeof addressStr === 'string') {
      try {
        data = JSON.parse(addressStr)
      } catch (e) {
        return addressStr
      }
    }
    
    if (typeof data === 'object' && data !== null) {
      const parts = []
      if (data.address) parts.push(data.address)
      if (data.city) parts.push(data.city)
      if (data.province) parts.push(data.province)
      if (data.zip) parts.push(data.zip)
      return parts.length > 0 ? parts.join(', ') : addressStr
    }
    
    return addressStr
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'PAID': return <CheckCircle className="h-4 w-4" />
      case 'PROCESSING': return <Package className="h-4 w-4" />
      case 'SHIPPED': return <Truck className="h-4 w-4" />
      case 'DELIVERED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CONFIRMING': return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchDrivers()
  }, [fetchOrders, fetchDrivers])

  const handlePaymentAction = async (orderId: string, action: 'approve' | 'reject') => {
    setUpdatingStatus(orderId)
    try {
      const response = await fetchWithCsrf('/api/admin/orders/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action })
      }, csrfToken)

      if (response.ok) {
        toast.success(`Pembayaran ${action === 'approve' ? 'disetujui' : 'ditolak'}`)
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null) 
        }
      } else {
        const error = await response.json()
        toast.error(error.error || `Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} pembayaran`)
      }
    } catch (error) {
      console.error(`Failed to ${action} payment:`, error)
      toast.error(`Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} pembayaran`)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const response = await fetchWithCsrf(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }, csrfToken)

      if (response.ok) {
        toast.success(`Status order diupdate ke ${newStatus}`)
        fetchOrders()
        
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? ({ ...prev, status: newStatus }) : null)
        }
      } else {
        toast.error('Gagal update status')
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Gagal update status order')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.size === 0) {
      toast.error('Pilih order terlebih dahulu')
      return
    }

    setBulkActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const orderId of selectedOrders) {
      try {
        const response = await fetchWithCsrf(`/api/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }, csrfToken)
        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} order berhasil diupdate`)
    }
    if (failCount > 0) {
      toast.error(`${failCount} order gagal diupdate`)
    }

    setSelectedOrders(new Set())
    fetchOrders()
    setBulkActionLoading(false)
  }

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
    }
  }

  const sendWhatsAppNotification = (order: Order) => {
    const phone = order.customerPhone.replace(/\D/g, '')
    const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone
    const message = encodeURIComponent(
      `Halo ${order.customerName}!\n\nTerima kasih atas pesanan Anda di Harkat Furniture.\n\n📦 Order: #${order.orderNumber}\n💰 Total: Rp ${order.total.toLocaleString('id-ID')}\n📋 Status: ${order.status}\n\nAda pertanyaan? Balas pesan ini ya!\n\nTerima kasih 🙏`
    )
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
  }

  const filterByDate = (order: Order) => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    
    if (!fromParam) return true
    
    const orderDate = new Date(order.createdAt)
    const fromDate = new Date(fromParam)
    // reset fromDate to start of day
    fromDate.setHours(0,0,0,0)
    
    if (toParam) {
      const toDate = new Date(toParam)
      // reset toDate to end of day if we want inclusive, or just use raw comparison
      // The DateRangePicker usually sends start of day. Let's make sure we include the whole 'to' day.
      toDate.setHours(23, 59, 59, 999)
      return orderDate >= fromDate && orderDate <= toDate
    } else {
      // Logic for single date or 'from' onwards? 
      // Usually picker range means [from, to]. If to is missing, maybe just that day? 
      // Or from that day onwards? 
      // Shadcn range picker 'mode=range' usually enforces both or just one.
      // If only one is selected, it's often treated as "from this date".
      return orderDate >= fromDate
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerPhone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesDate = filterByDate(order)
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length
    return orders.filter(o => o.status === status).length
  }

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirming: orders.filter(o => o.paymentStatus === 'CONFIRMING').length,
    todayOrders: orders.filter(o => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(o.createdAt) >= today
    }).length,
    totalRevenue: orders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.total, 0)
  }

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Phone', 'Status', 'Payment', 'Total', 'Date']
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.customerName,
      o.customerPhone,
      o.status,
      o.paymentStatus,
      o.total,
      new Date(o.createdAt).toLocaleDateString('id-ID')
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* High Density Header */}
      <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
        
        {/* Row 1: Title & Key Stats & Actions */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-stone-900">Orders</h1>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-100">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    <div>
                        <p className="text-[10px] text-stone-500 font-medium uppercase leading-none">Revenue</p>
                        <p className="text-xs font-bold text-stone-900 leading-none mt-0.5">Rp {(orderStats.totalRevenue / 1000000).toFixed(1)}Jt</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-100">
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                    <div>
                        <p className="text-[10px] text-stone-500 font-medium uppercase leading-none">Pending</p>
                        <p className="text-xs font-bold text-stone-900 leading-none mt-0.5">{orderStats.pending}</p>
                    </div>
                </div>
                {orderStats.confirming > 0 && (
                   <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 animate-pulse">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-700">{orderStats.confirming} Confirm</span>
                   </div>
                )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchOrders}>
                <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportToCSV}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
            </Button>
          </div>
        </div>

        {/* Row 2: Search, Date Filter & Status Dropdown */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-3 py-2 bg-stone-50/50 border-b border-stone-100">
            {/* Left Side: Search & Date */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                    <Input
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 pl-9 text-xs bg-white border-stone-200 shadow-sm"
                    />
                </div>
                <div className="h-9">
                    <CalendarDateRangePicker className="h-9 w-auto" />
                </div>
            </div>

            {/* Right Side: Status Filter & Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-xs bg-white border-stone-200 shadow-sm">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusTabs.map(tab => (
                            <SelectItem key={tab.value} value={tab.value} className="text-xs">
                                <span className="flex items-center justify-between w-full gap-2">
                                    {tab.label}
                                    <span className="text-stone-400 text-[10px] bg-stone-100 px-1.5 py-0.5 rounded-full">
                                        {getStatusCount(tab.value)}
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selectedOrders.size > 0 && (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" className="h-9 w-9 border-stone-200 shadow-sm">
                             <MoreHorizontal className="w-4 h-4 text-stone-600" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('PROCESSING')}>Set Processing</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('SHIPPED')}>Set Shipped</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('DELIVERED')}>Set Delivered</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {(session?.user as any)?.role === 'SUPER_ADMIN' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                setOrderToDelete(null) // Set to null for bulk delete
                                setShowDeleteConfirm(true)
                              }}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Semua ({selectedOrders.size})
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={() => setSelectedOrders(new Set())}>Clear Selection</DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-white relative">
          {/* Fixed Header */}
          <div className="bg-stone-50 border-b z-20 shrink-0">
            <Table>
                <TableHeader>
                    <TableRow className="text-xs hover:bg-transparent">
                        <TableHead className="w-[50px] pl-4 py-3">
                            <Checkbox 
                                checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                                onCheckedChange={toggleSelectAll}
                            />
                        </TableHead>
                        <TableHead className="w-[180px] font-semibold py-3">Order</TableHead>
                        <TableHead className="w-[200px] font-semibold py-3">Customer</TableHead>
                        <TableHead className="w-[150px] font-semibold py-3">Tanggal</TableHead>
                        <TableHead className="w-[150px] font-semibold py-3">Status</TableHead>
                        <TableHead className="w-[120px] font-semibold py-3">Payment</TableHead>
                        <TableHead className="flex-1 font-semibold text-right py-3">Total</TableHead>
                        <TableHead className="w-[80px] text-right pr-4 py-3">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
            </Table>
          </div>

          {/* Scrollable Body - absolute inset fills remaining space */}
          <div className="absolute inset-0 top-[45px] overflow-y-auto">
            <Table>
                <TableBody>
                    {filteredOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-stone-500">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Tidak ada order ditemukan</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredOrders.map((order) => (
                            <TableRow 
                                key={order.id} 
                                className={`group hover:bg-stone-50 transition-colors ${selectedOrders.has(order.id) ? 'bg-blue-50/50' : ''}`}
                            >
                                <TableCell className="w-[50px] pl-4">
                                    <Checkbox 
                                        checked={selectedOrders.has(order.id)}
                                        onCheckedChange={() => toggleSelectOrder(order.id)}
                                    />
                                </TableCell>
                                <TableCell className="w-[180px]">
                                    <div>
                                        <p className="font-medium text-stone-900 group-hover:text-amber-600 transition-colors">{order.orderNumber}</p>
                                        {order.trackingNumber && (
                                            <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                                                <Truck className="w-3 h-3" />
                                                {order.trackingNumber}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="w-[200px]">
                                    <div>
                                        <p className="font-medium text-sm truncate max-w-[180px]">{order.customerName}</p>
                                        <p className="text-xs text-stone-500 truncate max-w-[180px]">{order.customerPhone}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="w-[150px] text-xs text-stone-600">
                                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                    <p className="text-[10px] text-stone-400">
                                        {new Date(order.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </TableCell>
                                <TableCell className="w-[150px]">
                                    <Badge className={`${getStatusColor(order.status)} font-normal px-2 py-0.5`}>
                                        {getStatusIcon(order.status)}
                                        <span className="ml-1.5">{order.status}</span>
                                    </Badge>
                                </TableCell>
                                <TableCell className="w-[120px]">
                                    <div className="flex flex-col gap-1 items-start">
                                        <Badge variant="outline" className={`${getPaymentStatusColor(order.paymentStatus)} border-0 text-[10px] uppercase font-bold tracking-wider`}>
                                            {order.paymentStatus}
                                        </Badge>
                                        {order.paymentStatus === 'CONFIRMING' && (
                                            <div className="flex gap-1">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost"
                                                    className="h-6 w-6 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                                    onClick={() => handlePaymentAction(order.id, 'approve')}
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost"
                                                    className="h-6 w-6 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                    onClick={() => handlePaymentAction(order.id, 'reject')}
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="flex-1 text-right font-medium text-stone-900">
                                    Rp {order.total.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="w-[80px] text-right pr-4">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => sendWhatsAppNotification(order)}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Lihat Detail
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/print/orders/${order.id}/invoice`} target="_blank">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Invoice
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/print/orders/${order.id}/label`} target="_blank">
                                                        <Printer className="mr-2 h-4 w-4" />
                                                        Label
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {(session?.user as any)?.role === 'SUPER_ADMIN' && (
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            setOrderToDelete(order)
                                                            setShowDeleteConfirm(true)
                                                        }}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-6xl p-0 gap-0 h-[90vh] flex flex-col bg-stone-50/50">
          {selectedOrder && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-xl font-bold text-stone-900">
                      Order #{selectedOrder.orderNumber}
                    </DialogTitle>
                    <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                    <Badge variant="outline" className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                       {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                  <DialogDescription className="mt-1">
                    Dibuat pada {new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </DialogDescription>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-stone-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Order Items</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white z-10">
                                        <TableRow className="hover:bg-transparent border-stone-100">
                                            <TableHead className="pl-6 w-[40%]">Produk</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Harga</TableHead>
                                            <TableHead className="text-right pr-6">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-stone-50 border-stone-100">
                                                <TableCell className="pl-6 py-4 font-medium text-stone-900">
                                                    {item.productName}
                                                </TableCell>
                                                <TableCell className="text-center py-4 text-stone-600 font-mono">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right py-4 text-stone-600 font-mono">
                                                    {item.price.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 py-4 font-medium text-stone-900 font-mono">
                                                    {item.total.toLocaleString('id-ID')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="bg-stone-50/50 border-t border-stone-100 flex-col items-end gap-3 py-6 px-6">
                                <div className="flex justify-between w-full md:w-1/2 text-sm">
                                    <span className="text-stone-500">Subtotal</span>
                                    <span className="font-mono text-stone-900">{selectedOrder.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between w-full md:w-1/2 text-sm">
                                    <span className="text-stone-500">Ongkos Kirim ({selectedOrder.shippingVendor || 'Std'})</span>
                                    <span className="font-mono text-stone-900">{selectedOrder.shippingCost.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="w-full md:w-1/2 border-t border-stone-200 my-1"></div>
                                <div className="flex justify-between w-full md:w-1/2 items-center">
                                    <span className="font-bold text-base text-stone-900">Total Order</span>
                                    <span className="font-black text-xl font-mono text-stone-900">Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="space-y-6">
                        {/* Customer */}
                        <Card className="border-stone-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4 text-stone-500" />
                                    Pelanggan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3 pt-0">
                                <div>
                                    <div className="font-semibold text-stone-900">{selectedOrder.customerName}</div>
                                    <div className="text-stone-500 text-xs">{selectedOrder.customerEmail}</div>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg border border-stone-100">
                                    <div className="font-mono font-medium text-stone-700">{selectedOrder.customerPhone}</div>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => sendWhatsAppNotification(selectedOrder)}>
                                        <MessageCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping */}
                        <Card className="border-stone-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-stone-500" />
                                    Pengiriman
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm pt-0 space-y-3">
                                <div className="text-stone-600 leading-relaxed">
                                    {formatAddress(selectedOrder.shippingAddress)}
                                </div>
                                {selectedOrder.trackingNumber && (
                                    <div className="p-2 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5" />
                                        Resi: {selectedOrder.trackingNumber}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Link href={`/print/orders/${selectedOrder.id}/invoice`} target="_blank" className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                            <Download className="w-3.5 h-3.5 mr-2" />
                                            Invoice
                                        </Button>
                                    </Link>
                                    <Link href={`/print/orders/${selectedOrder.id}/label`} target="_blank" className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                            <Printer className="w-3.5 h-3.5 mr-2" />
                                            Label
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Management */}
                        <Card className="border-stone-200 shadow-sm">
                             <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-stone-500" />
                                    Status & Aksi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <div className="space-y-2">
                                    <Label className="text-xs text-stone-500 uppercase font-semibold">Update Status</Label>
                                    <Select 
                                        value={selectedOrder.status} 
                                        onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                                        disabled={updatingStatus === selectedOrder.id}
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="PROCESSING">Processing</SelectItem>
                                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedOrder.paymentStatus === 'CONFIRMING' && (
                                    <div className="space-y-2 pt-2 border-t border-stone-100">
                                        <Label className="text-xs text-stone-500 uppercase font-semibold">Konfirmasi Pembayaran</Label>
                                        <div className="flex gap-2">
                                            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => handlePaymentAction(selectedOrder.id, 'approve')}>
                                                Terima
                                            </Button>
                                            <Button variant="destructive" className="flex-1" size="sm" onClick={() => handlePaymentAction(selectedOrder.id, 'reject')}>
                                                Tolak
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pt-2 border-t border-stone-100">
                                     <Label className="text-xs text-stone-500 uppercase font-semibold">Driver Delivery</Label>
                                     {drivers.length === 0 ? (
                                        <div className="text-xs text-stone-400 italic bg-stone-50 p-2 rounded">Tidak ada driver tersedia</div>
                                     ) : (
                                        <div className="space-y-2">
                                            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                                                <SelectTrigger className="w-full bg-white">
                                                    <SelectValue placeholder="Pilih Driver..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {drivers.map(d => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            
                                            <div className="flex gap-2">
                                                <div className="w-[120px]">
                                                    <DatePicker 
                                                        date={scheduledDate}
                                                        setDate={setScheduledDate}
                                                        className="w-full"
                                                        placeholder="Tgl Kirim..."
                                                    />
                                                </div>
                                                <Button 
                                                    className="flex-1"
                                                    disabled={assigningDriver || !selectedDriverId}
                                                    onClick={handleAssignDriver}
                                                >
                                                    {assigningDriver ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Assign'}
                                                </Button>
                                            </div>
                                        </div>
                                     )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus Order
            </DialogTitle>
            <DialogDescription className="pt-4">
              {orderToDelete ? (
                <>
                  Apakah Anda yakin ingin menghapus order <strong>#{orderToDelete.orderNumber}</strong>?
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus <strong>{selectedOrders.size} order</strong> yang dipilih?
                </>
              )}
              <br />
              <br />
              <span className="text-red-600 font-semibold">Tindakan ini tidak dapat dibatalkan!</span>
              <br />
              Semua data order dan item terkait akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setOrderToDelete(null)
              }}
              disabled={deletingOrderId !== null || bulkActionLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={orderToDelete ? handleDeleteOrder : handleBulkDelete}
              disabled={deletingOrderId !== null || bulkActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {(deletingOrderId !== null || bulkActionLoading) ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {orderToDelete ? 'Ya, Hapus Order' : `Ya, Hapus ${selectedOrders.size} Order`}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}