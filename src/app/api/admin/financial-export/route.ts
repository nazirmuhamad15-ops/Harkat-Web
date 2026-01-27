import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders as ordersTable } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ExcelJS from 'exceljs'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Financial export API called')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.role) {
      console.log('❌ No valid session')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    console.log('✅ Session valid for:', session.user.email, 'Role:', session.user.role)

    const orders = await db.query.orders.findMany({
      where: eq(ordersTable.paymentStatus, 'PAID'),
      with: {
        orderItems: {
          with: {
            productVariant: {
              with: {
                product: {
                    columns: {
                        name: true
                    }
                }
              }
            }
          },
        },
      },
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Financial Data')

    // Define columns for the worksheet
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 30 },
      { header: 'Order Date', key: 'orderDate', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 20 },
      { header: 'Product Name', key: 'productName', width: 40 },
      { header: 'Variant SKU', key: 'sku', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price per Unit', key: 'pricePerUnit', width: 20 },
      { header: 'Cost Price per Unit', key: 'costPricePerUnit', width: 25 },
      { header: 'Item Revenue', key: 'itemRevenue', width: 20 },
      { header: 'Item HPP', key: 'itemHPP', width: 20 },
      { header: 'Order Total', key: 'orderTotal', width: 20 },
      { header: 'Shipping Cost', key: 'shippingCost', width: 20 },
    ]

    // Add rows to the worksheet
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const variant = item.productVariant
        
        worksheet.addRow({
          orderId: order.orderNumber || order.id,
          orderDate: order.createdAt.toISOString().split('T')[0],
          paymentStatus: order.paymentStatus,
          productName: variant?.product?.name || 'N/A',
          sku: variant?.sku || 'N/A',
          quantity: item.quantity,
          pricePerUnit: item.unitPrice || 0, // Use the price at the time of order
          costPricePerUnit: variant?.costPrice || 0,
          itemRevenue: (item.unitPrice || 0) * item.quantity,
          itemHPP: (variant?.costPrice || 0) * item.quantity,
          orderTotal: order.total,
          shippingCost: order.shippingCost,
        })
      })
    })

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Set response headers for Excel file download
    const headers = new Headers()
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.append('Content-Disposition', 'attachment; filename="financial_data.xlsx"')

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Financial export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
