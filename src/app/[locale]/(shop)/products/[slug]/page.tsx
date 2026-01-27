'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ShoppingCart, Heart, Share2, ArrowLeft, Truck, Shield, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { VariantSelector } from '@/components/product/variant-selector'
import { SocialProofBanner } from '@/components/product/social-proof-banner'
import { ReviewSection } from '@/components/product/review-section'
import ReactMarkdown from 'react-markdown'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cart = useCart()
  const wishlist = useWishlist()
  const { data: session } = useSession()
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [activeImage, setActiveImage] = useState('')
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 })

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  const fetchProduct = async (slug: string) => {
    try {
      const res = await fetch(`/api/public/products/${slug}`)
      const data = await res.json()
      
      if (data.success) {
        setProduct(data.product)
        // Default to first variant
        if (data.product.variants && data.product.variants.length > 0) {
            setSelectedVariant(data.product.variants[0])
            // Set initial image
            const images = data.product.images || []
            if (images.length > 0) setActiveImage(images[0])
        }
        // Fetch review stats
        fetchReviewStats(data.product.id)
      } else {
        toast.error('Product not found')
        router.push('/products')
      }
    } catch (error) {
       console.error(error)
       toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewStats = async (productId: string) => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&limit=1`)
      const data = await res.json()
      if (data.success) {
        setReviewStats({ average: data.stats.average, total: data.stats.total })
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
    }
  }

  const handleAddToCart = (redirect = false) => {
    if (!selectedVariant) return

    cart.addItem({
      id: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price: selectedVariant.price,
      image: activeImage || '/products/placeholder.jpg',
      quantity: 1,
      weight: selectedVariant.weight || 0,
      length: selectedVariant.length || 0,
      width: selectedVariant.width || 0,
      height: selectedVariant.height || 0,
      sku: selectedVariant.sku
    })
    
    if (redirect) {
        router.push('/checkout')
    } else {
        toast.success('Added to cart')
    }
  }
  
  const handleBuyNow = () => {
      handleAddToCart(true)
  }
  
  const handleToggleWishlist = () => {
      if (!product) return
      
      if (wishlist.isInWishlist(product.id)) {
          wishlist.removeItem(product.id)
          toast.success('Removed from wishlist')
      } else {
          wishlist.addItem({
              id: product.id,
              name: product.name,
              price: selectedVariant?.price || 0,
              image: activeImage || '/products/placeholder.jpg',
              slug: product.slug,
              variantId: selectedVariant?.id
          })
          toast.success('Added to wishlist')
      }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <Skeleton className="h-[500px] w-full rounded-xl" />
                     <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-12 w-1/3" />
                         <Skeleton className="h-64 w-full" />
                     </div>
                </div>
            </div>
        </div>
    )
  }

  if (!product || !selectedVariant) return null

  const galleryImages = product.images && product.images.length > 0 
      ? product.images 
      : selectedVariant.images && selectedVariant.images.length > 0
          ? selectedVariant.images
          : ['/products/placeholder.jpg']

  // Ensure activeImage is set if not already
  const displayedImage = activeImage || galleryImages[0]
  
  // Transform variants for VariantSelector matches interface
  const formattedVariants = product ? product.variants.map((v: any) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      stockCount: v.stockCount || 0,
      inStock: (v.stockCount || 0) > 0,
      attributes: v.attributes.map((a: any) => ({
          name: a.name,
          value: a.value,
          attributeValueId: a.id || a.value // Fallback to value if ID missing
      })),
      images: v.images
  })) : []

  return (
    <div className="min-h-screen bg-white font-sans text-stone-900 pb-20">

      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Breadcrumb className="mb-8">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="/products">Product</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
            {/* Left: Gallery */}
            <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white border border-stone-100 shadow-sm">
                    <Image
                        src={displayedImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                    />
                     {product.featured && (
                        <Badge className="absolute top-4 left-4 bg-stone-900 text-white border-0">Best Seller</Badge>
                     )}
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {galleryImages.map((img: string, idx: number) => (
                        <button 
                            key={idx} 
                            onClick={() => setActiveImage(img)}
                            className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${displayedImage === img ? 'border-stone-900' : 'border-transparent hover:border-stone-300'}`}
                        >
                            <Image src={img} alt="Thumb" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col">
                <div className="mb-6">
                    <h1 className="text-3xl md:text-5xl font-playfair font-bold text-stone-900 mb-2 uppercase tracking-tight leading-none">{product.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                         <SocialProofBanner 
                            purchaseCount={1200 + Math.floor(Math.random() * 500)}
                            rating={reviewStats.average || 0} 
                            reviewCount={reviewStats.total || 0}
                         />
                    </div>
                     <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                        <span className="bg-stone-100 px-3 py-1 rounded-sm uppercase text-xs font-bold tracking-wider">{product.category}</span>
                        <span>SKU: {selectedVariant.sku}</span>
                    </div>

                    <div className="flex items-baseline gap-4 mt-4">
                         {/* Price as Yellow Badge */}
                         <div className="inline-block bg-[#FFDA1A] px-4 py-2 rounded-sm shadow-sm">
                            <span className="text-3xl font-bold text-stone-900">{formatPrice(selectedVariant.price)}</span>
                         </div>
                    </div>
                </div>

                <div className="prose prose-stone text-stone-600 mb-8 max-w-none">
                    <ReactMarkdown 
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6 text-stone-900" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5 text-stone-900" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-4 text-stone-900" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-justify leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-stone-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-stone-200 pl-4 italic my-4" {...props} />,
                      }}
                    >
                      {product.description}
                    </ReactMarkdown>
                </div>

                {/* Variants Selection */}
                {formattedVariants.length > 0 && (
                    <div className="mb-8">
                        <VariantSelector 
                            variants={formattedVariants}
                            selectedVariantId={selectedVariant.id}
                            onVariantChange={(id) => {
                                const v = product.variants.find((pv: any) => pv.id === id)
                                if (v) {
                                    setSelectedVariant(v)
                                    if (v.images && v.images.length > 0) setActiveImage(v.images[0])
                                }
                            }}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex gap-4">
                        <Button 
                            size="lg" 
                            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white h-14 text-lg rounded-full"
                            disabled={!selectedVariant.inStock}
                            onClick={() => handleAddToCart(false)}
                        >
                            {selectedVariant.inStock ? (
                                <>
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Add to Cart
                                </>
                            ) : 'Out of Stock'}
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            className={`h-14 w-14 rounded-full p-0 flex items-center justify-center border-stone-200 transition-colors ${wishlist.isInWishlist(product?.id) ? 'bg-red-50 border-red-200 text-red-500' : 'text-stone-600 hover:text-red-500 hover:border-red-200'}`}
                            onClick={handleToggleWishlist}
                        >
                            <Heart className={`w-6 h-6 ${wishlist.isInWishlist(product?.id) ? 'fill-current' : ''}`} />
                        </Button>
                    </div>
                    
                    {selectedVariant.inStock && (
                        <Button 
                            size="lg" 
                            className="w-full bg-white border-2 border-stone-900 text-stone-900 hover:bg-stone-50 h-14 text-lg rounded-full font-bold"
                            onClick={handleBuyNow}
                        >
                            Beli Sekarang
                        </Button>
                    )}
                </div>

                {/* Features / Pillars */}
                <div className="grid grid-cols-3 gap-4 mb-8 py-6 border-t border-b border-stone-100">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Truck className="w-5 h-5 text-stone-400" />
                        <span className="text-xs font-medium text-stone-600">Fast Delivery</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Shield className="w-5 h-5 text-stone-400" />
                        <span className="text-xs font-medium text-stone-600">Premium Quality</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <RefreshCw className="w-5 h-5 text-stone-400" />
                        <span className="text-xs font-medium text-stone-600">Easy Return</span>
                    </div>
                </div>

                {/* Details Accordion */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                        <AccordionTrigger className="text-stone-900 font-serif">Product Details</AccordionTrigger>
                        <AccordionContent className="text-stone-600 space-y-2">
                            <div className="flex justify-between py-1 border-b border-stone-50">
                                <span>Material</span>
                                <span className="font-medium text-stone-900">{selectedVariant.attributes.find((a:any) => a.name === 'Material')?.value || 'Standard'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-stone-50">
                                <span>Color</span>
                                <span className="font-medium text-stone-900">{selectedVariant.attributes.find((a:any) => a.name === 'Color' || a.name === 'Warna')?.value || 'Standard'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-stone-50">
                                <span>Finish</span>
                                <span className="font-medium text-stone-900">Matte / Natural</span>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="dimensions">
                        <AccordionTrigger className="text-stone-900 font-serif">Dimensions & Weight</AccordionTrigger>
                        <AccordionContent className="text-stone-600">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs uppercase text-stone-400 font-bold mb-1">Dimensions</p>
                                    <p>{selectedVariant.length} x {selectedVariant.width} x {selectedVariant.height} cm</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-stone-400 font-bold mb-1">Weight</p>
                                    <p>{selectedVariant.weight} kg</p>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="shipping">
                        <AccordionTrigger className="text-stone-900 font-serif">Shipping & Returns</AccordionTrigger>
                        <AccordionContent className="text-stone-600">
                            <p className="mb-2">Free shipping for orders within Jabodetabek area via our own fleet. For other regions, standard shipping rates apply.</p>
                            <p>We accept returns within 7 days of delivery for defective items.</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>

        {/* Reviews Section */}
        {product && (
          <ReviewSection productId={product.id} />
        )}
      </main>
    </div>
  )
}
