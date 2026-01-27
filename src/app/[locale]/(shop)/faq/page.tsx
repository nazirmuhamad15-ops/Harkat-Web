import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  const faqs = [
    {
      q: "Apakah barang Ready Stock?",
      a: "Sebagian besar produk yang tampil di website adalah Ready Stock. Jika status produk Pre-Order, akan tertera keterangan estimasi waktu pengerjaan di halaman produk."
    },
    {
      q: "Bagaimana cara melacak pesanan saya?",
      a: "Anda dapat melacak status pesanan melalui menu 'Lacak Paket' di bagian bawah website dengan memasukkan nomor pesanan atau nomor resi yang Anda terima via email/WhatsApp."
    },
    {
      q: "Metode pembayaran apa saja yang tersedia?",
      a: "Kami menerima pembayaran via Transfer Bank (BCA, Mandiri, BNI, BRI), QRIS, dan E-Wallet (GoPay, OVO). Pembayaran aman dan terverifikasi otomatis."
    },
    {
      q: "Apakah bisa Custom Furniture?",
      a: "Untuk saat ini kami fokus pada produk katalog yang tersedia. Namun untuk pembelian dalam jumlah besar (proyek/kantor), Anda dapat menghubungi tim sales kami untuk diskusi lebih lanjut."
    },
    {
      q: "Apakah ada garansi produk?",
      a: "Ya, kami memberikan garansi 1 tahun untuk kerangka kayu dan busa terhadap cacat produksi. Garansi tidak mencakup kerusakan akibat pemakaian (human error), bencana alam, atau keausan normal."
    },
    {
        q: "Bagaimana jika saya ingin membatalkan pesanan?",
        a: "Pembatalan pesanan hanya dapat dilakukan jika barang belum diproses kirim. Silakan hubungi Customer Service kami sesegera mungkin."
    }
  ]

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-2 text-stone-900 text-center">Frequently Asked Questions</h1>
        <p className="text-stone-600 mb-12 text-center">Jawaban untuk pertanyaan yang sering diajukan pelanggan.</p>

        <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 data-[state=open]:bg-stone-50 transition-colors">
                    <AccordionTrigger className="text-left font-medium text-stone-900 hover:no-underline">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-stone-600 leading-relaxed pb-4">
                        {faq.a}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

        <div className="mt-12 text-center">
            <p className="text-stone-600">Masih punya pertanyaan lain?</p>
            <a href="https://wa.me/6281234567890" className="text-[#0058AB] font-bold hover:underline">Hubungi Kami</a>
        </div>
      </div>
    </div>
  )
}
