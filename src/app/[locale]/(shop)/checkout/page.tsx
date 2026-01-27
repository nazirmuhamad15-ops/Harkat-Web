'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Truck, Info, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import CouponInput from '@/components/shop/coupon-input'

// Types matching API
interface Province {
  province_id: string
  province: string
}

interface City {
  city_id: string
  city_name: string
  type: string
  postal_code: string
}

interface ShippingRate {
  code: string
  name: string
  service: string
  description: string
  cost: number
  etd: string
  type: 'COURIER' | 'INTERNAL'
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, getTotals, removeItem, couponCode, discountAmount } = useCart()
  const totals = getTotals()
  const checkoutItems = items.filter(i => i.selected)

  const [step, setStep] = useState<'details' | 'shipping' | 'payment'>('details')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    provinceId: '',
    provinceName: '',
    cityId: '', 
    cityName: '',
    zipCode: '',
    notes: ''
  })

  // Location Data
  const [provinces, setProvinces] = useState<Province[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loadingLoc, setLoadingLoc] = useState(false)

  // Shipping Data
  const [availableRates, setAvailableRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [calculating, setCalculating] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('all')

  // 1. Fetch Provinces on Mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingLoc(true)
        const res = await fetch('/api/public/shipping/locations/provinces')
        const data = await res.json()
        setProvinces(data.results || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingLoc(false)
      }
    }
    fetchProvinces()
  }, [])

  // Auto-fill address from profile
  useEffect(() => {
    if (!session?.user || provinces.length === 0 || formData.provinceId) return 

    const fillAddress = async () => {
      try {
        const res = await fetch('/api/customer/addresses')
        const data = await res.json()
        const defAddr = data.addresses?.find((a: any) => a.isDefault)

        if (defAddr) {
          // Normalize strings for comparison
          const normalize = (str: string) => str.toLowerCase().trim()

          // 1. Find Province ID
          const prov = provinces.find(p => normalize(p.province) === normalize(defAddr.province))
          
          if (prov) {
             // Fetch cities for this province
             setLoadingLoc(true)
             const cityRes = await fetch(`/api/public/shipping/locations/cities?province_id=${prov.province_id}`)
             const cityData = await cityRes.json()
             const cityList: City[] = cityData.results || []
             setCities(cityList)

             // 2. Find City ID
             const city = cityList.find(c => 
                normalize(defAddr.city).includes(normalize(c.city_name)) || 
                normalize(c.city_name).includes(normalize(defAddr.city))
             )

             if (city) {
                 setFormData(prev => ({
                     ...prev,
                     firstName: defAddr.recipientName.split(' ')[0] || '',
                     lastName: defAddr.recipientName.split(' ').slice(1).join(' ') || '',
                     phone: defAddr.phone,
                     address: defAddr.addressLine,
                     provinceId: prov.province_id,
                     provinceName: prov.province,
                     cityId: city.city_id,
                     cityName: `${city.type} ${city.city_name}`,
                     zipCode: defAddr.postalCode || city.postal_code,
                     email: session.user?.email || prev.email
                 }))
                 
                 // Trigger calc (use timeout to ensure state settles if needed, though direct call is better here)
                 calculateShipping(city.city_id, prov.province)
             } else {
                 // Fallback: Fill what we can
                 setFormData(prev => ({
                     ...prev,
                     firstName: defAddr.recipientName.split(' ')[0] || '',
                     lastName: defAddr.recipientName.split(' ').slice(1).join(' ') || '',
                     phone: defAddr.phone,
                     address: defAddr.addressLine,
                     provinceId: prov.province_id,
                     provinceName: prov.province,
                     email: session.user?.email || prev.email
                 }))
             }
             setLoadingLoc(false)
          }
        }
      } catch (e) {
        console.error("Failed to autofill address", e)
        setLoadingLoc(false)
      }
    }

    fillAddress()
  }, [session, provinces])

  // 2. Fetch Cities when Province Changes
  const handleProvinceChange = async (provinceId: string) => {
    const prov = provinces.find(p => p.province_id === provinceId)
    setFormData(prev => ({ 
      ...prev, 
      provinceId, 
      provinceName: prov?.province || '', 
      cityId: '', 
      cityName: '' 
    }))
    setCities([])
    setAvailableRates([])
    setSelectedRate(null)

    if (!provinceId) return

    try {
      setLoadingLoc(true)
      const res = await fetch(`/api/public/shipping/locations/cities?province_id=${provinceId}`)
      const data = await res.json()
      setCities(data.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLoc(false)
    }
  }

  // 3. Handle City Change & Calc Shipping
  const handleCityChange = async (cityId: string) => {
    const city = cities.find(c => c.city_id === cityId)
    setFormData(prev => ({ 
      ...prev, 
      cityId, 
      cityName: city ? `${city.type} ${city.city_name}` : '', 
      zipCode: city?.postal_code || prev.zipCode 
    }))
    
    // Trigger Calculation
    if (cityId) {
      calculateShipping(cityId, formData.provinceName)
    }
  }

  const [weightInfo, setWeightInfo] = useState<any>(null)
  const [shippingMessage, setShippingMessage] = useState<string>('')

  const calculateShipping = async (destCityId: string, provName: string) => {
    setCalculating(true)
    setAvailableRates([])
    setSelectedRate(null)
    setShippingMessage('')
    
    try {
      // Calculate order total for free shipping check
      const orderTotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      const res = await fetch('/api/public/shipping/calculate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          destinationCityId: destCityId,
          provinceName: provName,
          orderTotal: orderTotal,
          items: checkoutItems.map(i => ({
             weight: i.weight || 1, 
             length: i.length || 50, 
             width: i.width || 50,
             height: i.height || 50,
             quantity: i.quantity,
             price: i.price
          }))
        })
      })
      
      const data = await res.json()
      if (data.rates) {
        setAvailableRates(data.rates)
        if (data.weight) {
             setWeightInfo(data.weight)
        }
        
        // Auto select first option
        if (data.rates.length > 0) {
          setSelectedRate(data.rates[0])
          // Show free shipping message if applicable
          if (data.rates[0].cost === 0) {
            setShippingMessage('🎉 Selamat! Anda mendapat GRATIS ONGKIR!')
          } else if (orderTotal < 3000000 && data.rates[0].description?.includes('Tambah')) {
            const remaining = 3000000 - orderTotal
            setShippingMessage(`💡 Tambah Rp ${remaining.toLocaleString('id-ID')} untuk gratis ongkir!`)
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCalculating(false)
    }
  }

  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [isAddrSelectorOpen, setIsAddrSelectorOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
        fetch('/api/customer/addresses')
            .then(res => res.json())
            .then(data => setSavedAddresses(data.addresses || []))
    }
  }, [session])

  const handleSelectAddress = async (addr: any) => {
        setIsAddrSelectorOpen(false)
        setLoadingLoc(true)
        try {
             // Reset rates
             setAvailableRates([])
             setSelectedRate(null)

             const normalize = (str: string) => str.toLowerCase().trim()
             const prov = provinces.find(p => normalize(p.province) === normalize(addr.province))
             
             if (prov) {
                  const res = await fetch(`/api/public/shipping/locations/cities?province_id=${prov.province_id}`)
                  const data = await res.json()
                  const cityList: City[] = data.results || []
                  setCities(cityList)

                  const city = cityList.find((c: any) => 
                      normalize(addr.city).includes(normalize(c.city_name)) || 
                      normalize(c.city_name).includes(normalize(defAddr.city))
                  )

                  if (city) {
                       setFormData(prev => ({
                           ...prev,
                           firstName: addr.recipientName.split(' ')[0] || '',
                           lastName: addr.recipientName.split(' ').slice(1).join(' ') || '',
                           phone: addr.phone,
                           address: addr.addressLine,
                           provinceId: prov.province_id,
                           provinceName: prov.province,
                           cityId: city.city_id,
                           cityName: `${city.type} ${city.city_name}`,
                           zipCode: addr.postalCode || city.postal_code,
                       }))
                       calculateShipping(city.city_id, prov.province)
                  }
             }
        } catch(e) { console.error(e) } 
        finally { setLoadingLoc(false) }
   }

  const handlePlaceOrder = async () => {
    if (!selectedRate) {
        alert('Please select a shipping method')
        return
    }

    setLoading(true)
    try {
      const orderData = {
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: JSON.stringify({
            address: formData.address,
            province: formData.provinceName,
            city: formData.cityName,
            zip: formData.zipCode
        }),
        items: checkoutItems.map(item => ({
            productVariantId: item.variantId || item.id,
            quantity: item.quantity,
            price: item.price
        })),
        shippingCost: selectedRate.cost,
        notes: formData.notes,
        shippingVendor: selectedRate.code + ' - ' + selectedRate.service,
        paymentMethod: paymentMethod,
        couponCode: couponCode,
        discountAmount: discountAmount
      }

      const response = await fetch('/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
      })

      if (response.ok) {
          const data = await response.json()
          console.log('[Checkout] Order created:', data)
          
          checkoutItems.forEach(item => removeItem(item.id))
          
          // Redirect to Payment Gateway (Pakasir)
          if (data.paymentUrl) {
              console.log('[Checkout] Redirecting to payment URL:', data.paymentUrl)
              // Direct redirect without hesitation
              window.location.href = data.paymentUrl;
          } else {
              // Should not happen in normal flow, but just in case
              console.error('[Checkout] No payment URL returned')
              alert('Payment URL generation failed. Please check your order in the dashboard.')
              router.push(`/track?order=${data.order.orderNumber}`)
          }
      } else {
          const errData = await response.json().catch(() => ({}))
          console.error('[Checkout] Order creation failed:', errData)
          alert(`Failed to place order: ${errData.error || 'Unknown error'}`)
      }
    } catch (error) {
        console.error('Checkout failed', error)
        alert('An unexpected error occurred.')
    } finally {
        setLoading(false)
    }
  }

  if (checkoutItems.length === 0) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">No items selected</h2>
                  <Button onClick={() => router.push('/cart')}>Back to Cart</Button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Form */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center w-full">
                        <CardTitle>Shipping Details</CardTitle>
                        {savedAddresses.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setIsAddrSelectorOpen(true)}>
                                Pilih Alamat
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street name, house number..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Province</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.provinceId}
                                onChange={e => handleProvinceChange(e.target.value)}
                                disabled={loadingLoc}
                             >
                                 <option value="">Select Province</option>
                                 {provinces.map(p => (
                                     <option key={p.province_id} value={p.province_id}>{p.province}</option>
                                 ))}
                             </select>
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                             <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.cityId}
                                onChange={e => handleCityChange(e.target.value)}
                                disabled={!formData.provinceId || loadingLoc}
                             >
                                 <option value="">Select City</option>
                                 {cities.map(c => (
                                     <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>
                                 ))}
                             </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Zip Code</Label>
                        <Input value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Delivery Instructions (Optional)</Label>
                        <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>
                </CardContent>
            </Card>

            {/* Shipping Method Selection */}
            {formData.cityId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Method</CardTitle>
                        <CardDescription>Pengiriman internal Harkat Furniture</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Free Shipping Message */}
                        {shippingMessage && (
                          <Alert className={`mb-4 ${shippingMessage.includes('GRATIS') ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-200'}`}>
                            <Info className={`h-4 w-4 ${shippingMessage.includes('GRATIS') ? 'text-green-600' : 'text-blue-600'}`} />
                            <AlertDescription className={`font-medium ${shippingMessage.includes('GRATIS') ? 'text-green-700' : 'text-blue-700'}`}>
                              {shippingMessage}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {calculating ? (
                           <div className="flex items-center justify-center py-6 text-stone-500">
                               <Loader2 className="h-6 w-6 animate-spin mr-2" />
                               Menghitung ongkir...
                           </div>
                        ) : availableRates.length === 0 ? (
                           <Alert className="bg-yellow-50 border-yellow-200">
                               <AlertTriangle className="h-4 w-4 text-yellow-600" />
                               <AlertTitle>Pengiriman tidak tersedia</AlertTitle>
                               <AlertDescription>
                                 Maaf, pengiriman hanya tersedia untuk Pulau Jawa. Silakan hubungi customer service.
                               </AlertDescription>
                           </Alert>
                        ) : (
                           <RadioGroup 
                               value={selectedRate?.code + '_' + selectedRate?.service} 
                               onValueChange={(val) => {
                                   const rate = availableRates.find(r => (r.code + '_' + r.service) === val)
                                   if (rate) setSelectedRate(rate)
                               }}
                           >
                               <div className="space-y-3">
                                   {availableRates.map((rate, idx) => (
                                       <div key={idx} className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                                         selectedRate?.service === rate.service && selectedRate.code === rate.code 
                                           ? 'border-stone-900 bg-stone-50' 
                                           : 'border-stone-200 hover:border-stone-400'
                                       } ${rate.cost === 0 ? 'ring-2 ring-green-400 border-green-500 bg-green-50' : ''}`}>
                                           <RadioGroupItem value={rate.code + '_' + rate.service} id={`r-${idx}`} className="mt-1" />
                                           <div className="flex-1">
                                               <Label htmlFor={`r-${idx}`} className="font-bold text-stone-900 cursor-pointer flex items-center gap-2">
                                                   <Truck className="h-4 w-4" />
                                                   {rate.name}
                                                   {rate.cost === 0 && (
                                                     <Badge className="bg-green-500 text-white text-[10px]">GRATIS</Badge>
                                                   )}
                                               </Label>
                                               <p className="text-xs text-stone-500 mt-1">{rate.description}</p>
                                               <p className="text-xs font-semibold text-stone-600 mt-1">Estimasi: {rate.etd}</p>
                                           </div>
                                           <div className={`font-bold text-lg ${rate.cost === 0 ? 'text-green-600' : 'text-stone-900'}`}>
                                               {rate.cost === 0 ? 'GRATIS' : `Rp ${rate.cost.toLocaleString('id-ID')}`}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </RadioGroup>
                        )}
                    </CardContent>
                </Card>
            )}
            
            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle>Metode Pembayaran</CardTitle>
                    <CardDescription>Pilih metode pembayaran yang Anda inginkan</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-3">
                        {/* QRIS */}
                        <div className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'qris' ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 hover:bg-stone-50'}`}>
                            <RadioGroupItem value="qris" id="pm-qris" />
                            <Label htmlFor="pm-qris" className="flex-1 cursor-pointer flex items-center justify-between">
                                <span className="font-bold text-stone-900">QRIS (GoPay/OVO/Dana)</span>
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Instant</span>
                            </Label>
                        </div>

                        {/* Virtual Accounts */}
                        <div className="space-y-2 mt-2">
                            <Label className="text-xs text-stone-500 uppercase tracking-wider font-bold ml-1">Virtual Accounts</Label>
                            {[
                                { id: 'bca_va', label: 'BCA Virtual Account' },
                                { id: 'bni_va', label: 'BNI Virtual Account' },
                                { id: 'bri_va', label: 'BRI Virtual Account' },
                                { id: 'mandiri_va', label: 'Mandiri Virtual Account' },
                            ].map((pm) => (
                                <div key={pm.id} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === pm.id ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 hover:bg-stone-50'}`}>
                                    <RadioGroupItem value={pm.id} id={`pm-${pm.id}`} />
                                    <Label htmlFor={`pm-${pm.id}`} className="flex-1 cursor-pointer font-medium text-stone-800">
                                        {pm.label}
                                    </Label>
                                </div>
                            ))}
                        </div>

                        {/* Others */}
                         <div className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors mt-2 ${paymentMethod === 'all' ? 'border-primary bg-stone-100 ring-1 ring-primary' : 'border-stone-200 hover:bg-stone-50'}`}>
                            <RadioGroupItem value="all" id="pm-all" />
                            <Label htmlFor="pm-all" className="flex-1 cursor-pointer">
                                <span className="font-bold block text-stone-900">Metode Lainnya</span>
                                <span className="text-xs text-stone-500">Pilih metode pembayaran lainnya (PayPal, dll) di halaman selanjutnya</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Address Selector Dialog */}
            <Dialog open={isAddrSelectorOpen} onOpenChange={setIsAddrSelectorOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pilih Alamat Pengiriman</DialogTitle>
                        <DialogDescription>Pilih salah satu alamat yang tersimpan.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {savedAddresses.map((addr) => (
                            <div 
                                key={addr.id} 
                                onClick={() => handleSelectAddress(addr)}
                                className="p-4 border rounded-lg cursor-pointer hover:border-black hover:bg-stone-50 transition-colors relative"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm block">{addr.label}</span>
                                    {addr.isDefault && <Badge variant="secondary" className="text-[10px]">Utama</Badge>}
                                </div>
                                <p className="font-medium text-sm">{addr.recipientName}</p>
                                <p className="text-sm text-stone-600">{addr.phone}</p>
                                <p className="text-sm text-stone-500 mt-1">
                                    {addr.addressLine}<br/>
                                    {addr.district}, {addr.city}, {addr.province}, {addr.postalCode}
                                </p>
                            </div>
                        ))}
                        <Button variant="ghost" className="w-full mt-2" onClick={() => router.push('/customer/profile')}>
                            Kelola Alamat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription>{checkoutItems.length} items in cart</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="mb-4">
                        <CouponInput />
                    </div>

                    {/* Items List */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {checkoutItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-gray-100 h-16 w-16 rounded-md overflow-hidden">
                                        {item.productVariant?.images?.[0] && (
                                            <img src={item.productVariant.images[0]} alt={item.name} className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="font-medium">Rp {item.price.toLocaleString('id-ID')}</p>
                            </div>
                        ))}
                    </div>
                    
                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span>Rp {totals.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span>{selectedRate ? `Rp ${selectedRate.cost.toLocaleString('id-ID')}` : '-'}</span>
                        </div>
                        
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Discount</span>
                                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        
                        {weightInfo && (
                             <div className="flex justify-between text-xs text-stone-500 py-1 bg-stone-50 px-2 rounded">
                                <span>Charged Weight ({weightInfo.isHeavy ? 'Heavy' : 'Standard'})</span>
                                <span>{weightInfo.final} kg</span>
                            </div>
                        )}

                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>Rp {(totals.total + (selectedRate?.cost || 0)).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full h-12 text-lg bg-stone-900 hover:bg-stone-800" 
                        onClick={handlePlaceOrder}
                        disabled={loading || !selectedRate}
                    >
                        {loading ? 'Processing Order...' : 'Place Order'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
