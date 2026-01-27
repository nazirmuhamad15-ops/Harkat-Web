'use client'

import { Star, ThumbsUp, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

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

interface ReviewListProps {
  reviews: Review[]
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
}

export function ReviewList({ reviews, onLoadMore, hasMore, loading }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Belum ada review untuk produk ini</p>
        <p className="text-sm text-stone-400 mt-1">Jadilah yang pertama memberikan review!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-stone-100 pb-6 last:border-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
                {review.userAvatar ? (
                  <img 
                    src={review.userAvatar} 
                    alt={review.userName || 'User'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-stone-500 font-medium text-sm">
                    {(review.userName || 'A')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-stone-900">
                  {review.userName || 'Anonymous'}
                </p>
                <div className="flex items-center gap-2">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'w-3.5 h-3.5',
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-stone-200'
                        )}
                      />
                    ))}
                  </div>
                  {/* Date */}
                  <span className="text-xs text-stone-400">
                    {formatDistanceToNow(new Date(review.createdAt), { 
                      addSuffix: true, 
                      locale: id 
                    })}
                  </span>
                </div>
              </div>
            </div>
            {/* Verified Badge */}
            {review.isVerifiedPurchase && (
              <div className="flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                <span>Pembeli Terverifikasi</span>
              </div>
            )}
          </div>

          {/* Content */}
          {review.title && (
            <h4 className="font-medium text-stone-900 mb-1">{review.title}</h4>
          )}
          {review.comment && (
            <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>
          )}

          {/* Helpful Button */}
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-500 hover:text-stone-700 h-8 px-3"
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
              Membantu ({review.helpfulCount})
            </Button>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Lihat lebih banyak'}
          </Button>
        </div>
      )}
    </div>
  )
}
