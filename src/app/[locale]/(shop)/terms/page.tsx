'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TermsPage() {
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    fetch('/api/public/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSettings(data.settings)
      })
      .catch(err => console.error(err))
  }, [])

  const siteName = settings?.site_name || 'Harkat Furniture'
  const siteEmail = settings?.site_email || 'hello@harkat.id'

  return (
    <div className="bg-white min-h-screen py-12 font-sans text-stone-900">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6 text-[#0058A3]">Terms & Conditions</h1>
        <p className="text-sm text-stone-500 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-8 text-stone-600 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">1. Pendahuluan</h2>
                <p>
                    Selamat datang di <strong>{siteName}</strong>. Dengan mengakses situs web ini dan melakukan pemesanan, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Harap membacanya dengan cermat sebelum melakukan transaksi.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">2. Produk & Tampilan</h2>
                <p>
                    Kami berupaya menampilkan warna dan gambar produk kami seakurat mungkin. Namun, kami tidak dapat menjamin bahwa tampilan monitor komputer Anda akan akurat 100%. Karena sifat furnitur buatan tangan dan material alami (seperti kayu), mungkin terdapat sedikit variasi dalam tekstur atau warna.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">3. Pemesanan & Pembayaran</h2>
                <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Semua pesanan tergantung pada ketersediaan stok.</li>
                    <li>Harga yang tertera adalah dalam Rupiah (IDR) dan dapat berubah sewaktu-waktu tanpa pemberitahuan.</li>
                    <li>Pembayaran harus dilunasi sebelum barang dikirim (kecuali metode COD jika tersedia).</li>
                    <li>Kami berhak menolak pesanan jika terdapat kesalahan harga atau informasi produk.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">4. Pengiriman</h2>
                <p>
                    Biaya pengiriman dihitung berdasarkan lokasi dan jarak pengiriman. Nikmati pengiriman GRATIS untuk radius 30km pertama dari workshop kami menggunakan armada internal. Estimasi waktu pengiriman yang diberikan hanyalah perkiraan dan pengiriman dilakukan langsung oleh tim kami untuk menjamin keamanan produk.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">5. Pengembalian & Garansi</h2>
                <p>
                    Sebagai UMKM, kami menerapkan kebijakan ketat mengenai pengembalian barang.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Barang yang sudah dibeli dan diterima dalam kondisi baik tidak dapat dikembalikan atau ditukar.</li>
                    <li>Kami tidak bertanggung jawab atas kerusakan akibat kesalahan perakitan mandiri atau kelalaian penggunaan.</li>
                    <li>Klaim kerusakan saat pengiriman wajib menyertakan video unboxing dalam waktu 2x24 jam setelah barang diterima.</li>
                </ul>
                <p className="mt-2 text-sm italic">
                    Lihat <Link href="/shipping-returns" className="text-[#0058A3] hover:underline">Kebijakan Pengembalian</Link> kami untuk detail lebih lanjut.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">6. Batasan Tanggung Jawab</h2>
                <p>
                    {siteName} tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan produk kami melebihi harga pembelian produk tersebut.
                </p>
            </section>

             <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">7. Hubungi Kami</h2>
                <p>
                    Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini, silakan hubungi kami di:
                </p>
                <p className="mt-2 font-medium">
                    Email: <a href={`mailto:${siteEmail}`} className="text-[#0058A3] hover:underline">{siteEmail}</a>
                </p>
            </section>
        </div>
      </div>
    </div>
  )
}
