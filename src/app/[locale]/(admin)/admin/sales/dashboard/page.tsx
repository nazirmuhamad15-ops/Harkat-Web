import { Suspense } from 'react'
import { getFinancialStats } from '@/lib/data/financial'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, Wallet, TrendingUp, CreditCard, ShoppingCart } from 'lucide-react'
import { FinancialPeriodSelector } from './components/period-selector'

import FinancialCharts from './components/charts-wrapper'

export const metadata = {
  title: 'Financial Dashboard | Harkat Furniture Admin',
  description: 'Financial performance analytics and reports.'
}

export default async function FinancialPage({
  searchParams
}: {
  searchParams: { period?: string }
}) {
  const period = (searchParams.period as 'week' | 'month' | 'year') || 'month'
  const stats = await getFinancialStats(period)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Keuangan</h2>
          <p className="text-muted-foreground">Analisis pendapatan dan profitabilitas toko.</p>
        </div>
        <div className="flex items-center space-x-2">
          <FinancialPeriodSelector />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total pendapatan kotor
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Net Profit (Est.)</CardTitle>
             <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(stats.netProfit)}</div>
             <p className="text-xs text-muted-foreground">
                Revenue dikurangi HPP
             </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
             <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
             <p className="text-xs text-muted-foreground">
                Rata-rata per transaksi
             </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Order</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
           </CardHeader>
           <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                 Transaksi berhasil
              </p>
           </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div className="h-[350px] w-full bg-gray-100 animate-pulse rounded-lg" />}>
        <FinancialCharts 
          revenueChart={stats.revenueChart}
          categoryChart={stats.categoryChart}
        />
      </Suspense>

      {/* Recent High Value Orders */}
      <div className="grid gap-4 grid-cols-1">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Transaksi Bernilai Tinggi</CardTitle>
            <CardDescription>
              5 transaksi terbesar periode ini
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {stats.recentOrders.length > 0 ? (
                 stats.recentOrders.map((order) => (
                   <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                     <div className="space-y-1">
                       <p className="text-sm font-medium leading-none">{order.customerName}</p>
                       <p className="text-xs text-muted-foreground">
                         {order.orderNumber} • {order.itemsCount} Items
                       </p>
                     </div>
                     <div className="text-sm font-bold">
                       {formatCurrency(order.total)}
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-sm text-gray-500 py-4">
                   Belum ada transaksi
                 </div>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
