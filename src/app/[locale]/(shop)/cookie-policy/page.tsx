'use client'

import { useState, useEffect } from 'react'

export default function CookiePolicyPage() {
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
        <h1 className="text-3xl font-bold mb-6 text-[#0058A3]">Cookie Policy</h1>
        <p className="text-sm text-stone-500 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-8 text-stone-600 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">1. Identifikasi</h2>
                <p>
                    Kebijakan Cookie ini berlaku untuk penggunaan layanan yang ditawarkan oleh <strong>{siteName}</strong> ("kami", "kita", atau "milik kami") melalui website kami.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">2. Apa itu Cookie?</h2>
                <p>
                    Cookie adalah file teks kecil yang dikirimkan ke dan disimpan di komputer, ponsel pintar, atau perangkat lain milik Anda untuk mengakses internet, setiap kali Anda mengunjungi situs web. Cookie berguna karena memungkinkan situs web mengenali perangkat pengguna.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">3. Bagaimana Kami Menggunakan Cookie</h2>
                <p>
                    Kami menggunakan cookie untuk berbagai alasan, seperti:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li><strong>Cookie Esensial:</strong> Diperlukan agar website berfungsi dengan baik (contoh: keranjang belanja, login).</li>
                    <li><strong>Cookie Analitik:</strong> Membantu kami memahami bagaimana pengunjung berinteraksi dengan website kami (contoh: Google Analytics).</li>
                    <li><strong>Cookie Fungsional:</strong> Mengingat preferensi Anda (contoh: bahasa, lokasi).</li>
                    <li><strong>Cookie Pemasaran:</strong> Melacak aktivitas Anda untuk memberikan iklan yang relevan.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">4. Mengelola Preferensi Cookie</h2>
                <p>
                    Sebagian besar browser web secara otomatis menerima cookie, tetapi Anda biasanya dapat memodifikasi pengaturan browser Anda untuk menolak cookie jika Anda mau. Harap dicatat bahwa menonaktifkan cookie dapat mempengaruhi fungsionalitas layanan kami.
                </p>
                <p className="mt-2">
                    Untuk informasi lebih lanjut tentang cara mengelola cookie, silakan kunjungi fitur bantuan browser Anda.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-stone-900 mb-3">5. Kontak Kami</h2>
                <p>
                    Jika Anda memiliki pertanyaan tentang penggunaan cookie kami, silakan hubungi kami di:
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
