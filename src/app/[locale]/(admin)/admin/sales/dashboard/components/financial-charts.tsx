'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts'

interface FinancialChartsProps {
  revenueChart: {
    name: string
    revenue: number
    profit: number
  }[]
  categoryChart: {
    name: string
    value: number
  }[]
}

const COLORS = ['#57534e', '#78716c', '#a8a29e', '#d6d3d1']

export function FinancialCharts({ revenueChart, categoryChart }: FinancialChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumSignificantDigits: 3
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4 shadow-sm">
        <CardHeader>
          <CardTitle>Overview Pendapatan vs Profit</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          {revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `Rp${value/1000}k`} 
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: 'black' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Pendapatan" fill="#57534e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit Bersih" fill="#a8a29e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              Tidak ada data untuk periode ini
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-3 shadow-sm">
        <CardHeader>
          <CardTitle>Kategori Penjualan</CardTitle>
          <CardDescription>
            Kontribusi per kategori (Estimasi)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={categoryChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
