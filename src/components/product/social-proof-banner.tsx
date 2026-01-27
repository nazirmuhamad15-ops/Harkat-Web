'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProofBannerProps {
  purchaseCount?: number;
  rating?: number;
  reviewCount?: number;
  trendingScore?: number;
  className?: string;
}

export function SocialProofBanner({
  purchaseCount,
  rating,
  reviewCount,
  trendingScore,
  className,
}: SocialProofBannerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Purchase Count Banner (IKEA Style - Yellow Background) */}
      {purchaseCount && purchaseCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#FFDA1A] px-4 py-3 rounded-sm flex items-center gap-3 shadow-sm"
        >
          <Users className="w-5 h-5 text-gray-900 shrink-0" />
          <span className="font-semibold text-sm text-gray-900">
            {purchaseCount.toLocaleString('id-ID')} orang telah membeli produk ini
          </span>
        </motion.div>
      )}

      {/* Rating & Reviews */}
      {rating && rating > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 px-4 py-3 rounded-sm flex items-center gap-3"
        >
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-lg text-gray-900">{rating.toFixed(1)}</span>
          </div>
          {reviewCount && (
            <span className="text-sm text-gray-500">
              ({reviewCount.toLocaleString('id-ID')} ulasan)
            </span>
          )}
        </motion.div>
      )}

      {/* Trending Indicator */}
      {trendingScore && trendingScore > 70 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-linear-to-r from-orange-100 to-red-100 border border-orange-200 px-4 py-3 rounded-sm flex items-center gap-3"
        >
          <TrendingUp className="w-5 h-5 text-orange-600 shrink-0" />
          <div>
            <span className="font-semibold text-sm text-orange-900 block">
              Sedang trending!
            </span>
            <span className="text-xs text-orange-700">
              Produk ini banyak dilihat minggu ini
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
