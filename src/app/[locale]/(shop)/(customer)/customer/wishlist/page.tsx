'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlist, WishlistItem } from '@/hooks/use-wishlist'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface WishlistApiItem {
  id: string
  productId: string
  variantId: string | null
  name: string
  slug: string
  price: number
  image: string
  category: string
  sku: string
  inStock: boolean
  addedAt: string
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const wishlist = useWishlist()
  const cart = useCart()
  
  const [dbItems, setDbItems] = useState<WishlistApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Sync localStorage wishlist to database on mount (if logged in)
  const syncWishlistToDb = useCallback(async () => {
    if (!session?.user?.id || wishlist.items.length === 0) return

    setSyncing(true)
    try {
      // Add each localStorage item to database
      for (const item of wishlist.items) {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.id,
            variantId: item.variantId,
          }),
        })
      }
    } catch (error) {
      console.error('Error syncing wishlist:', error)
    } finally {
      setSyncing(false)
    }
  }, [session?.user?.id, wishlist.items])

  // Fetch wishlist from database
  const fetchWishlist = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wishlist')
      const data = await res.json()

      if (data.success) {
        setDbItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      // Show localStorage wishlist for non-logged in users
      setLoading(false)
      return
    }

    // Sync and fetch
    syncWishlistToDb().then(() => fetchWishlist())
  }, [session, status, syncWishlistToDb, fetchWishlist])

  const handleRemove = async (item: WishlistApiItem | WishlistItem) => {
    const productId = 'productId' in item ? item.productId : item.id

    // Remove from localStorage
    wishlist.removeItem('productId' in item ? item.productId : item.id)

    // Remove from database if logged in
    if (session) {
      try {
        await fetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' })
        setDbItems(prev => prev.filter(i => i.productId !== productId))
      } catch (error) {
        console.error('Error removing from wishlist:', error)
      }
    }

    toast.success('Dihapus dari wishlist')
  }

  const handleAddToCart = (item: WishlistApiItem | WishlistItem) => {
    const isDbItem = 'productId' in item
    
    cart.addItem({
      id: isDbItem ? item.productId : item.id,
      variantId: item.variantId || '',
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      sku: isDbItem ? item.sku : '',
    })

    toast.success('Ditambahkan ke keranjang')
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Determine which items to display
  const items: (WishlistApiItem | WishlistItem)[] = session ? dbItems : wishlist.items

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-square w-full mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 mx-auto text-stone-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Wishlist Kosong</h1>
        <p className="text-stone-500 mb-6">
          Simpan produk favorit Anda untuk dilihat nanti
        </p>
        <Link href="/products">
          <Button className="gap-2">
            Mulai Belanja
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Wishlist ({items.length})
        </h1>
        {syncing && (
          <span className="text-sm text-stone-500">Menyinkronkan...</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const isDbItem = 'productId' in item
          const slug = isDbItem ? item.slug : item.slug
          const productId = isDbItem ? item.productId : item.id

          return (
            <Card key={productId} className="group overflow-hidden">
              <CardContent className="p-0">
                {/* Image */}
                <Link href={`/products/${slug}`}>
                  <div className="relative aspect-square bg-stone-100 overflow-hidden">
                    <Image
                      src={item.image || '/products/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/products/${slug}`}>
                    <h3 className="font-medium text-stone-900 mb-1 line-clamp-2 hover:text-stone-700">
                      {item.name}
                    </h3>
                  </Link>
                  
                  <p className="text-lg font-bold text-stone-900 mb-4">
                    {formatPrice(item.price)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-stone-900 hover:bg-stone-800 gap-2"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Keranjang
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemove(item)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
