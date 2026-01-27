import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, UserCheck, CreditCard, Truck } from 'lucide-react'

export default function HowToOrderPage() {
  const steps = [
    {
      icon: ShoppingCart,
      title: "1. Pilih Produk",
      description: "Jelajahi katalog kami dan pilih produk furniture yang Anda inginkan. Klik tombol 'Tambah ke Keranjang' atau icon keranjang."
    },
    {
      icon: UserCheck,
      title: "2. Isi Data Pengiriman",
      description: "Lengkapi formulir checkout dengan nama, nomor telepon, dan alamat lengkap pengiriman. Pastikan data akurat untuk kelancaran pengiriman."
    },
    {
      icon: CreditCard,
      title: "3. Lakukan Pembayaran",
      description: "Pilih metode pembayaran yang mudah (Transfer Bank, QRIS, atau Virtual Account). Selesaikan pembayaran sesuai instruksi."
    },
    {
      icon: Truck,
      title: "4. Konfirmasi & Tunggu Barang",
      description: "Pesanan Anda akan diverifikasi otomatis. Tim kami akan menyiapkan dan mengirimkan barang ke alamat Anda. Anda bisa melacak statusnya di menu 'Lacak Paket'."
    }
  ]

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-2 text-stone-900">Cara Pemesanan</h1>
        <p className="text-stone-600 mb-12">Panduan mudah berbelanja furniture berkualitas di Harkat Furniture.</p>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6 group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-[#0058AB] transition-colors duration-300">
                  <step.icon className="w-6 h-6 text-stone-600 group-hover:text-white" />
                </div>
                {index !== steps.length - 1 && (
                  <div className="w-0.5 h-full bg-stone-200 mx-auto mt-2" />
                )}
              </div>
              <div className="pb-8">
                <h3 className="text-xl font-bold text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-600 leading-relaxed max-w-xl">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-stone-50 rounded-xl border border-stone-200">
            <h3 className="font-bold text-stone-900 mb-2">Butuh Bantuan?</h3>
            <p className="text-stone-600 mb-4">Tim layanan pelanggan kami siap membantu Anda setiap hari kerja.</p>
            <a href="https://wa.me/6281234567890" target="_blank" className="text-[#0058AB] font-bold hover:underline">
                Hubungi via WhatsApp &rarr;
            </a>
        </div>
      </div>
    </div>
  )
}
