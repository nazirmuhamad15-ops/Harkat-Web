'use client'

interface DiscountBadgeProps {
  percentage: number
  className?: string
}

export function DiscountBadge({ percentage, className = '' }: DiscountBadgeProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center px-3 py-1.5 bg-[#E00751] text-white font-bold text-xs rounded-md shadow-md ${className}`}
    >
      -{percentage}%
    </div>
  )
}
