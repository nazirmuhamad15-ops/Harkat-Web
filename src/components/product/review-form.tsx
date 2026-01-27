'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  productId: string
  orderId?: string
  onSuccess?: () => void
}

export function ReviewForm({ productId, orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Pilih rating terlebih dahulu')
      return
    }

    if (!productId) {
      toast.error('Product ID tidak ditemukan')
      console.error('[ReviewForm] productId is missing:', productId)
      return
    }

    setLoading(true)
    console.log('[ReviewForm] Submitting:', { productId, orderId, rating, title, comment })
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderId, rating, title, comment }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Review berhasil dikirim!')
        setRating(0)
        setTitle('')
        setComment('')
        onSuccess?.()
      } else {
        toast.error(data.error || 'Gagal mengirim review')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors',
                  (hoverRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-stone-300'
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-stone-500 self-center">
              {rating === 1 && 'Sangat Buruk'}
              {rating === 2 && 'Buruk'}
              {rating === 3 && 'Cukup'}
              {rating === 4 && 'Baik'}
              {rating === 5 && 'Sangat Baik'}
            </span>
          )}
        </div>
      </div>

      {/* Title (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="review-title" className="text-sm font-medium">
          Judul Review <span className="text-stone-400">(opsional)</span>
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ringkasan pengalaman Anda"
          className="h-10"
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="review-comment" className="text-sm font-medium">
          Ulasan
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda dengan produk ini..."
          rows={4}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full bg-stone-900 hover:bg-stone-800"
      >
        {loading ? 'Mengirim...' : 'Kirim Review'}
      </Button>
    </form>
  )
}
