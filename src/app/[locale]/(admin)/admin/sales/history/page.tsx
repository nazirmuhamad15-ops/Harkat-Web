'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Eye, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Download, 
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
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
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  status: string
  total: number
  createdAt: string
  items: any[]
  shippingAddress: string
  customerEmail: string
  customerPhone: string
  subtotal: number
  shippingCost: number
  paymentStatus: string
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | '3month' | 'year'
type StatusFilter = 'all' | 'DELIVERED' | 'CANCELLED'

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        const data = await res.json()
        const history = data.orders.filter((o: Order) => 
          ['DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED'].includes(o.status)
        )
        setOrders(history)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat riwayat order')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const filterByDate = (order: Order) => {
    if (dateFilter === 'all') return true
    
    const orderDate = new Date(order.createdAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (dateFilter) {
      case 'today':
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return orderDate >= today && orderDate < tomorrow
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return orderDate >= weekAgo
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return orderDate >= monthAgo
      case '3month':
        const threeMonthsAgo = new Date(today)
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        return orderDate >= threeMonthsAgo
      case 'year':
        const yearAgo = new Date(today)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return orderDate >= yearAgo
      default:
        return true
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const matchesDate = filterByDate(o)
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Stats
  const stats = {
    total: filteredOrders.length,
    delivered: filteredOrders.filter(o => o.status === 'DELIVERED').length,
    cancelled: filteredOrders.filter(o => o.status === 'CANCELLED').length,
    totalRevenue: filteredOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0),
    avgOrderValue: filteredOrders.length > 0 
      ? filteredOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0) / 
        Math.max(1, filteredOrders.filter(o => o.status === 'DELIVERED').length)
      : 0,
    uniqueCustomers: new Set(filteredOrders.map(o => o.customerEmail)).size
  }

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Email', 'Phone', 'Status', 'Total', 'Date']
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.status,
      o.total,
      new Date(o.createdAt).toLocaleDateString('id-ID')
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `order_history_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Riwayat order diexport')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Extreme Minimal Header */}
      <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
        
        {/* Row 1: Title, Tabs & Actions */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <h1 className="text-base font-bold text-stone-900 shrink-0">Order History</h1>
            <div className="h-4 w-px bg-stone-200 mx-2 shrink-0" />
            
            {/* Status Tabs Inline */}
            <div className="flex items-center gap-1">
              {[
                { value: 'all', label: 'All', count: orders.length, icon: Package },
                { value: 'DELIVERED', label: 'Done', count: orders.filter(o => o.status === 'DELIVERED').length, icon: CheckCircle, color: 'text-green-600' },
                { value: 'CANCELLED', label: 'Cancel', count: orders.filter(o => o.status === 'CANCELLED').length, icon: XCircle, color: 'text-red-600' },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value as StatusFilter)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      statusFilter === tab.value 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${statusFilter === tab.value ? 'text-white' : tab.color || 'text-stone-500'}`} />
                    {tab.label}
                    <span className={`px-1 py-0.5 rounded-full text-[9px] ${
                      statusFilter === tab.value ? 'bg-white/20' : 'bg-stone-200'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchHistory}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={exportToCSV}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Row 2: Search, Filters & Inline Stats */}
        <div className="flex items-center justify-between px-3 py-2 bg-stone-50/50">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <Input 
                placeholder="Search order, customer..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-white border-stone-200"
              />
            </div>

            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-stone-200">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">7 Days</SelectItem>
                <SelectItem value="month">30 Days</SelectItem>
                <SelectItem value="3month">3 Months</SelectItem>
                <SelectItem value="year">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inline Stats */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <div>
                <p className="text-[10px] text-emerald-600 font-medium uppercase leading-none">Revenue</p>
                <p className="text-xs font-bold text-emerald-700 leading-none mt-0.5">Rp {(stats.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <div>
                <p className="text-[10px] text-blue-600 font-medium uppercase leading-none">Avg</p>
                <p className="text-xs font-bold text-blue-700 leading-none mt-0.5">Rp {(stats.avgOrderValue / 1000).toFixed(0)}K</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-100">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <div>
                <p className="text-[10px] text-purple-600 font-medium uppercase leading-none">Customers</p>
                <p className="text-xs font-bold text-purple-700 leading-none mt-0.5">{stats.uniqueCustomers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-white relative mx-3 mb-3">
          {/* Fixed Header */}
          <div className="bg-stone-50 border-b z-20 shrink-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 font-semibold">Order</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="w-20 text-right pr-4">Action</TableHead>
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
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-stone-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      No order history found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id} className="hover:bg-stone-50">
                      <TableCell className="pl-4">
                        <p className="font-medium">{order.orderNumber}</p>
                      </TableCell>
                      <TableCell className="text-sm text-stone-600">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-stone-500">{order.customerEmail}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'DELIVERED' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Done</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Cancelled</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {order.total.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Order Detail - {selectedOrder?.orderNumber}
              {selectedOrder && (
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-500">Customer</Label>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-stone-600">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-stone-600">{selectedOrder.customerPhone}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-500">Shipping Address</Label>
                  <p className="text-sm text-stone-600">{selectedOrder.shippingAddress}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">Rp {item.price.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right font-medium">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span>Rp {selectedOrder.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Shipping</span>
                  <span>Rp {selectedOrder.shippingCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
