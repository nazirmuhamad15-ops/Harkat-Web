import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react'

export default function ShippingReturnsPage() {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-2 text-stone-900">Info Pengiriman & Pengembalian</h1>
        <p className="text-stone-600 mb-12">Informasi lengkap mengenai layanan pengiriman dan kebijakan retur kami.</p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="p-6 bg-[#f5f5f5] rounded-xl">
                <Truck className="w-8 h-8 text-[#0058AB] mb-4" />
                <h3 className="text-xl font-bold mb-2">Metode Pengiriman</h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                    Kami menggunakan armada internal Harkat Furniture untuk seluruh pengiriman guna menjamin keamanan produk. Khusus untuk radius 30km pertama dari workshop kami, pengiriman tersedia secara GRATIS.
                </p>
                <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                    <li>Radius &lt; 30km: GRATIS (1-3 Hari)</li>
                    <li>Luar Radius 30km: Biaya disesuaikan (3-7 Hari)</li>
                    <li>Pengiriman oleh tim internal kami</li>
                </ul>
            </div>
            <div className="p-6 bg-[#f5f5f5] rounded-xl">
                <RotateCcw className="w-8 h-8 text-[#0058AB] mb-4" />
                <h3 className="text-xl font-bold mb-2">Kebijakan Pengembalian</h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                    Kepuasan Anda adalah prioritas kami. Anda dapat mengajukan pengembalian barang jika produk yang diterima cacat, rusak, atau tidak sesuai pesanan.
                </p>
                <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                    <li>Batas klaim: 2x24 jam setelah diterima</li>
                    <li>Wajib menyertakan video unboxing</li>
                    <li>Kondisi barang belum dirakit/dipakai</li>
                </ul>
            </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-stone-900">Pertanyaan Umum Pengiriman</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Berapa biaya pengiriman ke lokasi saya?</AccordionTrigger>
            <AccordionContent>
              Biaya pengiriman dihitung berdasarkan jarak lokasi tujuan. Kami memberikan fasilitas GRATIS ONGKIR untuk pengiriman dalam radius 30km pertama dari workshop kami menggunakan armada internal.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Apakah bisa dikirim ke luar pulau?</AccordionTrigger>
            <AccordionContent>
              Harkat Furniture melayani pengiriman ke berbagai wilayah yang terjangkau oleh armada internal kami. Kami memastikan setiap barang diantar sendiri oleh tim kami untuk menjamin keamanan hingga sampai di lokasi Anda.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Bagaimana jika barang sampai dalam keadaan rusak?</AccordionTrigger>
            <AccordionContent>
              Segera hubungi Customer Service kami via WhatsApp maksimal 2x24 jam setelah barang diterima dengan melampirkan foto kerusakan dan video unboxing. Kami akan segera memproses penggantian komponen yang rusak atau tukar unit baru (syarat & ketentuan berlaku).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Apakah kurir akan membantu merakit furniture?</AccordionTrigger>
            <AccordionContent>
              Karena kami menggunakan armada internal, tim kami akan membantu perakitan produk di lokasi Anda (khusus untuk produk yang memerlukan perakitan). Anda tidak perlu khawatir mengenai instruksi perakitan yang rumit.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
