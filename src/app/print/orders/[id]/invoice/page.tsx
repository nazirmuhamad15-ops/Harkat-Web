'use client'

import { useState, useEffect, use } from 'react'
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
      <div className="mb-8 flex items-center justify-between w-full max-w-4xl print:hidden">
        <Link href="/admin/sales/orders">
          <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="border-stone-200">
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-stone-900 hover:bg-stone-800 text-white">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </div>

      {/* Invoice Container */}
      <div className="w-full max-w-4xl bg-white p-12 sm:p-16 shadow-2xl print:shadow-none print:p-8 flex flex-col min-h-[297mm] print:min-h-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-stone-900 pb-12 mb-12">
              <div className="space-y-4">
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-stone-900">HARKAT</h1>
                    <p className="text-xs font-bold tracking-[0.4em] text-stone-500 uppercase mt-1">Furniture Premium</p>
                  </div>
                  <div className="text-sm text-stone-500 space-y-1">
                      <p>Jl. Raya Parung No. 123</p>
                      <p>Bogor, Jawa Barat, 16610</p>
                      <p>+62 812 3456 7890 • sales@harkat.com</p>
                  </div>
              </div>
              <div className="text-right space-y-4">
                  <div className="bg-stone-900 text-white px-6 py-2 inline-block">
                    <h2 className="text-2xl font-bold uppercase tracking-widest">INVOICE</h2>
                  </div>
                  <div className="text-stone-500">
                      <p className="text-stone-900 font-bold text-xl">{order.orderNumber}</p>
                      <p className="text-sm">Date: {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="text-sm">Status: <span className="font-bold text-stone-900">{order.paymentStatus}</span></p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-16 mb-16">
              <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Bill To:</h3>
                  <div className="space-y-1">
                      <p className="text-xl font-bold text-stone-900">{order.customerName}</p>
                      <p className="text-stone-600">{order.customerEmail}</p>
                      <p className="text-stone-600">{order.customerPhone}</p>
                  </div>
              </div>
              <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Ship To:</h3>
                  {formatAddress(order.shippingAddress)}
              </div>
          </div>

          {/* Table */}
          <div className="flex-1">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b-2 border-stone-900 text-xs font-black uppercase tracking-widest text-stone-400">
                          <th className="py-4">Description</th>
                          <th className="py-4 text-center">Qty</th>
                          <th className="py-4 text-right">Price</th>
                          <th className="py-4 text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                      {order.items.map((item: any) => (
                          <tr key={item.id} className="text-stone-700">
                              <td className="py-6 pr-4">
                                  <p className="font-bold text-stone-900">{item.productName}</p>
                                  <p className="text-xs text-stone-400 mt-1">Premium Quality Furniture</p>
                              </td>
                              <td className="py-6 text-center font-bold text-stone-900">{item.quantity}</td>
                              <td className="py-6 text-right font-medium">{formatPrice(item.price)}</td>
                              <td className="py-6 text-right font-bold text-stone-900">{formatPrice(item.total)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          {/* Totals */}
          <div className="mt-12 pt-8 border-t-2 border-stone-100 flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-stone-500 font-medium">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500 font-medium pb-3 border-b border-stone-100">
                      <span>Shipping Fee ({order.shippingVendor || 'Standard'})</span>
                      <span>{formatPrice(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-900">
                      <span className="text-lg font-black uppercase tracking-widest">Total</span>
                      <span className="text-2xl font-black">{formatPrice(order.total)}</span>
                  </div>
                  
                  {order.paymentStatus === 'PAID' ? (
                    <div className="mt-6 p-4 bg-green-50 border border-green-100 text-green-700 text-center rounded-lg font-bold text-sm uppercase tracking-widest">
                        Payment Successful
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 text-center rounded-lg font-bold text-sm uppercase tracking-widest">
                        Awaiting Payment
                    </div>
                  )}
              </div>
          </div>

          {/* Note & Footer */}
          <div className="mt-auto pt-24">
              <div className="grid grid-cols-2 gap-12 items-end">
                  <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Notes & Terms</h4>
                      <p className="text-[10px] text-stone-400 leading-relaxed italic">
                        Thank you for choosing Harkat Furniture. Please keep this invoice for your warranty records. 
                        Furniture maintenance instructions are included in the package.
                      </p>
                  </div>
                  <div className="text-right space-y-8">
                      <div className="h-1 bg-stone-900 w-32 ml-auto mb-1"></div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-stone-900">Authorized Signature</p>
                        <p className="text-[10px] text-stone-400 mt-1">Harkat Furniture Finance Dept.</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
           /* Force hide standard layout elements if they exist */
          nav, header, aside, .sidebar {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .min-h-\\[297mm\\] {
              min-height: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
