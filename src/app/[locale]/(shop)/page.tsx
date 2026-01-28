import { Suspense } from 'react'
import { Truck, Shield, RefreshCw } from 'lucide-react'
import { PromotionalBanner } from '@/components/promotional-banner'
import { CategoryTiles } from '@/components/category-tiles'
import { HeroSection } from '@/components/hero-section'
import { getTranslations } from 'next-intl/server'
import { DataService } from '@/lib/data-service'
import { ProductCatalog } from '@/components/shop/product-catalog'

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// export const dynamic = 'force-dynamic' // Removed for performance
export const revalidate = 60 // ISR: Revalidate every 60 seconds

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams
  const t = await getTranslations('Home')
  
  // Parse params
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'bestseller'
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined
  
  // Parallel Data Fetching
  const [productsData, categories, banners] = await Promise.all([
    DataService.getProducts({
      category: category === 'all' ? undefined : category,
      sort,
      search,
      page: 1,
      limit: 12
    }),
    DataService.getCategories(),
    DataService.getBanners()
  ])

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-stone-900">
      <main>
        {/* Modern Hero Section (Carousel + Sidebar) */}
        <HeroSection initialBanners={banners} />

        {/* Promotional Banner */}
        <PromotionalBanner 
          title={t('promo.title')}
          subtitle={t('promo.subtitle')}
          validityPeriod="08 Jan 2026 - 05 Apr 2026 atau selama persediaan masih ada"
        />

        {/* Category Tiles - Server Rendered */}
        <CategoryTiles 
          categories={categories.map(c => ({
              name: c.name,
              slug: c.slug,
              image: c.image || '/placeholder.jpg'
          }))}
        />

        {/* Value Props (Pillars) - Static Server Content */}
        <section className="py-12 border-b border-stone-100 bg-white">
             <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 transition-colors">
                    <div className="p-3 rounded-full bg-stone-100 text-stone-700">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1">{t('values.shipping.title')}</h4>
                        <p className="text-sm text-stone-500 leading-relaxed">{t('values.shipping.desc')}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 transition-colors">
                    <div className="p-3 rounded-full bg-stone-100 text-stone-700">
                         <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1">{t('values.quality.title')}</h4>
                        <p className="text-sm text-stone-500 leading-relaxed">{t('values.quality.desc')}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 transition-colors">
                     <div className="p-3 rounded-full bg-stone-100 text-stone-700">
                         <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1">{t('values.service.title')}</h4>
                        <p className="text-sm text-stone-500 leading-relaxed">{t('values.service.desc')}</p>
                    </div>
                </div>
             </div>
        </section>

        {/* Product Catalog - Client Interactive Component with Server Data */}
        <Suspense fallback={<div className="h-96 w-full flex items-center justify-center">Loading products...</div>}>
           <ProductCatalog 
              initialProducts={productsData.products} 
              categories={categories}
              initialCategory={category || 'all'}
           />
        </Suspense>

      </main>
    </div>
  )
}