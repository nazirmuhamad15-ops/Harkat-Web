import { db } from '@/lib/db-drizzle'
import { unstable_cache } from 'next/cache'
import { products, orders, users, orderItems, productVariants } from '@/db/schema' 
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm'

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all'

function getDateRangeStart(range: DateRange): Date | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  switch (range) {
    case '7d':
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return sevenDaysAgo
    case '30d':
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return thirtyDaysAgo
    case '90d':
      const ninetyDaysAgo = new Date(now)
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      return ninetyDaysAgo
    case '1y':
      const oneYearAgo = new Date(now)
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      return oneYearAgo
    case 'all':
      return null // No date filter
    default:
      const defaultRange = new Date(now)
      defaultRange.setDate(defaultRange.getDate() - 30)
      return defaultRange
  }
}

function formatChartData(ordersList: { createdAt: Date; total: number }[], range: DateRange) {
  const stats = new Map<string, { name: string; sales: number; revenue: number }>()
  
  if (range === '7d') {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      const dayName = dayNames[date.getDay()]
      const dayNum = date.getDate()
      stats.set(key, { name: `${dayName} ${dayNum}`, sales: 0, revenue: 0 })
    }
  } else if (range === '30d') {
    for (let i = 29; i >= 0; i -= 3) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      stats.set(key, { 
        name: `${date.getDate()} ${monthNames[date.getMonth()]}`, 
        sales: 0, 
        revenue: 0 
      })
    }
  }

  ordersList.forEach(order => {
     let key = order.createdAt.toISOString().split('T')[0]
     
     if (range === '30d') {
          // Find closest bucket
          const orderDate = order.createdAt
          let closestKey = ''
          let minDiff = Infinity
          
          stats.forEach((_, sKey) => {
            const bucketDate = new Date(sKey)
            const diff = Math.abs(orderDate.getTime() - bucketDate.getTime())
            if (diff < minDiff) {
              minDiff = diff
              closestKey = sKey
            }
          })
          key = closestKey
     } else if (!stats.has(key) && range !== '7d') {
         // Auto-add for monthly/yearly
         const date = order.createdAt
         const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
         const niceKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
         if (!stats.has(niceKey)) {
             stats.set(niceKey, { name: niceKey, sales: 0, revenue: 0 })
         }
         key = niceKey
     }

     if (stats.has(key)) {
         const stat = stats.get(key)!
         stat.sales += 1
         stat.revenue += order.total
     }
  })
  
  return Array.from(stats.values())
}

export const getDashboardStats = unstable_cache(
  async (filters: { range?: string; from?: Date; to?: Date } = {}) => {
    let startDate: Date | null = null
    let endDate: Date | null = null
    const range = filters.range as DateRange || '30d'

    if (filters.from) {
      startDate = filters.from
      if (filters.to) {
        endDate = filters.to
        // Set to end of day
        endDate.setHours(23, 59, 59, 999)
      }
    } else {
      startDate = getDateRangeStart(range)
    }
    
    // Prepare Promises
    const pTotalProducts = db.select({ count: sql<number>`count(*)` }).from(products)
    const pTotalOrders = db.select({ count: sql<number>`count(*)` }).from(orders)
    const pTotalUsers = db.select({ count: sql<number>`count(*)` }).from(users)
    
    const pTotalRevenue = db.select({ sum: sql<number>`sum(${orders.total})` })
        .from(orders)
        .where(eq(orders.paymentStatus, 'PAID'))

    const pPendingOrders = db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, 'PENDING'))

    const pLowStock = db.select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .where(lte(productVariants.stockCount, 5))

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const pTodayOrders = db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.createdAt, todayStart))

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const pMonthlyRevenue = db.select({ sum: sql<number>`sum(${orders.total})` })
        .from(orders)
        .where(and(
            eq(orders.paymentStatus, 'PAID'),
            gte(orders.createdAt, monthStart)
        ))

    // Top Products
    const pTopProducts = db.select({
        name: products.name,
        count: sql<number>`count(${orderItems.id})`
    })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .innerJoin(orderItems, eq(orderItems.productVariantId, productVariants.id))
    .groupBy(products.id, products.name)
    .orderBy(desc(sql`count(${orderItems.id})`))
    .limit(5)

    const chartConditions = [eq(orders.paymentStatus, 'PAID')]
    if (startDate) {
        chartConditions.push(gte(orders.createdAt, startDate))
    }
    if (endDate) {
        chartConditions.push(lte(orders.createdAt, endDate))
    }
    
    const pOrdersForChart = db.select({
        createdAt: orders.createdAt,
        total: orders.total
    }).from(orders).where(and(...chartConditions))

    // Calculate COGS
    // We need to fetch items from paid orders
    const pPaidOrderItems = db.select({
        quantity: orderItems.quantity,
        costPrice: productVariants.costPrice
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
    .where(eq(orders.paymentStatus, 'PAID'))

    // Batch 1: Simple Counts
    const [
      resTotalProducts,
      resTotalOrders,
      resTotalUsers,
      resPendingOrders,
      resLowStock,
      resTodayOrders
    ] = await Promise.all([
      pTotalProducts, pTotalOrders, pTotalUsers, pPendingOrders, pLowStock, pTodayOrders
    ])

    // Batch 2: Revenue Aggregates
    const [
      resTotalRevenue,
      resMonthlyRevenue
    ] = await Promise.all([
      pTotalRevenue, pMonthlyRevenue
    ])

    // Batch 3: Complex Data & Charts
    const [
      resTopProducts,
      resOrdersForChart,
      resPaidOrderItems
    ] = await Promise.all([
      pTopProducts, pOrdersForChart, pPaidOrderItems
    ])
    
    console.log(`📊 Dashboard Stats: Products=${Number(resTotalProducts[0]?.count)}, Orders=${Number(resTotalOrders[0]?.count)}, Revenue=${resTotalRevenue[0]?.sum}`);

    const totalHPP = resPaidOrderItems.reduce((acc, item) => {
        return acc + ((item.costPrice || 0) * item.quantity)
    }, 0)

    const totalRevenue = resTotalRevenue[0]?.sum || 0
    const estimatedShipping = totalRevenue * 0.1
    const netProfit = totalRevenue - totalHPP - estimatedShipping
    
    // Convert counts from string/bigint to number
    const totalProducts = Number(resTotalProducts[0]?.count || 0)
    const totalOrders = Number(resTotalOrders[0]?.count || 0)
    const totalUsers = Number(resTotalUsers[0]?.count || 0)
    const pendingOrders = Number(resPendingOrders[0]?.count || 0)
    const lowStockProducts = Number(resLowStock[0]?.count || 0)
    const todayOrders = Number(resTodayOrders[0]?.count || 0)
    const monthlyRevenue = resMonthlyRevenue[0]?.sum || 0

    const salesChartData = formatChartData(resOrdersForChart, range)
    const productPieData = resTopProducts.map(p => ({
        name: p.name,
        value: Number(p.count)
    }))

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
      todayOrders,
      monthlyRevenue,
      totalHPP,
      totalShipping: estimatedShipping,
      netProfit,
      salesChartData,
      productPieData
    }
  },
  ['dashboard-stats'],
  { tags: ['dashboard'], revalidate: 300 } 
)
