'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Settings, 
  Save,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building,
  Truck,
  Calculator,
  Package,
  CreditCard,
  Bell,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'

interface SystemSettings {
  store: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  shipping: {
    freeShippingThreshold: number
    defaultShippingCost: number
    volumetricDivisor: number
    weightThreshold: number
    insuranceRate: number
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    whatsappNotifications: boolean
    orderConfirmation: boolean
    shippingUpdates: boolean
    deliveryConfirmation: boolean
  }
  payment: {
    bankName: string
    bankAccount: string
    bankAccountName: string
    paymentMethods: string[]
  }
}

export default function SettingsPage() {
  const { csrfToken } = useCsrf()
  const { data: session } = useSession()
  const [settings, setSettings] = useState<SystemSettings>({
    store: {
      name: 'Harkat Furniture',
      email: 'info@harkatfurniture.com',
      phone: '+62 812 3456 7890',
      address: 'Jl. Furniture No. 123',
      city: 'Jepara',
      province: 'Jawa Tengah',
      postalCode: '59412',
      country: 'Indonesia'
    },
    shipping: {
      freeShippingThreshold: 5000000,
      defaultShippingCost: 150000,
      volumetricDivisor: 4000,
      weightThreshold: 50,
      insuranceRate: 0.2
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      whatsappNotifications: true,
      orderConfirmation: true,
      shippingUpdates: true,
      deliveryConfirmation: true
    },
    payment: {
      bankName: 'BCA',
      bankAccount: '1234567890',
      bankAccountName: 'CV Harkat Furniture',
      paymentMethods: ['transfer', 'ewallet', 'cod']
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(state => ({
             ...state,
             ...data.settings,
             shipping: { ...state.shipping, ...data.settings.shipping },
             store: { ...state.store, ...data.settings.store },
             notifications: { ...state.notifications, ...data.settings.notifications },
             payment: { ...state.payment, ...data.settings.payment }
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    
    try {
      const response = await fetchWithCsrf('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      }, csrfToken)

      if (response.ok) {
        toast.success('Pengaturan berhasil disimpan')
      } else {
        toast.error('Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (category: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  if (loading) {
     return (
        <div className="h-full flex items-center justify-center">
           <p className="text-stone-500 text-sm">Loading settings...</p>
        </div>
     )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 bg-white px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-stone-100 rounded-lg">
              <Settings className="w-5 h-5 text-stone-700" />
           </div>
           <div>
              <h1 className="text-lg font-bold text-stone-900">Pengaturan Sistem</h1>
              <p className="text-xs text-stone-500">Konfigurasi toko, pengiriman, dan pembayaran</p>
           </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings} className="border-stone-200 text-stone-600 hover:bg-stone-50">
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={saveSettings} disabled={saving} className="bg-stone-900 hover:bg-stone-800">
            <Save className="w-3.5 h-3.5 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="store" className="space-y-6">
          <div className="sticky top-0 z-10 bg-white pb-4">
            <TabsList className="grid w-full grid-cols-4 bg-stone-100 p-1 rounded-lg">
                <TabsTrigger value="store" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">
                   <Building className="w-4 h-4 mr-2" /> Toko
                </TabsTrigger>
                <TabsTrigger value="shipping" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">
                   <Truck className="w-4 h-4 mr-2" /> Pengiriman
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">
                   <Bell className="w-4 h-4 mr-2" /> Notifikasi
                </TabsTrigger>
                <TabsTrigger value="payment" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">
                   <CreditCard className="w-4 h-4 mr-2" /> Pembayaran
                </TabsTrigger>
            </TabsList>
          </div>

          {/* Store Settings */}
          <TabsContent value="store" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-3">
                  <CardTitle className="flex items-center text-base font-bold text-stone-800">
                    <Building className="w-4 h-4 mr-2 text-stone-500" />
                    Informasi Toko
                  </CardTitle>
                  <CardDescription>Informasi dasar yang akan muncul di invoice dan footer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nama Toko</Label>
                    <Input
                      id="storeName"
                      value={settings.store.name}
                      onChange={(e) => updateSettings('store', 'name', e.target.value)}
                      className="border-stone-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Email Toko</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={settings.store.email}
                      onChange={(e) => updateSettings('store', 'email', e.target.value)}
                      className="border-stone-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Nomor Telepon</Label>
                    <Input
                      id="storePhone"
                      value={settings.store.phone}
                      onChange={(e) => updateSettings('store', 'phone', e.target.value)}
                      className="border-stone-200"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-3">
                  <CardTitle className="flex items-center text-base font-bold text-stone-800">
                    <MapPin className="w-4 h-4 mr-2 text-stone-500" />
                    Alamat Fisik
                  </CardTitle>
                  <CardDescription>Lokasi gudang atau toko fisik utama.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <Textarea
                      id="address"
                      value={settings.store.address}
                      onChange={(e) => updateSettings('store', 'address', e.target.value)}
                      rows={3}
                      className="border-stone-200 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Kota / Kabupaten</Label>
                      <Input
                        id="city"
                        value={settings.store.city}
                        onChange={(e) => updateSettings('store', 'city', e.target.value)}
                        className="border-stone-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provinsi</Label>
                      <Input
                        id="province"
                        value={settings.store.province}
                        onChange={(e) => updateSettings('store', 'province', e.target.value)}
                        className="border-stone-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Kode Pos</Label>
                      <Input
                        id="postalCode"
                        value={settings.store.postalCode}
                        onChange={(e) => updateSettings('store', 'postalCode', e.target.value)}
                        className="border-stone-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Negara</Label>
                      <Input
                        id="country"
                        value={settings.store.country}
                        onChange={(e) => updateSettings('store', 'country', e.target.value)}
                        className="border-stone-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value="shipping" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-3">
                  <CardTitle className="flex items-center text-base font-bold text-stone-800">
                    <Truck className="w-4 h-4 mr-2 text-stone-500" />
                    Konfigurasi Biaya
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Ambang Batas Gratis Ongkir (Rp)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">Rp</span>
                        <Input
                        id="freeShippingThreshold"
                        type="number"
                        value={settings.shipping.freeShippingThreshold}
                        onChange={(e) => updateSettings('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
                        className="pl-9 border-stone-200"
                        />
                    </div>
                    <p className="text-[10px] text-stone-500">Order di atas nominal ini akan mendapatkan gratis ongkir.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultShippingCost">Biaya Ongkir Default (Rp)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">Rp</span>
                        <Input
                        id="defaultShippingCost"
                        type="number"
                        value={settings.shipping.defaultShippingCost}
                        onChange={(e) => updateSettings('shipping', 'defaultShippingCost', parseFloat(e.target.value))}
                        className="pl-9 border-stone-200"
                        />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-3">
                  <CardTitle className="flex items-center text-base font-bold text-stone-800">
                    <Calculator className="w-4 h-4 mr-2 text-stone-500" />
                    Kalkulasi Berat & Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="volumetricDivisor">Pembagi Berat Volume</Label>
                    <Input
                      id="volumetricDivisor"
                      type="number"
                      value={settings.shipping.volumetricDivisor}
                      onChange={(e) => updateSettings('shipping', 'volumetricDivisor', parseFloat(e.target.value))}
                      className="border-stone-200"
                    />
                    <p className="text-xs text-stone-500 bg-stone-50 p-2 rounded border border-stone-100">
                      Rumus: (Panjang × Lebar × Tinggi) / {settings.shipping.volumetricDivisor}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightThreshold">Batas Berat Kargo (kg)</Label>
                    <Input
                      id="weightThreshold"
                      type="number"
                      value={settings.shipping.weightThreshold}
                      onChange={(e) => updateSettings('shipping', 'weightThreshold', parseFloat(e.target.value))}
                      className="border-stone-200"
                    />
                    <p className="text-[10px] text-stone-500">
                      Order ≥ {settings.shipping.weightThreshold}kg akan otomatis diarahkan ke pengiriman kargo internal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="mt-0">
            <Card className="border-stone-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-stone-50 border-b border-stone-100 pb-3">
                <CardTitle className="flex items-center text-base font-bold text-stone-800">
                  <MessageSquare className="w-4 h-4 mr-2 text-stone-500" />
                  Preferensi Notifikasi
                </CardTitle>
                <CardDescription>Pilih channel dan jenis event notifikasi.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-100">
                   <div className="p-6 space-y-6">
                      <h3 className="font-bold text-stone-800 text-sm mb-4">Saluran Notifikasi</h3>
                      <div className="flex items-center justify-between">
                        <div>
                           <Label className="text-stone-700">Email Notifications</Label>
                           <p className="text-xs text-stone-500">Kirim notifikasi via email</p>
                        </div>
                        <Switch
                           checked={settings.notifications.emailNotifications}
                           onCheckedChange={(checked) => updateSettings('notifications', 'emailNotifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                           <Label className="text-stone-700">WhatsApp Notifications</Label>
                           <p className="text-xs text-stone-500">Kirim notifikasi ke WA pelanggan</p>
                        </div>
                        <Switch
                           checked={settings.notifications.whatsappNotifications}
                           onCheckedChange={(checked) => updateSettings('notifications', 'whatsappNotifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                           <Label className="text-stone-700">SMS Notifications</Label>
                           <p className="text-xs text-stone-500">Fallback jika WA gagal (Berbayar)</p>
                        </div>
                        <Switch
                           checked={settings.notifications.smsNotifications}
                           onCheckedChange={(checked) => updateSettings('notifications', 'smsNotifications', checked)}
                        />
                      </div>
                   </div>

                   <div className="p-6 space-y-6">
                      <h3 className="font-bold text-stone-800 text-sm mb-4">Event Trigger</h3>
                      <div className="flex items-center justify-between">
                        <div>
                           <Label className="text-stone-700">Konfirmasi Order</Label>
                           <p className="text-xs text-stone-500">Saat customer baru checkout</p>
                        </div>
                        <Switch
                           checked={settings.notifications.orderConfirmation}
                           onCheckedChange={(checked) => updateSettings('notifications', 'orderConfirmation', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                           <Label className="text-stone-700">Update Resi / Shipping</Label>
                           <p className="text-xs text-stone-500">Saat barang dikirim</p>
                        </div>
                        <Switch
                           checked={settings.notifications.shippingUpdates}
                           onCheckedChange={(checked) => updateSettings('notifications', 'shippingUpdates', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                           <Label className="text-stone-700">Paket Diterima</Label>
                           <p className="text-xs text-stone-500">Notifikasi saat paket sampai</p>
                        </div>
                        <Switch
                           checked={settings.notifications.deliveryConfirmation}
                           onCheckedChange={(checked) => updateSettings('notifications', 'deliveryConfirmation', checked)}
                        />
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-3">
                  <CardTitle className="flex items-center text-base font-bold text-stone-800">
                    <CreditCard className="w-4 h-4 mr-2 text-stone-500" />
                    Rekening Utama
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Nama Bank</Label>
                    <Input
                      id="bankName"
                      value={settings.payment.bankName}
                      onChange={(e) => updateSettings('payment', 'bankName', e.target.value)}
                      className="border-stone-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Nomor Rekening</Label>
                    <Input
                      id="bankAccount"
                      value={settings.payment.bankAccount}
                      onChange={(e) => updateSettings('payment', 'bankAccount', e.target.value)}
                      className="border-stone-200 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">Atas Nama</Label>
                    <Input
                      id="bankAccountName"
                      value={settings.payment.bankAccountName}
                      onChange={(e) => updateSettings('payment', 'bankAccountName', e.target.value)}
                      className="border-stone-200"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-3">
                  <CardTitle className="text-base font-bold text-stone-800">Metode Pembayaran Aktif</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      { id: 'transfer', label: 'Bank Transfer (Konfirmasi Manual)' },
                      { id: 'ewallet', label: 'E-Wallet (QRIS / OVO / GoPay)' },
                      { id: 'cod', label: 'Cash on Delivery (Bayar Ditempat)' },
                      { id: 'creditcard', label: 'Kartu Kredit / Debit Online' }
                    ].map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 border border-stone-100 rounded-lg hover:bg-stone-50 transition-colors">
                        <div>
                          <Label htmlFor={method.id} className="cursor-pointer font-medium">{method.label}</Label>
                        </div>
                        <Switch
                          id={method.id}
                          checked={settings.payment.paymentMethods.includes(method.id)}
                          onCheckedChange={(checked) => {
                            const methods = checked 
                              ? [...settings.payment.paymentMethods, method.id]
                              : settings.payment.paymentMethods.filter(m => m !== method.id)
                            updateSettings('payment', 'paymentMethods', methods)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}