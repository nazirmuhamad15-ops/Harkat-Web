'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShoppingCart, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'
import { DiscountBadge } from '@/components/discount-badge'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number
  sku: string
  category: string
  material: string
  color: string
  weight: number
  length: number
  width: number
  height: number
  images: string
  inStock: boolean
  stockCount: number
  salesCount: number
  featured: boolean
  variantId: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('bestseller')
  
  const cart = useCart()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, selectedCategory, sortBy])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/public/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data.products)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    switch (sortBy) {
      case 'bestseller':
        filtered.sort((a, b) => b.salesCount - a.salesCount)
        break
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setFilteredProducts(filtered)
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getProductImages = (imagesJson: string) => {
    try {
      const images = JSON.parse(imagesJson || '[]')
      if (!images || images.length === 0) {
        return ['/products/dining-table-1.jpg']
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-80 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-stone-900 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-[#0058A3] mb-8">Semua Produk</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
            <div className="flex gap-4 w-full md:w-auto">
                 <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Cari produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-full border-stone-200"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px] rounded-full">
                        <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.filter(cat => cat !== 'all').map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] rounded-full">
                    <SelectValue placeholder="Urutan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="bestseller">Paling Laris</SelectItem>
                    <SelectItem value="price-low">Harga Terendah</SelectItem>
                    <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                    <SelectItem value="name">Nama (A-Z)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <div className="inline-block p-4 rounded-full bg-stone-100 mb-4">
                    <Search className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-medium text-stone-900">Produk tidak ditemukan</h3>
                <p className="text-stone-500">Coba kata kunci lain atau ubah filter kategori.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8">
                {filteredProducts.map((product) => {
                    const images = getProductImages(product.images)
                    const mainImage = images[0] || '/products/placeholder.jpg'
                    const discount = product.comparePrice 
                        ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                        : 0
                    return (
                        <div key={product.id} className="group flex flex-col">
                            {/* Image Card */}
                            <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-[#f5f5f5] mb-4">
                                <Image
                                    src={mainImage}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                
                                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                                    {discount > 0 && (
                                       <DiscountBadge percentage={discount} className="shadow-none rounded-sm bg-[#E00751] px-2 py-1 text-[11px]" />
                                    )}
                                    {product.featured && (
                                        <span className="bg-[#FFDB00] text-black font-bold px-2 py-1 text-[11px] uppercase tracking-wider">Terlaris</span>
                                    )}
                                </div>

                                <button 
                                    className="absolute bottom-4 right-4 h-10 w-10 bg-[#0058A3] hover:bg-[#004f93] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-20"
                                    disabled={!product.inStock}
                                    onClick={(e) => {
                                        e.preventDefault() 
                                        handleAddToCart(product)
                                    }}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                </button>
                            </Link>

                            {/* Text Info */}
                            <div className="space-y-1">
                                <Link href={`/products/${product.slug}`} className="group-hover:underline decoration-stone-800 underline-offset-2">
                                    <h3 className="font-bold text-[14px] uppercase tracking-wide text-stone-900 leading-tight">{product.name}</h3>
                                </Link>
                                <div className="text-[13px] text-stone-600 leading-tight">
                                    {product.category}, {product.color}
                                </div>
                                
                                <div className="pt-2 flex flex-col items-start">
                                    {product.comparePrice && (
                                         <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-white bg-[#E00751] px-1.5 py-0.5">
                                                 Hemat {formatPrice(product.comparePrice - product.price)}
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
                                            Lama: <span className="line-through">{formatPrice(product.comparePrice)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>
    </div>
  )
}
