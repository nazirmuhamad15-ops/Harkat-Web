'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react'
import Script from 'next/script'
import { toast } from 'sonner'

const DriverLocationMap = dynamic(() => import('./components/driver-location-map'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>
})

interface OrderTracking {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  customerName: string
  customerPhone: string
  shippingAddress: string
  shippingVendor: string
  trackingNumber: string
  estimatedDelivery: string
  createdAt: string
  orderItems: Array<{
    id: string
    quantity: number
    product: {
      name: string
      images: string
    }
  }>
  driverLocation?: {
    lat: number | null
    lng: number | null
    lastUpdate: string | null
    driverName?: string
    driverPhone?: string
  } | null
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [orderData, setOrderData] = useState<OrderTracking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)

  // Auto-load order from URL parameter
  useEffect(() => {
    const orderParam = searchParams.get('order')
    const statusParam = searchParams.get('status')
    const sandboxParam = searchParams.get('sandbox')
    
    if (orderParam) {
      setTrackingNumber(orderParam)
      
      // Auto-confirm payment in sandbox mode using Pakasir simulation API
      if (sandboxParam === 'true' && statusParam === 'success') {
        console.log('[Track] Sandbox mode - Simulating payment via Pakasir API for', orderParam)
        
        toast.info('Sandbox Mode: Mensimulasikan pembayaran...')
        
        // Call Pakasir payment simulation API
        fetch('/api/pakasir/simulate-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber: orderParam })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              toast.success('Pembayaran berhasil disimulasikan! (Sandbox Mode)')
            } else {
              toast.error('Gagal mensimulasikan pembayaran')
            }
          })
          .catch(err => {
            console.error('[Track] Failed to simulate payment:', err)
            toast.error('Gagal mensimulasikan pembayaran')
          })
      } else if (statusParam === 'success') {
        toast.info('Memverifikasi pembayaran...')
        fetch('/api/public/orders/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNumber: orderParam })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success && (data.paymentStatus === 'PAID' || data.status === 'PAID')) {
                toast.success('Pembayaran terkonfirmasi! Pesanan sedang diproses.')
            } else {
                 toast.warning('Status pembayaran: ' + (data.paymentStatus || 'Sedang dicek'))
            }
        })
        .catch(e => console.error('Verification failed', e))
      } else if (statusParam === 'mock') {
        toast.info('Mode testing - Pembayaran simulasi')
      }
      
      // Auto-fetch order (with delay to allow payment confirmation)
      setTimeout(() => {
        handleTrackWithNumber(orderParam)
      }, sandboxParam === 'true' ? 2000 : 500)
    }
  }, [searchParams])

  const handleTrackWithNumber = async (number: string) => {
    if (!number.trim()) {
      setError('Please enter a tracking number or order ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/public/track/${number}`)
      if (response.ok) {
        const data = await response.json()
        setOrderData(data.data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Tracking information not found')
      }
    } catch (error) {
      setError('Failed to fetch tracking information')
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async () => {
    handleTrackWithNumber(trackingNumber)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PAID':
        return 'bg-blue-100 text-blue-800'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800'
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrackingSteps = (status: string) => {
    const steps = [
      { key: 'PENDING', label: 'Order Placed', icon: Package, completed: true },
      { key: 'PAID', label: 'Payment Confirmed', icon: CheckCircle, completed: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) },
      { key: 'PROCESSING', label: 'Processing', icon: Clock, completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) },
      { key: 'SHIPPED', label: 'Shipped', icon: Truck, completed: ['SHIPPED', 'DELIVERED'].includes(status) },
      { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle, completed: status === 'DELIVERED' },
    ]

    return steps
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
              <p className="text-gray-600 mt-1">Enter your tracking number or order ID</p>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Store
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Track Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Masukkan Nomor Resi atau Order ID..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                className="flex-1"
              />
              <Button onClick={handleTrack} disabled={loading}>
                {loading ? 'Mencari...' : 'Lacak'}
              </Button>
            </div>
            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {orderData && (
          <div className="space-y-6">
            {/* Order Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{orderData.orderNumber}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(orderData.status)}>
                      {orderData.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPaymentStatusColor(orderData.paymentStatus)}>
                      {orderData.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informasi Pelanggan</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nama:</span> {orderData.customerName}</p>
                      <p><span className="font-medium">Telepon:</span> {orderData.customerPhone}</p>
                      <p><span className="font-medium">Tanggal Order:</span> {formatDate(orderData.createdAt)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informasi Pengiriman</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Kurir:</span> {orderData.shippingVendor || 'Internal Harkat Delivery'}</p>
                      {orderData.trackingNumber && orderData.trackingNumber !== 'Pending' && (
                          <p><span className="font-medium">No. Resi:</span> {orderData.trackingNumber}</p>
                      )}
                      <p><span className="font-medium">Est. Sampai:</span> {orderData.estimatedDelivery ? formatDate(orderData.estimatedDelivery) : 'Menunggu Konfirmasi'}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Alamat Pengiriman</h4>
                  <p className="text-sm text-gray-600 flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    <span>
                      {(() => {
                        try {
                          const addr = JSON.parse(orderData.shippingAddress)
                          return `${addr.address}, ${addr.district ? addr.district + ', ' : ''}${addr.city}, ${addr.province} ${addr.zip}`
                        } catch {
                          return orderData.shippingAddress
                        }
                      })()}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Driver Location Map */}
            {orderData.driverLocation && orderData.driverLocation.lat && orderData.driverLocation.lng && (
              <DriverLocationMap 
                location={{
                  lat: orderData.driverLocation.lat,
                  lng: orderData.driverLocation.lng,
                  lastUpdate: orderData.driverLocation.lastUpdate,
                  driverName: orderData.driverLocation.driverName,
                  driverPhone: orderData.driverLocation.driverPhone
                }}
              />
            )}

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Tracking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTrackingSteps(orderData.status).map((step, index) => {
                    const Icon = step.icon
                    const isLast = index === getTrackingSteps(orderData.status).length - 1
                    
                    return (
                      <div key={step.key} className="flex items-center">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                        </div>
                        {!isLast && (
                          <div className={`ml-5 w-0.5 h-8 ${
                            step.completed ? 'bg-green-200' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.orderItems.map((item) => {
                    const images = JSON.parse(item.product.images || '[]')
                    const mainImage = images[0] || '/placeholder-furniture.jpg'
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={mainImage}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          {item.variant?.attributes && item.variant.attributes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.variant.attributes.map((attr: any, idx: number) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {attr.name}: {attr.value}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                          {item.sku && (
                            <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackOrder() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}