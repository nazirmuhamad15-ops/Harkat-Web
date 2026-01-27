import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { wishlists, products, productVariants } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Please login to view wishlist' }, { status: 401 })
    }

    const items = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        variantId: wishlists.variantId,
        createdAt: wishlists.createdAt,
        productName: products.name,
        productSlug: products.slug,
        productImages: products.images,
        productCategory: products.category,
        variantPrice: productVariants.price,
        variantSku: productVariants.sku,
        variantImages: productVariants.images,
        variantInStock: productVariants.inStock,
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .leftJoin(productVariants, eq(wishlists.variantId, productVariants.id))
      .where(eq(wishlists.userId, session.user.id))
      .orderBy(desc(wishlists.createdAt))

    // Transform data
    const wishlistItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.productName,
      slug: item.productSlug,
      price: item.variantPrice || 0,
      image: item.variantImages 
        ? (JSON.parse(item.variantImages as string)[0] || '/products/placeholder.jpg')
        : item.productImages 
          ? (JSON.parse(item.productImages as string)[0] || '/products/placeholder.jpg')
          : '/products/placeholder.jpg',
      category: item.productCategory,
      sku: item.variantSku,
      inStock: item.variantInStock ?? true,
      addedAt: item.createdAt,
    }))

    return NextResponse.json({ success: true, items: wishlistItems })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

// POST /api/wishlist - Add to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Please login to add to wishlist' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, variantId } = body

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    // Check if already in wishlist
    const existing = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, session.user.id),
          eq(wishlists.productId, productId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: 'Product already in wishlist' }, { status: 400 })
    }

    const [newItem] = await db
      .insert(wishlists)
      .values({
        userId: session.user.id,
        productId,
        variantId: variantId || null,
      })
      .returning()

    return NextResponse.json({ success: true, item: newItem })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json({ success: false, error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

// DELETE /api/wishlist - Remove from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.userId, session.user.id),
          eq(wishlists.productId, productId)
        )
      )

    return NextResponse.json({ success: true, message: 'Removed from wishlist' })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
