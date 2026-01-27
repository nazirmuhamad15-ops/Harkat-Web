import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { productReviews, users, products } from '@/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/reviews?productId={id} - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 })
    }

    const offset = (page - 1) * limit

    // Get reviews with user info
    const reviews = await db
      .select({
        id: productReviews.id,
        rating: productReviews.rating,
        title: productReviews.title,
        comment: productReviews.comment,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        helpfulCount: productReviews.helpfulCount,
        createdAt: productReviews.createdAt,
        userName: users.name,
        userAvatar: users.image, // Use 'image' instead of 'avatar'
      })
      .from(productReviews)
      .leftJoin(users, eq(productReviews.userId, users.id))
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt))
      .limit(limit)
      .offset(offset)

    // Get review stats
    const statsResult = await db
      .select({
        totalReviews: sql<number>`count(*)::int`,
        avgRating: sql<number>`coalesce(avg(${productReviews.rating}), 0)`,
        rating5: sql<number>`count(*) filter (where ${productReviews.rating} = 5)::int`,
        rating4: sql<number>`count(*) filter (where ${productReviews.rating} = 4)::int`,
        rating3: sql<number>`count(*) filter (where ${productReviews.rating} = 3)::int`,
        rating2: sql<number>`count(*) filter (where ${productReviews.rating} = 2)::int`,
        rating1: sql<number>`count(*) filter (where ${productReviews.rating} = 1)::int`,
      })
      .from(productReviews)
      .where(eq(productReviews.productId, productId))

    const stats = statsResult[0] || {
      totalReviews: 0,
      avgRating: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0,
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        total: stats.totalReviews,
        average: parseFloat(Number(stats.avgRating).toFixed(1)),
        distribution: {
          5: stats.rating5,
          4: stats.rating4,
          3: stats.rating3,
          2: stats.rating2,
          1: stats.rating1,
        },
      },
      pagination: {
        page,
        limit,
        total: stats.totalReviews,
        hasMore: offset + reviews.length < stats.totalReviews,
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Please login to submit a review' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[Reviews API] POST body received:', JSON.stringify(body))
    
    const { productId, orderId, rating, title, comment } = body

    if (!productId || !rating) {
      console.log('[Reviews API] Missing fields - productId:', productId, 'rating:', rating)
      return NextResponse.json({ success: false, error: 'Product ID and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check if user already reviewed this product
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(
        and(
          eq(productReviews.productId, productId),
          eq(productReviews.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingReview.length > 0) {
      return NextResponse.json({ success: false, error: 'You have already reviewed this product' }, { status: 400 })
    }

    // If orderId is provided, this is a verified purchase review
    const isVerifiedPurchase = !!orderId

    // Create review
    const [newReview] = await db
      .insert(productReviews)
      .values({
        productId,
        userId: session.user.id,
        rating,
        title: title || null,
        comment: comment || null,
        isVerifiedPurchase,
      })
      .returning()

    return NextResponse.json({ success: true, review: newReview })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 })
  }
}
