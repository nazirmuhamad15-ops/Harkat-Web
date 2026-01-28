'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DiscountBadge } from '@/components/discount-badge'
import { useTranslations } from 'next-intl'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  price: number
  comparePrice?: number
  images: any
  featured: boolean
  inStock: boolean
  variantId: string
  weight: number
  length: number
  width: number
  height: number
}

interface ProductCatalogProps {
  initialProducts: Product[]
  categories: { name: string; slug: string }[]
  initialCategory: string
}

export function ProductCatalog({ initialProducts, categories, initialCategory }: ProductCatalogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('Home')
  const cart = useCart()
  const [isPending, startTransition] = useTransition()
  
  // Local state for immediate feedback inputs
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const handleCategoryChange = (val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val === 'all') {
      params.delete('category')
    } else {
      params.set('category', val)
    }
    // Reset page on filter change
    params.delete('page')
    
    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false })
    })
  }

  const handleSortChange = (val: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', val)
    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false })
    })
  }
  
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault()
      const params = new URLSearchParams(searchParams)
      if (searchTerm) {
          params.set('search', searchTerm)
      } else {
          params.delete('search')
      }
      startTransition(() => {
        router.push(`/?${params.toString()}`, { scroll: false })
      })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getProductImages = (imagesJson: any) => {
    try {
      const images = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson
      if (!images || images.length === 0) return ['/products/dining-table-1.jpg']
      return images
    } catch {
      return ['/products/dining-table-1.jpg']
    }
  }

  const handleAddToCart = (product: Product) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImages(product.images)[0],
      variantId: product.variantId,
      quantity: 1,
      weight: product.weight,
      length: product.length,
      width: product.width,
      height: product.height,
      selected: true
    })
    toast.success('Added to cart')
  }

  return (
    <section className="py-20 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-stone-500 text-sm font-medium tracking-wider uppercase mb-2 block">{t('catalog.title')}</span>
          <h3 className="text-3xl md:text-4xl font-bold text-stone-900">{t('catalog.subtitle')}</h3>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t('catalog.search')}
              aria-label={t('catalog.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-[280px] rounded-full border-stone-200 bg-transparent focus:bg-white transition-colors"
            />
          </form>
          
          <Select 
            value={searchParams.get('category') || 'all'} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-full border-stone-200" aria-label="Select Category">
              <SelectValue placeholder={t('catalog.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('catalog.allCategories')}</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
           <Select 
            value={searchParams.get('sort') || 'bestseller'} 
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-full border-stone-200" aria-label="Sort By">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bestseller">Best Seller</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem> 
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {initialProducts.length === 0 ? (
          <div className="text-center py-24 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <div className="inline-block p-4 rounded-full bg-stone-100 mb-4">
              <Search className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">{t('catalog.notFound')}</h3>
            <p className="text-stone-500">{t('catalog.notFoundDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8">
            {initialProducts.map((product) => {
              const images = getProductImages(product.images)
              const mainImage = images[0] || '/products/placeholder.jpg'
              const discount = product.comparePrice 
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0
                
              return (
                <div key={product.id} className="group flex flex-col">
                  {/* Image Card */}
                  <div className="relative block aspect-square overflow-hidden bg-[#f5f5f5] mb-4">
                      {/* Using Link only on image click, but maintaining separate cart button */}
                      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-0">
                         <Image
                            src={mainImage}
                            alt={product.name}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                         />
                      </Link>
                    
                    {/* Stickers */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-none">
                      {discount > 0 && (
                        <DiscountBadge percentage={discount} className="shadow-none rounded-sm bg-[#E00751] px-2 py-1 text-[11px]" />
                      )}
                      {product.featured && (
                        <span className="bg-[#FFDB00] text-black font-bold px-2 py-1 text-[11px] uppercase tracking-wider">{t('product.bestseller')}</span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button 
                      className="absolute bottom-4 right-4 h-10 w-10 bg-[#0058A3] hover:bg-[#004f93] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-20"
                      disabled={!product.inStock}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                      aria-label={t('product.addToCart')}
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Text Info */}
                  <div className="space-y-1">
                    <Link href={`/products/${product.slug}`} className="group-hover:underline decoration-stone-800 underline-offset-2">
                      <h3 className="font-bold text-[14px] uppercase tracking-wide text-stone-900 leading-tight">{product.name}</h3>
                    </Link>
                    <div className="text-[13px] text-stone-600 leading-tight">
                      {product.category}
                    </div>
                    
                    {/* Price Section */}
                    <div className="pt-2 flex flex-col items-start">
                      {product.comparePrice && (
                         <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-white bg-[#E00751] px-1.5 py-0.5">
                             {t('product.save')} {formatPrice(product.comparePrice - product.price)}
                          </span>
                         </div>
                      )}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-[20px] font-bold ${discount > 0 ? 'text-[#E00751]' : 'text-black'}`}>
                          <span className="text-xs align-top mr-0.5">Rp</span>
                          {formatPrice(product.price).replace('Rp', '')}
                        </span>
                      </div>
                       {product.comparePrice && (
                        <div className="text-[11px] text-stone-500">
                          {t('product.oldPrice')} <span className="line-through">{formatPrice(product.comparePrice)}</span>
                        </div>
                      )}
                    </div>

                    {discount > 0 && (
                      <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                        Harga berlaku 08 Jan 2026 - 05 Apr 2026
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
