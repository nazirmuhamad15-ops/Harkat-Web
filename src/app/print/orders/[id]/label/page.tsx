'use client'

import { useState, useEffect, use } from 'react'
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
    <div className="flex flex-col items-center justify-start min-h-screen bg-stone-100 p-8 sm:p-12 print:p-0 print:bg-white print:min-h-0">
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

      {/* A6 Label Container (approx 105mm x 148mm) */}
      <div 
        className="w-[105mm] h-[148mm] bg-white p-6 border border-stone-300 shadow-2xl print:shadow-none print:border-none flex flex-col justify-between overflow-hidden relative mx-auto"
      >
          {/* Top Edge Decorative Barcode Pattern */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="bg-stone-900 h-full" style={{ width: `${Math.random() * 8 + 1}px` }}></div>
            ))}
          </div>

          <div className="border-b-2 border-stone-900 pb-4 mb-4 flex justify-between items-end">
              <div>
                  <h1 className="font-black text-2xl uppercase tracking-tighter leading-none text-stone-900">HARKAT</h1>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 mt-1">LOGISTICS</p>
              </div>
              <div className="text-right">
                  <h2 className="font-mono font-bold text-xl text-stone-900">{order.orderNumber}</h2>
                  <p className="text-[10px] text-stone-500 font-medium">DATE: {new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
          </div>

          <div className="flex-1 space-y-5 overflow-hidden">
              <div className="border-2 border-stone-900 p-3 rounded-none bg-stone-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-stone-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">RECIPIENT</div>
                  </div>
                  <p className="font-black text-xl leading-tight uppercase text-stone-900 truncate">{order.customerName}</p>
                  <p className="text-base font-bold text-stone-700 mt-1 mb-2">{order.customerPhone}</p>
                  <div className="text-xs font-semibold leading-relaxed text-stone-800 h-16 overflow-hidden">
                    {formatAddress(order.shippingAddress)}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="border border-stone-200 p-2 bg-stone-50">
                      <p className="text-[8px] uppercase font-bold text-stone-400 mb-0.5">Shipping Method</p>
                      <p className="font-black text-base uppercase text-stone-900">{order.shippingVendor || 'Standard'}</p>
                  </div>
                  <div className="border border-stone-200 p-2 bg-stone-50 text-right">
                       <p className="text-[8px] uppercase font-bold text-stone-400 mb-0.5">Package Weight</p>
                       <p className="font-black text-base text-stone-900">
                        {order.finalWeight ? `${order.finalWeight.toFixed(1)} KG` : 'TBA'}
                       </p>
                  </div>
              </div>

              <div className="border-t border-stone-100 pt-3">
                  <p className="text-[8px] uppercase font-bold text-stone-400 mb-2">Package Contents ({order.items.length} items)</p>
                  <div className="space-y-1.5 max-h-32 overflow-hidden">
                      {order.items.slice(0, 5).map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-[10px] font-semibold border-b border-stone-50 pb-1">
                              <span className="truncate pr-4 text-stone-700">{item.productName}</span>
                              <span className="bg-stone-100 px-1.5 py-0.5 rounded font-bold shrink-0">x{item.quantity}</span>
                          </div>
                      ))}
                      {order.items.length > 5 && (
                        <p className="text-[8px] text-stone-400 italic mt-1">+ {order.items.length - 5} more items...</p>
                      )}
                  </div>
              </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-stone-900">
             <div className="flex justify-between items-center">
               <div className="flex-1">
                  <div className="flex gap-4 items-center mb-2">
                    {/* QR Code (Internal) */}
                    <div className="bg-white p-1 border border-stone-200">
                       <QRCodeSVG value={order.id} size={50} level="M" />
                    </div>
                    
                    {/* Linear Barcode (External API for visual) */}
                    <div className="flex-1 h-12 flex items-center justify-center overflow-hidden">
                       {/* Using a reliable free barcode API for Code 128 */}
                       <img 
                          src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.orderNumber}&scale=2&height=10&incltext=false`} 
                          alt="Barcode" 
                          className="h-full w-full object-contain opacity-90 grayscale"
                       />
                    </div>
                  </div>
                  <p className="text-[8px] font-mono text-center tracking-[0.4em] text-stone-400">ID: {order.id.toUpperCase()}</p>
               </div>
               <div className="w-24 text-center ml-4 shrink-0">
                  <p className="text-[8px] font-black text-stone-400 mb-4">SIGNATURE</p>
                  <div className="h-8 border-b-2 border-stone-200 w-full"></div>
               </div>
             </div>
             
             <div className="flex justify-between mt-3 pt-3 border-t border-stone-100">
                  <div className="text-left">
                      <p className="text-[7px] font-bold text-stone-400">SENDER: HARKAT FURNITURE PREMIUM</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[7px] font-bold text-stone-400 text-right uppercase">Fragile / Handle with care</p>
                  </div>
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
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100vh;
            overflow: hidden;
          }
          /* Hide everything by default */
          body > * {
            display: none;
          }
          /* Only show the Next.js app container or specific print container if possible */
          /* But since we might be inside a layout we can't control easily, let's target the label container directly if we can't isolate it */
          
          /* Better approach: Force hide standard layout elements if they exist */
          nav, header, aside, .sidebar {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          
          /* Show our main content */
          body > div {
            display: block !important; /* Restore Next.js root div */
          }
        }
      `}</style>
    </div>
  )
}
