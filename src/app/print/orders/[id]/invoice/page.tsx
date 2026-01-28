'use client'

import { useState, useEffect, use } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, Download, Package, MapPin, Phone, StickyNote, Mail } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  productName: string
  quantity: number
  price: number
  total: number
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [printMode, setPrintMode] = useState<'invoice' | 'label'>('invoice')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [resOrder, resSettings] = await Promise.all([
        fetch(`/api/admin/orders/${id}`),
        fetch(`/api/admin/settings`)
      ])

      if (resOrder.ok) {
        const data = await resOrder.json()
        setOrder(data.order)
      } else {
        const err = await resOrder.text()
        setErrorDetails(`Error ${resOrder.status}: ${err}`)
      }

      if (resSettings.ok) {
         const dataS = await resSettings.json()
         setStore(dataS.settings?.store)
      }

    } catch (e: any) {
      console.error(e)
      setErrorDetails(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = (mode: 'invoice' | 'label') => {
    setPrintMode(mode)
    setTimeout(() => {
        window.print()
    }, 300)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0)
  }

  const getAddressParts = (jsonStr: string) => {
      try {
          return JSON.parse(jsonStr)
      } catch (e) {
          return null
      }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
        <p className="text-stone-600 font-medium animate-pulse">Memuat Data Invoice...</p>
      </div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6 font-sans">
      <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 mb-2">Order Tidak Ditemukan</h2>
        <p className="text-stone-500 text-sm mb-6">Detail pesanan tidak dapat diakses atau telah dihapus.</p>
        <Link href="/admin/sales/orders">
          <Button variant="outline" className="w-full">Kembali</Button>
        </Link>
      </div>
    </div>
  )

  const address = getAddressParts(order.shippingAddress)
  const storeName = store?.name || 'Harkat Furniture'
  const storeAddr = store?.address || 'Jl. Raya Parung No. 123'
  const storeCity = store?.city || 'Bogor'
  const storeProv = store?.province || 'Jawa Barat'
  const storeZip = store?.postalCode || '16610'
  const storePhone = store?.phone || '+62 812 3456 7890'
  const storeEmail = store?.email || 'admin@harkatfurniture.web.id'

  return (
    <div className="min-h-screen bg-stone-100 p-6 sm:p-12 print:p-0 print:bg-white flex flex-col items-center font-sans text-stone-900">
      
      {/* --- CONTROLS (Screen Only) --- */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between w-full max-w-[210mm] gap-4 print:hidden">
        <Link href="/admin/sales/orders">
          <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900 hover:bg-stone-200/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
        
        <div className="flex bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
            <Button 
                variant={printMode === 'invoice' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setPrintMode('invoice')}
                className="text-xs"
            >
                Preview Invoice
            </Button>
            <Button 
                variant={printMode === 'label' ? 'secondary' : 'ghost'}
                size="sm" 
                onClick={() => setPrintMode('label')}
                className="text-xs"
            >
                Preview Label
            </Button>
        </div>

        <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={() => handlePrint('label')}
                className="bg-white border-stone-300 hover:bg-stone-50 text-stone-700 font-medium"
            >
                <StickyNote className="mr-2 h-4 w-4 text-amber-500" />
                Print Label (A6)
            </Button>
            <Button 
                onClick={() => handlePrint('invoice')}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md"
            >
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice (A4)
            </Button>
        </div>
      </div>

      {/* --- A4 INVOICE TEMPLATE --- */}
      <div 
        className={`w-[210mm] min-h-[297mm] bg-white text-base leading-normal shadow-2xl print:shadow-none print:w-full print:min-h-0 overflow-hidden relative transition-all duration-300 ${printMode === 'label' ? 'hidden print:hidden' : 'block print:block'}`}
      >
        <div className="p-12 flex flex-col h-full min-h-[297mm]">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-stone-900 pb-8 mb-8">
                <div>
                   <h1 className="text-4xl font-black tracking-tight text-stone-900 mb-1 uppercase">{storeName}</h1>
                   <p className="text-xs font-bold tracking-[0.3em] text-stone-500 uppercase">Premium Furniture</p>
                   
                   <div className="mt-6 text-sm text-stone-600 space-y-1">
                       <p className="font-bold text-stone-900">{storeName} Store</p>
                       <p>{storeAddr}</p>
                       <p>{storeCity}, {storeProv}, {storeZip}</p>
                       <p>{storePhone}</p>
                       <p className="text-xs text-stone-400">{storeEmail}</p>
                   </div>
                </div>
                <div className="text-right">
                    <div className="inline-block bg-stone-900 text-white px-6 py-2 mb-4">
                        <span className="text-xl font-bold tracking-widest uppercase">INVOICE</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-stone-900">#{order.orderNumber}</p>
                        <p className="text-sm text-stone-500">
                            Date: {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="pt-2">
                             <Badge variant="outline" className={`font-bold uppercase tracking-wider ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                 {order.paymentStatus}
                             </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To / Ship To Grid */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-100 pb-2">Bill To</h3>
                    <div className="space-y-1">
                        <p className="text-lg font-bold text-stone-900">{order.customerName}</p>
                        <p className="text-stone-600">{order.customerEmail}</p>
                        <p className="text-stone-600">{order.customerPhone}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-100 pb-2">Ship To</h3>
                    {address ? (
                        <div className="space-y-1">
                            <p className="font-bold text-stone-900">{address.address}</p>
                            <p className="text-stone-600">{address.city}, {address.province}</p>
                            <p className="text-stone-600 font-medium">ZIP: {address.zip}</p>
                        </div>
                    ) : (
                        <p className="text-stone-600 italic">{order.shippingAddress}</p>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-900">
                            <th className="py-4 text-xs font-black uppercase tracking-widest text-stone-500 w-[50%]">Item Description</th>
                            <th className="py-4 text-xs font-black uppercase tracking-widest text-stone-500 text-center w-[15%]">Qty</th>
                            <th className="py-4 text-xs font-black uppercase tracking-widest text-stone-500 text-right w-[20%]">Price</th>
                            <th className="py-4 text-xs font-black uppercase tracking-widest text-stone-500 text-right w-[15%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {order.items.map((item: OrderItem, idx: number) => (
                            <tr key={idx} className="group">
                                <td className="py-4 pr-4">
                                    <p className="font-bold text-stone-900">{item.productName}</p>
                                    <p className="text-xs text-stone-400 mt-0.5">Furniture Item</p>
                                </td>
                                <td className="py-4 text-center text-stone-900 font-medium">{item.quantity}</td>
                                <td className="py-4 text-right text-stone-600 font-medium">{formatPrice(item.price)}</td>
                                <td className="py-4 text-right text-stone-900 font-bold">{formatPrice(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Totals */}
            <div className="mt-8 border-t-2 border-stone-900 pt-8 flex flex-col sm:flex-row justify-between items-start gap-12">
                <div className="max-w-sm">
                    <h4 className="text-xs font-bold uppercase text-stone-900 mb-2">Notes & Terms</h4>
                    <p className="text-[10px] text-stone-500 leading-relaxed text-justify italic">
                        Terima kasih telah berbelanja di {storeName} (UMKM Indonesia).
                        Barang yang sudah dibeli dan diterima dalam kondisi baik tidak dapat dikembalikan atau ditukar. 
                        Kerusakan akibat kesalahan pemakaian/perakitan mandiri bukan tanggung jawab kami.
                    </p>
                    <div className="mt-8">
                         <p className="text-[10px] uppercase font-bold text-stone-400 mb-6">Authorized Signature</p>
                         <div className="h-0.5 w-40 bg-stone-300"></div>
                    </div>
                </div>

                <div className="w-full max-w-xs space-y-3">
                    <div className="flex justify-between text-stone-600 text-sm">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 text-sm">
                        <span>Shipping</span>
                        <span className="font-medium">{formatPrice(order.shippingCost)}</span>
                    </div>
                    <div className="h-px bg-stone-200 my-2"></div>
                    <div className="flex justify-between items-center text-stone-900">
                        <span className="text-xl font-black uppercase tracking-tight">Total</span>
                        <span className="text-2xl font-black">{formatPrice(order.total)}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- A6 LABEL TEMPLATE --- */}
      <div 
        className={`w-[105mm] h-[148mm] bg-white border border-stone-200 shadow-xl print:shadow-none print:border-none print:w-full print:h-full p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 font-sans ${printMode === 'invoice' ? 'hidden print:hidden' : 'block print:block'}`}
      >
         {/* Sender (Top) */}
         <div className="border-b-2 border-stone-900 pb-3 mb-4">
             <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-stone-900" />
                <p className="text-xs font-black uppercase tracking-wider">{storeName} LOGISTICS</p>
             </div>
             <p className="text-[10px] text-stone-600 leading-tight w-3/4">
                 {storeAddr}, {storeCity} {storeZip} ({storePhone})
             </p>
         </div>

         {/* Recipient (Middle - HUGE) */}
         <div className="flex-1 flex flex-col justify-center mb-4">
             <div className="flex items-center gap-2 mb-2 text-stone-500">
                 <span className="text-[10px] font-bold uppercase tracking-widest border border-stone-300 px-1 rounded">Penerima</span>
             </div>
             <p className="text-lg font-black text-stone-900 leading-tight mb-1 uppercase break-words line-clamp-2">
                 {order.customerName}
             </p>
             <p className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-1">
                 <Phone className="w-3 h-3" /> {order.customerPhone}
             </p>
             
             <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                 <div className="flex items-start gap-2">
                     <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                     <p className="text-sm font-medium text-stone-700 leading-snug">
                        {address ? `${address.address}, ${address.city}, ${address.province}, ${address.zip}` : order.shippingAddress}
                     </p>
                 </div>
             </div>
         </div>

         {/* Footer (Order Details) */}
         <div className="border-t-2 border-stone-900 pt-3">
             <div className="flex justify-between items-end">
                 <div>
                     <p className="text-[10px] font-bold text-stone-400 uppercase">Order Number</p>
                     <p className="text-lg font-black text-stone-900">#{order.orderNumber}</p>
                 </div>
                 <div className="text-right">
                     <p className="text-[10px] font-bold text-stone-400 uppercase">Weight</p>
                     <p className="text-sm font-bold text-stone-900">{order.items.reduce((acc: number, item: any) => acc + (item.quantity * 10), 0)} kg</p>
                 </div>
             </div>
             {order.orderNotes && (
                 <div className="mt-2 text-[10px] italic text-stone-500 border-t border-stone-100 pt-1 truncate">
                     Note: {order.orderNotes}
                 </div>
             )}
         </div>
      </div>


      {/* --- DYNAMIC PRINT CSS --- */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${printMode === 'invoice' ? 'A4' : '105mm 148mm'}; 
            margin: 0;
          }
          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          /* Hide everything inside body except the print content */
          body > *:not(.print\\:block) {
             /* We can't use display:none on body children easily in Next.js layout structure 
                because the layout wrapper exists. 
                Instead, we rely on Tailwind 'print:hidden' on the Controls container
                and 'print:block' / 'print:hidden' on the View containers.
             */
          }
          /* Ensure no margins on the page container relative to paper */
          .print\\:block {
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              height: 100% !important;
              width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
