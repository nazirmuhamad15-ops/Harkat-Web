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
                    Kami menggunakan armada internal untuk area JABODETABEK untuk menjamin keamanan produk. Untuk luar kota, kami bekerjasama dengan mitra logistik kargo terpercaya.
                </p>
                <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                    <li>JABODETABEK: 3-5 Hari Kerja</li>
                    <li>Pulau Jawa: 5-7 Hari Kerja</li>
                    <li>Luar Jawa: 7-14 Hari Kerja</li>
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
              Biaya pengiriman dihitung berdasarkan berat volumetrik dan lokasi tujuan. Anda dapat melihat estimasi ongkir di halaman Checkout sebelum melakukan pembayaran. Untuk area tertentu di JABODETABEK, kami sering mengadakan promo gratis ongkir.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Apakah bisa dikirim ke luar pulau?</AccordionTrigger>
            <AccordionContent>
              Ya, Harkat Furniture melayani pengiriman ke seluruh Indonesia menggunakan ekspedisi kargo rekanan kami. Pastikan alamat lengkap agar kurir dapat menjangkau lokasi Anda.
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
              Untuk pengiriman dengan armada internal kami (area JABODETABEK), tim kami dapat membantu perakitan ringan. Untuk pengiriman via kargo, barang dikirim dalam bentuk flat-pack (belum dirakit) namun disertai instruksi perakitan yang mudah dipahami.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
