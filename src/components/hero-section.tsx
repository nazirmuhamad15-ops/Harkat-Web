'use client'

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const HERO_SLIDES = [
  {
    id: 1,
    image: "/hero-furniture.jpg",
    title: "Wujudkan Ruang Impian Anda",
    description: "Desain furnitur minimalis premium yang memadukan keindahan estetika dan kenyamanan fungsional.",
    cta: "Belanja Sekarang",
    link: "/products",
    bg: "bg-[#f5f5f5]"
  },
  {
    id: 2,
    // Use an existing product image for bedroom
    image: "/products/bed-1.jpg", 
    title: "Kenyamanan Tidur Terbaik",
    description: "Temukan koleksi kasur dan rangka tempat tidur untuk istirahat yang lebih berkualitas.",
    cta: "Lihat Koleksi",
    link: "/categories/kamar-tidur",
    bg: "bg-[#e5e7eb]"
  },
  {
    id: 3,
    // Use an existing product image for dining/kitchen
    image: "/products/dining-table-1.jpg",
    title: "Ruang Makan Modern",
    description: "Solusi meja makan dan kursi estetik untuk momen bersantap yang lebih hangat.",
    cta: "Inspirasi Ruang Makan",
    link: "/categories/ruang-makan",
    bg: "bg-[#d1d5db]"
  }
]

const CATEGORIES = [
  { name: "Ruang Tamu", slug: "ruang-tamu" },
  { name: "Kamar Tidur", slug: "kamar-tidur" },
  { name: "Ruang Makan", slug: "ruang-makan" },
  { name: "Dapur", slug: "dapur" },
  { name: "Ruang Kerja", slug: "ruang-kerja" },
  { name: "Kamar Mandi", slug: "kamar-mandi" },
  { name: "Outdoor", slug: "outdoor" },
  { name: "Dekorasi", slug: "dekorasi" },
  { name: "Pencahayaan", slug: "pencahayaan" },
  { name: "Tekstil", slug: "tekstil" },
]

export function HeroSection() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const [banners, setBanners] = React.useState<any[]>([])

  // Fetch banners from API
  React.useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/public/banners')
        const data = await res.json()
        if (data.success && data.banners.length > 0) {
          setBanners(data.banners)
        } else {
            setBanners(HERO_SLIDES) // Fallback
        }
      } catch (error) {
        console.error('Failed to fetch banners', error)
        setBanners(HERO_SLIDES) // Fallback
      }
    }
    fetchBanners()
  }, [])

  // Autoplay effect
  React.useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })

    const intervalId = setInterval(() => {
        api.scrollNext()
    }, 5000)

    return () => clearInterval(intervalId)
  }, [api])

  if (banners.length === 0) return null

  return (
    <section className="relative max-w-7xl mx-auto px-0 md:px-6 py-2 md:py-4">
      {/* Hero Carousel - Reduced Height */}
      <div className="w-full h-[250px] md:h-[350px]">
          <Carousel 
            setApi={setApi} 
            className="w-full h-full relative group"
            opts={{
                loop: true,
            }}
          >
            <CarouselContent className="h-full ml-0">
              {banners.map((slide) => (
                <CarouselItem key={slide.id} className="pl-0 h-full">
                  <div className="relative w-full h-full rounded-none md:rounded-lg overflow-hidden bg-gray-200">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                         {/* Fallback pattern if image fails or loading */}
                         <div className={`w-full h-full ${slide.bgColor || slide.bg || 'bg-gray-100'} flex items-center justify-center text-gray-400`}>
                             <span className="sr-only">{slide.title}</span>
                         </div>
                         {slide.image && (
                             <Image 
                                src={slide.image}
                                alt={slide.title}
                                fill
                                className="object-cover object-center"
                                priority={false} // Optimization: Lazy load mostly, verify logic later
                             />
                         )}
                         {/* Overlay for better text readability */}
                         <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Content Box (IKEA Style) - Floating on left bottom or middle */}
                    <div className="absolute inset-0 flex items-center p-6 md:p-12">
                        <div className="max-w-lg bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#0058A3] mb-2 tracking-tight">
                                {slide.title}
                            </h2>
                            {slide.description && (
                                <p className="text-sm md:text-base text-gray-700 mb-4 leading-relaxed line-clamp-2">
                                    {slide.description}
                                </p>
                            )}
                            {slide.link && (
                                <Link href={slide.link}>
                                    <Button size="sm" className="rounded-full bg-[#0058A3] text-white hover:bg-[#004f93] px-6 h-9 font-bold text-sm">
                                        {slide.ctaText || slide.cta || 'Shop Now'}
                                        <ArrowRight className="ml-2 w-3 h-3" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Arrows */}
            <CarouselPrevious className="left-4 bg-white/80 hover:bg-white text-black border-none h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" />
            <CarouselNext className="right-4 bg-white/80 hover:bg-white text-black border-none h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" />
            
            {/* Dots Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                            index === current - 1 
                            ? "bg-white w-6" 
                            : "bg-white/50 hover:bg-white/75"
                        }`}
                        onClick={() => api?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
          </Carousel>
      </div>
    </section>
  )
}
