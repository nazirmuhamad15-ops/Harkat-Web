'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewSummaryProps {
  average: number
  total: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export function ReviewSummary({ average, total, distribution }: ReviewSummaryProps) {
  const maxCount = Math.max(...Object.values(distribution), 1)

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 bg-stone-50 rounded-xl">
      {/* Average Rating */}
      <div className="flex flex-col items-center justify-center min-w-[140px]">
        <div className="text-5xl font-bold text-stone-900">{average.toFixed(1)}</div>
        <div className="flex gap-0.5 my-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-5 h-5',
                star <= Math.round(average)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-stone-200'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-stone-500">
          {total.toLocaleString('id-ID')} ulasan
        </p>
      </div>

      {/* Distribution Bars */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating as keyof typeof distribution]
          const percentage = total > 0 ? (count / total) * 100 : 0
          const barWidth = (count / maxCount) * 100

          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12 shrink-0 justify-end">
                <span className="text-sm font-medium text-stone-600">{rating}</span>
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="w-16 text-right shrink-0">
                <span className="text-xs text-stone-500">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
