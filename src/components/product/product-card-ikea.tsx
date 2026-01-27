'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  stockCount: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  discountPercentage?: number;
  href: string;
  onAddToCart?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export function ProductCardIKEA({
  id,
  name,
  description,
  price,
  originalPrice,
  imageUrl,
  stockCount,
  isBestSeller,
  isNew,
  discountPercentage,
  href,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}: ProductCardProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const isLowStock = stockCount > 0 && stockCount <= 5;
  const isOutOfStock = stockCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Image Container - 1:1 Aspect Ratio */}
      <Link href={href} className="block relative aspect-square bg-gray-50">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isBestSeller && (
            <Badge className="bg-[#E00751] hover:bg-[#E00751] text-white text-xs font-bold px-2 py-1 rounded-sm">
              Produk online terlaris
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-[#0051BA] hover:bg-[#0051BA] text-white text-xs font-bold px-2 py-1 rounded-sm">
              Produk baru
            </Badge>
          )}
          {hasDiscount && discountPercentage && (
            <Badge className="bg-[#FFDA1A] hover:bg-[#FFDA1A] text-gray-900 text-xs font-bold px-2 py-1 rounded-sm">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Favorite Button - Top Right */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite();
            }}
            className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
          >
            <Heart
              className={cn(
                'w-4 h-4',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
          </button>
        )}

        {/* Quick Add to Cart - Bottom Right (Floating) */}
        {onAddToCart && !isOutOfStock && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => {
              e.preventDefault();
              onAddToCart();
            }}
            className="absolute bottom-3 right-3 p-3 bg-[#0051BA] hover:bg-[#003d73] text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <ShoppingCart className="w-5 h-5" />
          </motion.button>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Product Name - ALL CAPS, BOLD (IKEA Style) */}
        <Link href={href}>
          <h3 className="font-bold text-sm uppercase tracking-wide text-gray-900 hover:text-[#0051BA] transition-colors line-clamp-1">
            {name}
          </h3>
        </Link>

        {/* Description - Gray, Normal */}
        <p className="text-xs text-gray-500 line-clamp-2 min-h-10">
          {description}
        </p>

        {/* Price Section */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Current Price - Yellow Badge (IKEA Style) */}
          <div className="inline-block bg-[#FFDA1A] px-3 py-1 rounded-sm">
            <span className="font-bold text-base text-gray-900">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(price)}
            </span>
          </div>

          {/* Original Price (if discounted) */}
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(originalPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="pt-1">
          {isOutOfStock ? (
            <p className="text-xs text-red-600 font-medium">Stok habis</p>
          ) : isLowStock ? (
            <p className="text-xs text-amber-600 font-medium">
              Hanya tersisa {stockCount} unit
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Tersedia lebih banyak pilihan
            </p>
          )}
        </div>

        {/* Add to Cart Button (Mobile - Always Visible) */}
        {onAddToCart && !isOutOfStock && (
          <Button
            onClick={onAddToCart}
            className="w-full bg-[#0051BA] hover:bg-[#003d73] text-white font-semibold rounded-sm mt-2 md:hidden"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Tambah ke keranjang
          </Button>
        )}
      </div>
    </motion.div>
  );
}
