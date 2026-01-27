'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-stone-900 pb-20">
      {/* Hero */}
      <div className="relative w-full h-[400px] bg-[#0058A3] overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center text-white">
            <h1 className="text-5xl font-bold mb-4">Tentang Harkat Furniture</h1>
            <p className="text-xl max-w-2xl font-light">
                Membawa keindahan dan kenyamanan fungsional ke dalam setiap rumah di Indonesia sejak 2010.
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <div>
                <h2 className="text-3xl font-bold text-[#0058A3] mb-6">Cerita Kami</h2>
                <div className="space-y-4 text-stone-600 leading-relaxed">
                    <p>
                        Bermula dari sebuah bengkel kayu kecil di Jepara, Harkat Furniture tumbuh dengan visi sederhana: membuat furnitur berkualitas tinggi yang dapat diakses oleh banyak orang. Kami percaya bahwa desain yang baik tidak harus mahal.
                    </p>
                    <p>
                        Setiap potong furnitur yang kami buat menggabungkan keahlian pengrajin lokal dengan desain modern minimalis yang terinspirasi dari Skandinavia. Kami berkomitmen untuk menggunakan bahan yang berkelanjutan dan proses produksi yang etis.
                    </p>
                    <p>
                        Nama "Harkat" mencerminkan nilai kami untuk mengangkat martabat dan kenyamanan hidup pelanggan kami melalui ruang yang mereka huni.
                    </p>
                </div>
            </div>
            <div className="relative h-[400px] bg-gray-200 rounded-lg overflow-hidden">
                {/* Fallback pattern */}
                <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-500">
                    Image: Workshop Activity
                </div>
            </div>
        </div>

        {/* Contact Info */}
        <div className="mb-16">
             <h2 className="text-3xl font-bold text-[#0058A3] mb-8 text-center">Hubungi Kami</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center h-full">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <MapPin className="w-6 h-6 text-[#0058A3]" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Lokasi Showroom</h3>
                        <p className="text-stone-600">
                            Jl. Kemang Raya No. 123<br/>
                            Jakarta Selatan, 12730<br/>
                            Indonesia
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center h-full">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <Phone className="w-6 h-6 text-[#0058A3]" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Kontak</h3>
                        <p className="text-stone-600 mb-2">
                           <span className="font-bold">Telepon:</span> +62 21 7890 1234
                        </p>
                        <p className="text-stone-600">
                           <span className="font-bold">WhatsApp:</span> +62 812 3456 7890
                        </p>
                        <p className="text-stone-600 mt-2">
                           <span className="font-bold">Email:</span> hello@harkat.id
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center h-full">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6 text-[#0058A3]" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Jam Operasional</h3>
                        <p className="text-stone-600">
                            <span className="font-bold block mb-1">Senin - Jumat:</span>
                            09:00 - 20:00 WIB
                        </p>
                        <p className="text-stone-600 mt-4">
                            <span className="font-bold block mb-1">Sabtu - Minggu:</span>
                            10:00 - 18:00 WIB
                        </p>
                    </CardContent>
                </Card>
             </div>
        </div>
      </div>
    </div>
  )
}
