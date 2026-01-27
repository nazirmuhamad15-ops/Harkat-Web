'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ReviewForm } from './review-form'
import { ReviewList } from './review-list'
import { ReviewSummary } from './review-summary'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'

interface ReviewSectionProps {
  productId: string
}

interface ReviewStats {
  total: number
  average: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  isVerifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  userName: string | null
  userAvatar: string | null
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { data: session, status } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    average: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchReviews = useCallback(async (pageNum: number, append = false) => {
    if (!productId) return // Guard: don't fetch without productId
    
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&page=${pageNum}&limit=5`)
      const data = await res.json()

      if (data.success) {
        setReviews(prev => append ? [...prev, ...data.reviews] : data.reviews)
        setStats(data.stats)
        setHasMore(data.pagination.hasMore)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchReviews(1)
    } else {
      setLoading(false)
    }
  }, [fetchReviews, productId])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviews(nextPage, true)
  }

  const handleReviewSuccess = () => {
    setShowForm(false)
    setPage(1)
    fetchReviews(1)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-stone-100 rounded w-1/4" />
        <div className="h-32 bg-stone-100 rounded" />
        <div className="h-24 bg-stone-100 rounded" />
      </div>
    )
  }

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-playfair font-bold text-stone-900">
          Ulasan Pelanggan
        </h2>
        {session && !showForm && (
          <Button
            variant="outline"
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Tulis Review
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      {stats.total > 0 && (
        <div className="mb-8">
          <ReviewSummary
            average={stats.average}
            total={stats.total}
            distribution={stats.distribution}
          />
        </div>
      )}

      {/* Review Form */}
      {showForm && session && (
        <div className="mb-8 p-6 bg-white border border-stone-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-stone-900">Tulis Ulasan</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Batal
            </Button>
          </div>
          <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
        </div>
      )}

      {/* Login Prompt */}
      {status !== 'loading' && !session && (
        <div className="mb-8 p-6 bg-stone-50 rounded-xl text-center">
          <p className="text-stone-600 mb-3">Login untuk memberikan ulasan</p>
          <Link href="/auth/login">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      )}

      <Separator className="my-6" />

      {/* Review List */}
      <ReviewList
        reviews={reviews}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
      />
    </section>
  )
}
