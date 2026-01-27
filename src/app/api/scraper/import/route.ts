import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts } from '@/db/schema'

// POST: Import scraped product from Chrome extension
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.source || !body.name) {
      return NextResponse.json({ error: 'Source and name are required' }, { status: 400 })
    }

    // Validate source
    const validSources = ['shopee', 'tiktok', 'tokopedia']
    if (!validSources.includes(body.source)) {
      return NextResponse.json({ error: 'Invalid source. Must be shopee, tiktok, or tokopedia' }, { status: 400 })
    }

    // Create scraped product
    const [scraped] = await db.insert(scrapedProducts).values({
      source: body.source,
      sourceUrl: body.sourceUrl || null,
      sourceProductId: body.sourceProductId || null,
      name: body.name,
      description: body.description || null,
      price: body.price ? parseFloat(body.price) : null,
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
      images: body.images ? JSON.stringify(body.images) : null,
      category: body.category || null,
      variants: body.variants ? JSON.stringify(body.variants) : null,
      specifications: body.specifications ? JSON.stringify(body.specifications) : null,
      scrapedById: session.user.id,
    }).returning()

    return NextResponse.json({ 
      success: true, 
      message: 'Product scraped successfully',
      data: scraped 
    })
  } catch (error) {
    console.error('Scraper import error:', error)
    return NextResponse.json({ error: 'Failed to import scraped product' }, { status: 500 })
  }
}

// Bulk import multiple products
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json({ error: 'Products array is required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const product of body.products) {
      try {
        if (!product.source || !product.name) {
          errors.push({ product: product.name || 'Unknown', error: 'Source and name required' })
          continue
        }

        const [scraped] = await db.insert(scrapedProducts).values({
          source: product.source,
          sourceUrl: product.sourceUrl || null,
          sourceProductId: product.sourceProductId || null,
          name: product.name,
          description: product.description || null,
          price: product.price ? parseFloat(product.price) : null,
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
          images: product.images ? JSON.stringify(product.images) : null,
          category: product.category || null,
          variants: product.variants ? JSON.stringify(product.variants) : null,
          specifications: product.specifications ? JSON.stringify(product.specifications) : null,
          scrapedById: session.user.id,
        }).returning()

        results.push(scraped)
      } catch (e) {
        errors.push({ product: product.name, error: 'Failed to insert' })
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: results.length,
      failed: errors.length,
      errors,
      data: results 
    })
  } catch (error) {
    console.error('Bulk scraper import error:', error)
    return NextResponse.json({ error: 'Failed to bulk import' }, { status: 500 })
  }
}
