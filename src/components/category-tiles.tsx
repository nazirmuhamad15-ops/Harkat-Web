'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Category {
  name: string
  slug: string
  image: string
  count?: number
}

interface CategoryTilesProps {
  categories: Category[]
}

function CategoryTile({ category }: { category: Category }) {
  const [imageError, setImageError] = useState(false)
  
  const hasValidImage = category.image && 
    category.image.trim() !== '' && 
    (category.image.startsWith('http') || category.image.startsWith('/'))

  return (
    <Link
      href={`/?category=${category.slug}`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-[#f5f5f5] mb-2">
        {hasValidImage && !imageError ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-stone-100 to-stone-200" role="img" aria-label={`${category.name} category placeholder`}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-stone-300 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-left">
        <span className="text-sm md:text-base font-bold text-gray-900 group-hover:underline decoration-gray-900 underline-offset-2">
          {category.name}
        </span>
        {category.count && (
          <p className="text-xs text-stone-500">{category.count} produk</p>
        )}
      </div>
    </Link>
  )
}

export function CategoryTiles({ categories }: CategoryTilesProps) {
  const t = useTranslations('Home')
  
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t('category.title')}
          </h3>
          <p className="text-gray-600">
            {t('category.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryTile key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}

