'use client'

interface PromotionalBannerProps {
  title: string
  subtitle?: string
  validityPeriod?: string
  bgColor?: string
  textColor?: string
}

export function PromotionalBanner({
  title,
  subtitle,
  validityPeriod,
  bgColor = 'bg-[#FFDB00]',
  textColor = 'text-gray-900'
}: PromotionalBannerProps) {
  return (
    <section className={`${bgColor} ${textColor} py-6 md:py-8`}>
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 uppercase tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base mb-2 font-medium max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
        {validityPeriod && (
          <p className="text-xs md:text-sm opacity-80 font-medium">
            {validityPeriod}
          </p>
        )}
      </div>
    </section>
  )
}
