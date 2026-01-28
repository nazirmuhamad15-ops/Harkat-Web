'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Truck, Clock, ShoppingBag, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-[400px] rounded-lg" />
        </div>
    )
}

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/customer/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error('Failed to load dashboard data')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
          case 'PENDING': return 'bg-amber-50 text-amber-900 border-amber-200'
          case 'PAID': return 'bg-blue-50 text-blue-900 border-blue-100'
          case 'PROCESSING': return 'bg-stone-100 text-stone-700 border-stone-200'
          case 'SHIPPED': return 'bg-indigo-50 text-indigo-900 border-indigo-100'
          case 'DELIVERED': return 'bg-emerald-50 text-emerald-900 border-emerald-100'
          case 'CANCELLED': return 'bg-red-50 text-red-900 border-red-200'
          default: return 'bg-gray-100 text-gray-800'
      }
  }

  if (loading) {
      return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">My Dashboard</h1>
        <p className="text-stone-500">Manage your orders and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-stone-100 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-stone-100 rounded-full text-stone-600">
                    <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-stone-500 mb-1">Total Orders</p>
                    <h3 className="text-3xl font-bold text-stone-900">{data?.stats?.totalOrders || 0}</h3>
                </div>
            </CardContent>
         </Card>
         <Card className="border-stone-100 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-stone-500 mb-1">Pending</p>
                    <h3 className="text-3xl font-bold text-stone-900">{data?.stats?.pendingOrders || 0}</h3>
                </div>
            </CardContent>
         </Card>
         <Card className="border-stone-100 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-stone-100 rounded-full text-stone-600">
                    <Truck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-stone-500 mb-1">To Ship</p>
                    <h3 className="text-3xl font-bold text-stone-900">{data?.stats?.toShipOrders || 0}</h3>
                </div>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-stone-100 shadow-sm bg-white">
            <CardHeader className="border-b border-stone-100/50 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Recent Orders</CardTitle>
                        <CardDescription className="text-stone-500">Track your most recent purchases.</CardDescription>
                    </div>
                    <Link href="/customer/orders">
                        <Button variant="ghost" size="sm" className="hidden sm:flex text-stone-500 hover:text-stone-900">
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {(!data?.recentOrders || data.recentOrders.length === 0) ? (
                    <div className="text-center py-16 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                        <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-stone-900 mb-2">No orders yet</h3>
                        <p className="text-stone-500 mb-8 max-w-sm mx-auto">Start browsing our collection to find the perfect furniture for your home.</p>
                        <Link href="/products">
                            <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-8">Start Shopping</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.recentOrders.map((order: any) => (
                            <div key={order.id} className="group border border-stone-100 rounded-xl p-5 hover:border-stone-300 hover:shadow-md transition-all bg-white relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-stone-900 text-lg">{order.orderNumber}</h4>
                                            <Badge variant="outline" className={`${getStatusColor(order.status)} border-0 px-3 py-0.5 rounded-full font-medium`}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-stone-500 flex items-center">
                                            <Clock className="w-3.5 h-3.5 mr-2" />
                                            Placed on {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="font-bold text-xl text-stone-900">{formatPrice(order.total)}</p>
                                        <p className="text-xs text-stone-500 font-medium">
                                            {order.orderItems?.length || 0} items
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-stone-50 gap-4 relative z-10">
                                    <Link href={`/track?order=${order.orderNumber}`}>
                                        <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 pl-0 sm:pl-3">
                                            <Truck className="w-4 h-4 mr-2" />
                                            Track Order
                                        </Button>
                                    </Link>
                                    
                                    {order.status === 'PENDING' && (
                                        <Link href={`/customer/payment?order=${order.orderNumber}`}>
                                            <Button size="sm" className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white rounded-lg">
                                                Pay Now
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="sm:hidden pt-4">
                            <Link href="/customer/orders">
                                <Button variant="outline" className="w-full border-stone-200">View All Orders</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Address & Profile - Right Side */}
        <div className="lg:col-span-1 space-y-6">
             <Card className="border-stone-100 shadow-sm bg-white h-full">
                <CardHeader>
                    <CardTitle className="text-xl">Shipping Address</CardTitle>
                    <CardDescription>Your primary delivery location.</CardDescription>
                </CardHeader>
                <CardContent>
                    {data?.address ? (
                        <div className="space-y-4">
                             <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                                <div className="flex items-center gap-2 mb-2">
                                     <Badge variant="secondary" className="bg-stone-200 text-stone-800 hover:bg-stone-200">
                                        {data.address.label || 'Home'}
                                     </Badge>
                                     {data.address.isDefault && (
                                         <Badge className="bg-[#0058A3] text-white hover:bg-[#004B8C]">Default</Badge>
                                     )}
                                </div>
                                <h4 className="font-bold text-stone-900">{data.address.recipientName}</h4>
                                <p className="text-stone-600 text-sm mt-1">{data.address.phone}</p>
                                <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                                    {data.address.addressLine}<br/>
                                    {data.address.district}, {data.address.city}<br/>
                                    {data.address.province}, {data.address.postalCode}
                                </p>
                             </div>
                             <Button variant="outline" className="w-full border-stone-200 text-stone-600">
                                Edit Address
                             </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                                <Truck className="w-6 h-6" />
                            </div>
                            <p className="text-stone-500 text-sm mb-4">You haven't added a shipping address yet.</p>
                            <Link href="/customer/profile?tab=address">
                                <Button className="w-full bg-stone-900 text-white">Add Address</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  )
}
