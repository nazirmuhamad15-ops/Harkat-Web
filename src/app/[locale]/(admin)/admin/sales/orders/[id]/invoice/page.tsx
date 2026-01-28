'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
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
        <div className="space-y-1">
          <p className="font-bold text-stone-900">{json.address}</p>
          <p className="text-stone-600">{json.city}, {json.province} {json.zip}</p>
        </div>
      )
    } catch (e) {
      return <p className="text-stone-600">{addressStr}</p>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto"></div>
        <p className="mt-4 text-stone-600 font-medium">Generating Invoice...</p>
      </div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-stone-500 mb-6">We couldn't locate the order details for the invoice.</p>
        
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
    <div className="min-h-screen bg-stone-100 p-8 sm:p-12 print:p-0 print:bg-white flex flex-col items-center">
      {/* Controls */}
      <div className="mb-8 flex items-center justify-between w-full max-w-[210mm] print:hidden">
        <Link href="/admin/sales/orders">
          <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-white border-stone-200 hover:bg-stone-50 text-stone-700">
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-stone-900 hover:bg-stone-800 text-white shadow-md">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </div>

      {/* Invoice A4 Container */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none print:w-[210mm] print:h-[297mm] flex flex-col relative overflow-hidden">
          {/* Decorative Top Border */}
          <div className="h-2 bg-stone-900 w-full"></div>

          <div className="p-12 sm:p-16 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start mb-16">
                  <div>
                    <h1 className="text-4xl font-serif font-black tracking-tighter text-stone-900 mb-2">HARKAT</h1>
                    <p className="text-xs font-bold tracking-[0.4em] text-stone-400 uppercase">Furniture Premium</p>
                    <div className="mt-8 text-sm text-stone-500 space-y-1 font-medium">
                        <p>Jl. Raya Parung No. 123</p>
                        <p>Bogor, Jawa Barat, 16610</p>
                        <p className="pt-2 text-stone-400">+62 812 3456 7890</p>
                        <p className="text-stone-400">sales@harkat.com</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <div className="inline-flex flex-col items-end">
                          <h2 className="text-5xl font-thin text-stone-200 uppercase tracking-widest leading-none">Invoice</h2>
                          <p className="text-xl font-bold text-stone-900 -mt-4 mr-1">#{order.orderNumber}</p>
                      </div>
                      <div className="mt-8 space-y-2 text-right">
                          <div className="flex justify-end gap-8 text-sm">
                              <span className="text-stone-400 font-medium">Date Issued</span>
                              <span className="font-bold text-stone-900 min-w-[100px]">
                                {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Billing Info Grid */}
              <div className="grid grid-cols-2 gap-12 mb-16">
                  <div className="bg-stone-50 p-6 rounded-lg border border-stone-100">
                      <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-200 pb-2">Bill To</h3>
                      <p className="text-lg font-bold text-stone-900 mb-1">{order.customerName}</p>
                      <p className="text-sm text-stone-600 mb-1">{order.customerEmail}</p>
                      <p className="text-sm text-stone-600">{order.customerPhone}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-lg border border-stone-100">
                      <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-200 pb-2">Ship To</h3>
                      <div className="text-sm text-stone-700 leading-relaxed">
                          {formatAddress(order.shippingAddress)}
                      </div>
                  </div>
              </div>

              {/* Items Table */}
              <div className="mb-12">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="border-b-2 border-stone-900">
                              <th className="py-4 pl-4 text-xs font-black uppercase tracking-widest text-stone-900 w-1/2">Description</th>
                              <th className="py-4 text-center text-xs font-black uppercase tracking-widest text-stone-900">Qty</th>
                              <th className="py-4 text-right text-xs font-black uppercase tracking-widest text-stone-900">Price</th>
                              <th className="py-4 pr-4 text-right text-xs font-black uppercase tracking-widest text-stone-900">Amount</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                          {order.items.map((item: any) => (
                              <tr key={item.id} className="group hover:bg-stone-50">
                                  <td className="py-6 pl-4 pr-8">
                                      <p className="font-bold text-stone-900 text-sm">{item.productName}</p>
                                      {/* Placeholder for item description if available */}
                                      <p className="text-xs text-stone-400 mt-1">Harkat Premium Collection</p>
                                  </td>
                                  <td className="py-6 text-center font-bold text-stone-900 text-sm align-top pt-8">{item.quantity}</td>
                                  <td className="py-6 text-right font-medium text-stone-600 text-sm align-top pt-8">{formatPrice(item.price)}</td>
                                  <td className="py-6 pr-4 text-right font-bold text-stone-900 text-sm align-top pt-8">{formatPrice(item.total)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* Footer / Totals */}
              <div className="flex justify-between items-end mt-auto pt-8 border-t border-stone-100">
                  <div className="max-w-sm space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-stone-300">Payment Status</h4>
                        <div className={`
                            inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border
                            ${order.paymentStatus === 'PAID' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'}
                        `}>
                            {order.paymentStatus === 'PAID' ? 'PAID IN FULL' : 'AWAITING PAYMENT'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase tracking-widest text-stone-300">Notes</h4>
                          <p className="text-xs text-stone-500 italic leading-relaxed">
                            Thank you for your business. Please contact support@harkat.com for any inquiries regarding this invoice within 7 days.
                          </p>
                      </div>
                  </div>

                  <div className="w-80">
                      <div className="flex justify-between py-2 text-sm text-stone-500">
                          <span>Subtotal</span>
                          <span className="font-medium">{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm text-stone-500 border-b border-stone-100 pb-4">
                          <span>Shipping ({order.shippingVendor || 'Standard'})</span>
                          <span className="font-medium">{formatPrice(order.shippingCost)}</span>
                      </div>
                      <div className="flex justify-between py-4 items-center">
                          <span className="text-base font-black uppercase tracking-widest text-stone-900">Total Due</span>
                          <span className="text-3xl font-serif font-bold text-stone-900">{formatPrice(order.total)}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Bottom decorative bar */}
          <div className="h-2 bg-stone-100 w-full mt-auto"></div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body {
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
