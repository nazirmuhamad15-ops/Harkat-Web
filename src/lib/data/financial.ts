import { db } from '@/lib/db-drizzle'
import { unstable_cache } from 'next/cache'
import { orders, orderItems, productVariants } from '@/db/schema'
import { desc, not, eq, gte, sql } from 'drizzle-orm'

type Period = 'week' | 'month' | 'year'

export const getFinancialStats = unstable_cache(
  async (period: Period = 'month') => {
    // Determine Date Range
    const now = new Date()
    const startDate = new Date()
    if (period === 'week') startDate.setDate(now.getDate() - 7)
    if (period === 'month') startDate.setMonth(now.getMonth() - 1)
    if (period === 'year') startDate.setFullYear(now.getFullYear() - 1)

    // Fetch Completed Orders in Range
    // Using Drizzle Query API for deep nesting
    const ordersData = await db.query.orders.findMany({
      where: (orders, { and, not, eq, gte }) => and(
          gte(orders.createdAt, startDate),
          not(eq(orders.status, 'CANCELLED'))
      ),
      with: {
        items: {
          with: {
            productVariant: true
          }
        }
      }
    })

    // Calculate Metrics
    let totalRevenue = 0
    let totalCost = 0 // HPP

    ordersData.forEach(order => {
      totalRevenue += order.total
        
      // Calculate Cost
      order.items.forEach(item => {
        const cost = item.productVariant.costPrice || (item.unitPrice * 0.7)
        totalCost += cost * item.quantity
      })
    })

    const netProfit = totalRevenue - totalCost
    const avgOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0

    // Chart Data Preparation
    const chartMap = new Map<string, { revenue: number, profit: number }>()

    ordersData.forEach(order => {
      const dateKey = period === 'year' 
        ? order.createdAt.toLocaleString('default', { month: 'short' }) 
        : order.createdAt.toLocaleDateString()
        
      const current = chartMap.get(dateKey) || { revenue: 0, profit: 0 }
        
      let orderCost = 0
      order.items.forEach(item => {
        const cost = item.productVariant.costPrice || (item.unitPrice * 0.7)
        orderCost += cost * item.quantity
      })

      chartMap.set(dateKey, {
        revenue: current.revenue + order.total,
        profit: current.profit + (order.total - orderCost)
      })
    })

    const revenueChart = Array.from(chartMap.entries()).map(([name, val]) => ({
      name,
      revenue: val.revenue,
      profit: val.profit
    }))

    // Recent High Value Orders
    // We can use query builder or simple select with join
    // Using query builder for simpler relation count simulation (fetched 5 rows, minimal overhead)
    const recentOrdersRaw = await db.query.orders.findMany({
      where: not(eq(orders.status, 'CANCELLED')),
      orderBy: [desc(orders.total)],
      limit: 5,
      with: {
        items: {
            columns: { id: true } // Just fetch ID to count in memory or display count
        }
      }
    })

    const mappedRecentOrders = recentOrdersRaw.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      itemsCount: o.items.length,
      total: o.total,
      status: o.status
    }))

    return {
      totalRevenue,
      netProfit,
      totalOrders: ordersData.length,
      avgOrderValue,
      revenueChart,
      categoryChart: [
        { name: 'Table', value: totalRevenue * 0.4 },
        { name: 'Chair', value: totalRevenue * 0.3 },
        { name: 'Sofa', value: totalRevenue * 0.2 },
        { name: 'Bed', value: totalRevenue * 0.1 },
      ],
      recentOrders: mappedRecentOrders
    }
  },
  ['financial-stats'],
  { tags: ['financial'], revalidate: 300 }
)
