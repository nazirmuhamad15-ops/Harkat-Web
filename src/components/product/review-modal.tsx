'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReviewForm } from './review-form'

interface OrderItem {
  productId: string
  productName: string
  productImage?: string
}

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber: string
  items: OrderItem[]
  onSuccess?: () => void
}

export function ReviewModal({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  items,
  onSuccess,
}: ReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set())

  const currentItem = items[currentIndex]
  const hasNext = currentIndex < items.length - 1
  const allReviewed = reviewedProducts.size === items.length

  const handleReviewSuccess = () => {
    setReviewedProducts(prev => new Set([...prev, currentItem.productId]))
    
    if (hasNext) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onSuccess?.()
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setCurrentIndex(0)
    setReviewedProducts(new Set())
    onOpenChange(false)
  }

  if (!currentItem) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ulas Pesanan #{orderNumber}
          </DialogTitle>
          <DialogDescription>
            Produk {currentIndex + 1} dari {items.length}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Product Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-stone-50 rounded-lg">
            {currentItem.productImage && (
              <img 
                src={currentItem.productImage} 
                alt={currentItem.productName}
                className="w-16 h-16 object-cover rounded-md"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-stone-900 line-clamp-2">
                {currentItem.productName}
              </p>
              {reviewedProducts.has(currentItem.productId) ? (
                <span className="text-sm text-green-600">✓ Sudah diulas</span>
              ) : null}
            </div>
          </div>

          {/* Review Form */}
          {!reviewedProducts.has(currentItem.productId) && (
            <ReviewForm
              productId={currentItem.productId}
              orderId={orderId}
              onSuccess={handleReviewSuccess}
            />
          )}

          {/* Progress Dots */}
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {items.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex
                      ? 'bg-stone-900'
                      : reviewedProducts.has(items[idx].productId)
                        ? 'bg-green-500'
                        : 'bg-stone-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
