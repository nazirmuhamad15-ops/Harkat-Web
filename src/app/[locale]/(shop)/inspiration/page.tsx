'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// Placeholder data for inspiration gallery
const INSPIRATION_ITEMS = [
    { id: 1, title: "Modern Minimalist Living", image: "/inspiration/1.jpg", desc: "Clean lines and neutral tones for a calm atmosphere." },
    { id: 2, title: "Cozy Bedroom Retreat", image: "/inspiration/2.jpg", desc: "Warm lighting and soft textures for ultimate relaxation." },
    { id: 3, title: "Executive Home Office", image: "/inspiration/3.jpg", desc: "Productivity meets elegance with dark wood accents." },
    { id: 4, title: "Open Concept Dining", image: "/inspiration/4.jpg", desc: "Perfect for hosting gatherings and family meals." },
    { id: 5, title: "Reading Corner", image: "/inspiration/5.jpg", desc: "A quiet nook with a comfortable armchair and natural light." },
    { id: 6, title: "Compact Apartment Living", image: "/inspiration/6.jpg", desc: "Smart multifunctional furniture for small spaces." },
]

export default function InspirationPage() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-stone-900">
         <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <Link href="/">
                        <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5"/></Button>
                     </Link>
                     <h1 className="text-xl font-serif font-bold text-stone-900">Harkat Design Journal</h1>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-stone-500 uppercase tracking-widest text-xs font-bold mb-3 block">Gallery</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-stone-900">Inspirasi Ruang</h2>
                <p className="text-lg text-stone-600 leading-relaxed">
                    Temukan ide-ide segar untuk mengubah rumah Anda menjadi tempat yang paling nyaman di dunia.
                    Koleksi kurasi desain interior menggunakan produk Harkat Furniture.
                </p>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {INSPIRATION_ITEMS.map((item) => (
                    <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer">
                        <div className="bg-stone-200 aspect-3/4 relative">
                             {/* Placeholder generic images for now, using Next Image would require real paths */}
                             <div className="absolute inset-0 flex items-center justify-center text-stone-400 bg-stone-100">
                                 <span className="font-serif italic">Image Placeholder {item.id}</span>
                             </div>
                             {/* Overlay */}
                             <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/40 transition-colors duration-300"></div>
                             
                             <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                 <h3 className="text-white font-serif text-xl font-bold mb-1">{item.title}</h3>
                                 <p className="text-stone-200 text-sm">{item.desc}</p>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

             <div className="mt-20 p-12 bg-stone-900 rounded-3xl text-center text-white">
                <h3 className="text-3xl font-serif font-bold mb-4">Ingin Konsultasi Desain?</h3>
                <p className="text-stone-300 mb-8 max-w-xl mx-auto">Tim desainer interior kami siap membantu Anda memilih furnitur yang tepat untuk ruangan Anda.</p>
                <Button className="bg-white text-stone-900 hover:bg-stone-100 rounded-full px-8 h-12">
                    Hubungi Kami via WhatsApp
                </Button>
            </div>
        </main>
    </div>
  )
}
