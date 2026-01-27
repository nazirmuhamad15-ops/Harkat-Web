'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Truck, Clock, Search, ExternalLink, Star } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewModal } from '@/components/product/review-modal'

export default function CustomerOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/customer/orders')
      if (res.ok) {
        const json = await res.json()
        setOrders(json.orders)
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric'
      })
  }

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200'
          case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200'
          case 'PROCESSING': return 'bg-purple-100 text-purple-800 border-purple-200'
          case 'SHIPPED': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
          case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
          case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
          default: return 'bg-gray-100 text-gray-800'
      }
  }

  const getPaymentStatusStyle = (status: string) => {
      switch (status) {
          case 'PAID': return 'bg-green-100 text-green-800 border-green-200'
          case 'CONFIRMING': return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'
          case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
          case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-100'
          default: return 'bg-gray-50 text-gray-600'
      }
  }

  if (loading) {
      return (
          <div className="space-y-6">
              <div className="h-10 w-full max-w-sm bg-gray-100 rounded-md animate-pulse"></div>
              <div className="space-y-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500">View and track your order history.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input 
            placeholder="Search by Order ID or Status" 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try adjusting your search terms.' : "You haven't placed any orders yet."}
            </p>
            {!searchTerm && (
                <Link href="/">
                    <Button>Start Shopping</Button>
                </Link>
            )}
          </div>
      ) : (
          <div className="space-y-4">
              {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                      <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                       <span className="text-lg font-bold text-gray-900">{order.orderNumber}</span>
                                       <Badge variant="outline" className={`${getStatusColor(order.status)} border-0`}>
                                           Order: {order.status}
                                       </Badge>
                                       {order.paymentStatus !== 'PAID' && (
                                           <Badge variant="outline" className={`${getPaymentStatusStyle(order.paymentStatus)} border-0 border-l-2`}>
                                               Payment: {order.paymentStatus === 'CONFIRMING' ? 'WAITING VERIFICATION' : order.paymentStatus}
                                           </Badge>
                                       )}
                                   </div>
                                  <div className="flex items-center text-sm text-gray-500 gap-4">
                                      <span className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {formatDate(order.createdAt)}
                                      </span>
                                      <span>•</span>
                                      <span>{order.orderItems.length} Items</span>
                                  </div>
                              </div>
                              <div className="text-left md:text-right">
                                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                                  <p className="text-xl font-bold text-gray-900">{formatPrice(order.total)}</p>
                              </div>
                          </div>

                          <div className="border-t border-gray-100 pt-6">
                            <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                <Link href={`/track?order=${order.orderNumber}`} className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full">
                                        <Truck className="w-4 h-4 mr-2" />
                                        Track Order
                                    </Button>
                                </Link>
                                {order.status === 'PENDING' && order.paymentStatus !== 'CONFIRMING' && order.paymentStatus !== 'PAID' && (
                                    order.paymentUrl ? (
                                        <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                            <Button size="sm" className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-lg">
                                                Pay Now
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button size="sm" disabled className="w-full sm:w-auto bg-gray-300 text-gray-500 rounded-lg">
                                            Payment URL Not Available
                                        </Button>
                                    )
                                )}
                                {order.paymentStatus === 'CONFIRMING' && (
                                    <Button size="sm" variant="ghost" disabled className="w-full sm:w-auto text-blue-600 bg-blue-50">
                                        Payment Verification in Progress...
                                    </Button>
                                )}
                                {order.status === 'DELIVERED' && (
                                    order.allReviewed ? (
                                      <Button 
                                        variant="outline" 
                                        className="w-full sm:w-auto gap-2 border-green-200 text-green-700 bg-green-50 cursor-default"
                                        disabled
                                      >
                                        <Star className="w-4 h-4 fill-green-500" />
                                        Sudah Diulas
                                      </Button>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        className="w-full sm:w-auto gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                                        onClick={() => {
                                          setSelectedOrder(order)
                                          setReviewModalOpen(true)
                                        }}
                                      >
                                        <Star className="w-4 h-4" />
                                        Ulas Produk
                                      </Button>
                                    )
                                )}
                            </div>
                          </div>
                      </div>
                  </Card>
              ))}
          </div>
      )}

      {/* Review Modal */}
      {selectedOrder && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.orderNumber}
          items={selectedOrder.orderItems.map((item: any) => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image,
          }))}
          onSuccess={() => toast.success('Terima kasih atas ulasan Anda!')}
        />
      )}
    </div>
  )
}
