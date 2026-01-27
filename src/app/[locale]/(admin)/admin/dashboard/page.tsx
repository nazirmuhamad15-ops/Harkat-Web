import { Suspense } from 'react'
import { getDashboardStats } from '@/lib/data/dashboard'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, DollarSign, Activity, AlertTriangle, TrendingUp } from 'lucide-react'
import { CalendarDateRangePicker } from '@/components/ui/date-range-picker'
import DashboardCharts from './components/charts-wrapper'

export const metadata = {
  title: 'Dashboard Overview | Harkat Furniture Admin',
  description: 'Overview of store performance and key metrics.'
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const { range, from, to } = await searchParams
  
  const stats = await getDashboardStats({
      range,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined
  })

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              {stats.monthlyRevenue > 0 ? '+12.5%' : '0%'} dari bulan lalu
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Aktif</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-500" /> 
              {stats.todayOrders} order baru hari ini
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              {stats.lowStockProducts} stok menipis
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total pelanggan terdaftar
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg" />}>
        <DashboardCharts 
          salesChartData={stats.salesChartData}
          productPieData={stats.productPieData}
        />
      </Suspense>
    </div>
  )
}