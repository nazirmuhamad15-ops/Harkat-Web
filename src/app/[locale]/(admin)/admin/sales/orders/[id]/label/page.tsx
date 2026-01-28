'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      } else {
        const err = await res.text()
        console.error('Fetch Error:', res.status, err)
        setErrorDetails(`Error ${res.status}: ${err}`)
      }
    } catch (e: any) {
      console.error(e)
      setErrorDetails(e.message)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (addressStr: string) => {
    try {
      const json = JSON.parse(addressStr)
      return (
        <div className="space-y-0.5">
          <p className="font-bold">{json.address}</p>
          <p>{json.city}, {json.province} {json.zip}</p>
        </div>
      )
    } catch (e) {
      return addressStr
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto transition-all"></div>
        <p className="mt-4 text-stone-600 font-medium">Preparing Shipping Label...</p>
      </div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-stone-500 mb-6">We couldn't locate the order details for the requested ID.</p>
        
        {errorDetails && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-mono text-left overflow-auto max-h-32">
            {errorDetails}
          </div>
        )}

        <Link href="/admin/sales/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    </div>
  )

  return (
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-stone-100 p-8 sm:p-12 print:p-0 print:bg-white">
      <div className="mb-8 flex items-center justify-between w-[105mm] print:hidden">
        <Link href="/admin/sales/orders">
          <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="bg-stone-900 hover:bg-stone-800 text-white shadow-lg">
            <Printer className="mr-2 h-4 w-4" />
            Print Label (A6)
        </Button>
      </div>

      {/* A6 Label Container (105mm x 148mm) - High Contrast / Bordered Style */}
      <div 
        className="w-[105mm] h-[148mm] bg-white text-black border-2 border-black box-border flex flex-col overflow-hidden relative"
        style={{ pageBreakAfter: 'always' }}
      >
          {/* Header Section: Courier & Date */}
          <div className="flex border-b-2 border-black h-[15%]">
             <div className="w-1/3 border-r-2 border-black flex flex-col items-center justify-center p-2 bg-black text-white">
                <h1 className="font-black text-lg leading-none tracking-tighter">HARKAT</h1>
                <p className="text-[8px] tracking-widest font-medium mt-1">LOGISTICS</p>
             </div>
             <div className="w-2/3 p-2 flex flex-col justify-center items-center">
                <p className="font-black text-2xl uppercase tracking-tighter">{order.shippingVendor || 'TRUCKING'}</p>
                <p className="text-[10px] font-bold mt-1 text-stone-600">STANDARD SERVICE</p>
             </div>
          </div>

          {/* Route / Zip Code (Large Visual Identifier) */}
          <div className="h-[12%] border-b-2 border-black flex items-center justify-center bg-stone-100/50">
             <span className="font-black text-4xl tracking-[0.2em] font-mono">
               {(() => {
                  try {
                    const json = JSON.parse(order.shippingAddress);
                    // Extract first 3 digits of zip or just display a route code
                    return json.zip ? json.zip.substring(0, 3) : 'JKT';
                  } catch { return 'IDN'; }
               })()}
             </span>
          </div>

          {/* Recipient Section (Main Focus) */}
          <div className="flex-1 p-3 flex flex-col justify-start border-b-2 border-black">
             <div className="text-[9px] font-bold uppercase text-stone-500 mb-1">To (Penerima):</div>
             <div className="font-black text-xl uppercase leading-tight mb-2 line-clamp-2">
                {order.customerName}
             </div>
             <div className="text-sm font-bold mb-3">
                {order.customerPhone}
             </div>
             <div className="text-xs font-semibold leading-snug line-clamp-5 overflow-hidden">
                {formatAddress(order.shippingAddress)}
             </div>
          </div>

          {/* Details Grid: Weight, Order No, Sender */}
          <div className="h-[25%] flex border-b-2 border-black">
             {/* Left: Sender & Weight */}
             <div className="w-1/2 border-r-2 border-black flex flex-col">
                <div className="flex-1 p-2 border-b-2 border-black">
                   <p className="text-[8px] font-bold uppercase text-stone-500 mb-0.5">From (Pengirim):</p>
                   <p className="font-bold text-xs">HARKAT FURNITURE</p>
                   <p className="text-[9px] font-medium text-stone-600">0812-3456-7890</p>
                </div>
                <div className="h-8 flex items-center justify-between px-2 bg-stone-100">
                   <span className="text-[9px] font-bold uppercase">Weight:</span>
                   <span className="font-black text-sm">{order.finalWeight ? `${order.finalWeight.toFixed(1)} KG` : '1.0 KG'}</span>
                </div>
             </div>

             {/* Right: Order Details */}
             <div className="w-1/2 p-2 flex flex-col justify-center items-center text-center">
                <p className="text-[8px] font-bold uppercase text-stone-500 mb-1">Order Number</p>
                <p className="font-black text-lg font-mono mb-2">{order.orderNumber}</p>
                <p className="text-[9px] font-medium">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
             </div>
          </div>

          {/* Footer: Barcodes */}
          <div className="h-[18%] p-2 flex items-center justify-between gap-2">
             <div className="h-full w-full flex flex-col items-center justify-center opacity-90">
                 {/* Internal Order ID Barcode (Code 128) */}
                <img 
                   src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.orderNumber}&scale=2&height=10&incltext=false`} 
                   alt="Barcode" 
                   className="h-full w-auto max-w-full object-contain"
                />
                <p className="text-[8px] font-mono tracking-widest mt-1">{order.orderNumber}</p>
             </div>
             <div className="shrink-0">
                <QRCodeSVG value={order.id} size={48} level="M" />
             </div>
          </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: 105mm 148mm;
            margin: 0;
          }
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
