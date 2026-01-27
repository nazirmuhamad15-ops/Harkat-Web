import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { productReviews } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if the review belongs to the user
    const [existingReview] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, id))
      .limit(1)

    if (!existingReview) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'You can only delete your own reviews' }, { status: 403 })
    }

    await db.delete(productReviews).where(eq(productReviews.id, id))

    return NextResponse.json({ success: true, message: 'Review deleted' })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 })
  }
}

// PATCH /api/reviews/[id] - Update a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { rating, title, comment } = body

    // Check if the review belongs to the user
    const [existingReview] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, id))
      .limit(1)

    if (!existingReview) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'You can only edit your own reviews' }, { status: 403 })
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const [updatedReview] = await db
      .update(productReviews)
      .set({
        rating: rating || existingReview.rating,
        title: title !== undefined ? title : existingReview.title,
        comment: comment !== undefined ? comment : existingReview.comment,
        updatedAt: new Date(),
      })
      .where(eq(productReviews.id, id))
      .returning()

    return NextResponse.json({ success: true, review: updatedReview })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ success: false, error: 'Failed to update review' }, { status: 500 })
  }
}
