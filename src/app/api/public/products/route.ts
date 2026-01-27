import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '@/lib/data-service'
import { db } from '@/lib/db-drizzle'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const featured = searchParams.get('featured') === 'true'
    const search = searchParams.get('search') || undefined
    const sort = searchParams.get('sort') || 'bestseller'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const result = await DataService.getProducts({
        category,
        featured,
        search,
        sort,
        page,
        limit
    })

    // Get filter options (categories)
    // Keep this lightweight
    const categoriesRaw = await db.selectDistinct({ category: products.category })
       .from(products)
       .where(eq(products.status, 'ACTIVE'))

    return NextResponse.json({
      success: true,
      data: {
        products: result.products,
        pagination: result.pagination,
        filters: {
          categories: categoriesRaw.map(c => c.category),
        },
      }
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}