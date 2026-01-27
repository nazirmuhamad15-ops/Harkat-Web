'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Phone, MapPin, Plus, Trash2, Home, Building, Pencil, Lock, Shield, Key } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Address {
    id: string
    label: string
    recipientName: string
    phone: string
    addressLine: string
    city: string
    province: string
    district: string
    postalCode: string
    isDefault: boolean
}

export default function CustomerProfilePage() {
  const { data: session } = useSession()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [isAddrDialogOpen, setIsAddrDialogOpen] = useState(false)
  const [savingAddr, setSavingAddr] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // New Address Form State
  const [newAddr, setNewAddr] = useState({
      label: 'Rumah',
      recipientName: '',
      phone: '',
      addressLine: '',
      province: '',
      city: '',
      district: '',
      postalCode: '',
      isDefault: false
  })

  // Security State
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' })
  const [loadingPass, setLoadingPass] = useState(false)

  // Phone Change State
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [phoneStep, setPhoneStep] = useState<'INPUT' | 'OTP'>('INPUT')
  const [changePhoneNum, setChangePhoneNum] = useState('')
  const [otp, setOtp] = useState('')
  const [loadingPhone, setLoadingPhone] = useState(false)

  useEffect(() => {
      fetchAddresses()
  }, [])

  const handleChangePassword = async () => {
      if (passData.new !== passData.confirm) {
          toast.error('Konfirmasi password tidak sama')
          return
      }
      if (passData.new.length < 6) {
          toast.error('Password minimal 6 karakter')
          return
      }

      setLoadingPass(true)
      try {
          const res = await fetch('/api/customer/profile/password', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  currentPassword: passData.current, 
                  newPassword: passData.new 
              })
          })
          
          const data = await res.json()
          
          if (res.ok) {
              toast.success('Password berhasil diubah')
              setIsPasswordDialogOpen(false)
              setPassData({ current: '', new: '', confirm: '' })
          } else {
              toast.error(data.error || 'Gagal mengubah password')
          }
      } catch (err) {
          toast.error('Terjadi kesalahan')
      } finally {
          setLoadingPass(false)
      }
  }

  const handleRequestPhoneOtp = async () => {
      if (!changePhoneNum || changePhoneNum.length < 10) {
          toast.error('Nomor telepon tidak valid')
          return
      }

      setLoadingPhone(true)
      try {
          const res = await fetch('/api/customer/profile/phone/request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newPhone: changePhoneNum })
          })
          
          const data = await res.json()
          
          if (res.ok) {
              toast.success('OTP terkirim ke email Anda')
              setPhoneStep('OTP')
          } else {
              toast.error(data.error || 'Gagal mengirim OTP')
          }
      } catch (err) {
          toast.error('Terjadi kesalahan')
      } finally {
          setLoadingPhone(false)
      }
  }

  const handleVerifyPhoneOtp = async () => {
      if (!otp || otp.length < 6) {
          toast.error('Masukkan kode OTP dengan benar')
          return
      }

      setLoadingPhone(true)
      try {
          const res = await fetch('/api/customer/profile/phone/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ otp })
          })
          
          const data = await res.json()
          
          if (res.ok) {
              toast.success('Nomor telepon berhasil diubah')
              setIsPhoneDialogOpen(false)
              setPhoneStep('INPUT')
              setChangePhoneNum('')
              setOtp('')
              // Refresh session ideally, but for now specific page refresh or just alert
              window.location.reload() 
          } else {
              toast.error(data.error || 'Verifikasi gagal')
          }
      } catch (err) {
          toast.error('Terjadi kesalahan')
      } finally {
          setLoadingPhone(false)
      }
  }

  const fetchAddresses = async () => {
      try {
          const res = await fetch('/api/customer/addresses')
          if (res.ok) {
              const data = await res.json()
              setAddresses(data.addresses || [])
          }
      } catch (err) {
          console.error(err)
      } finally {
          setLoadingAddresses(false)
      }
  }

  const handleEditAddress = (addr: Address) => {
      setNewAddr({
          label: addr.label,
          recipientName: addr.recipientName,
          phone: addr.phone,
          addressLine: addr.addressLine,
          province: addr.province || '',
          city: addr.city || '',
          district: addr.district || '',
          postalCode: addr.postalCode || '',
          isDefault: addr.isDefault
      })
      setEditId(addr.id)
      setIsAddrDialogOpen(true)
  }

  const handleSaveAddress = async () => {
      // Basic validation
      if (!newAddr.recipientName || !newAddr.phone || !newAddr.addressLine || !newAddr.city) {
          toast.error('Mohon lengkapi data alamat')
          return
      }

      setSavingAddr(true)
      try {
          const url = editId ? `/api/customer/addresses/${editId}` : '/api/customer/addresses'
          const method = editId ? 'PUT' : 'POST'

          const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newAddr)
          })

          if (res.ok) {
              toast.success(editId ? 'Alamat diperbarui' : 'Alamat berhasil disimpan')
              setIsAddrDialogOpen(false)
              setNewAddr({
                  label: 'Rumah',
                  recipientName: '',
                  phone: '',
                  addressLine: '',
                  province: '',
                  city: '',
                  district: '',
                  postalCode: '',
                  isDefault: false
              })
              setEditId(null)
              fetchAddresses()
          } else {
              const err = await res.json()
              toast.error(err.error || 'Gagal menyimpan alamat')
          }
      } catch (err) {
          toast.error('Terjadi kesalahan')
      } finally {
          setSavingAddr(false)
      }
  }

  const handleDeleteAddress = async (id: string) => {
      if (!confirm('Apakah Anda yakin ingin menghapus alamat ini?')) return

      try {
          const res = await fetch(`/api/customer/addresses/${id}`, {
              method: 'DELETE'
          })

          if (res.ok) {
              toast.success('Alamat dihapus')
              fetchAddresses()
          } else {
              toast.error('Gagal menghapus alamat')
          }
      } catch (err) {
          toast.error('Terjadi kesalahan')
      }
  }

  const handleSetDefault = async (id: string) => {
      try {
          const res = await fetch('/api/customer/addresses/set-default', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id })
          })

          if (res.ok) {
              toast.success('Alamat utama diperbarui')
              fetchAddresses()
          } else {
              toast.error('Gagal memperbarui alamat utama')
          }
      } catch (err) {
          toast.error('Terjadi kesalahan')
      }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500">Kelola informasi pribadi dan alamat pengiriman.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-1 border-stone-100 shadow-sm">
            <CardContent className="pt-6 text-center">
                <div className="mb-4 flex justify-center">
                    <Avatar className="h-24 w-24 ring-4 ring-stone-50">
                        <AvatarImage src={session?.user?.image || ''} />
                        <AvatarFallback className="text-2xl bg-stone-100 text-stone-600">{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{session?.user?.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{session?.user?.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200">
                    Customer Account
                </div>
            </CardContent>
        </Card>

        {/* Details Form */}
        <Card className="lg:col-span-2 border-stone-100 shadow-sm">
            <CardHeader>
                <CardTitle>Data Diri</CardTitle>
                <CardDescription>Informasi kontak akun Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nama Lengkap</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input defaultValue={session?.user?.name || ''} className="pl-9 bg-gray-50" disabled />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input defaultValue={session?.user?.email || ''} className="pl-9 bg-gray-50" disabled />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>No. Telepon</Label>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" onClick={() => setIsPhoneDialogOpen(true)}>Ubah</Button>
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input defaultValue={session?.user?.phone || ''} className="pl-9 bg-gray-50" disabled />
                        </div>
                    </div>
                </div>
                
                <div className="pt-2 text-xs text-stone-500 italic">
                    * Hubungi admin jika ingin mengubah email atau nomor telepon.
                </div>
            </CardContent>
        </Card>

        {/* Security / Password */}
        <Card className="lg:col-span-3 border-stone-100 shadow-sm">
            <CardHeader>
                <CardTitle>Keamanan Akun</CardTitle>
                <CardDescription>Kelola password dan keamanan akun Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-full shadow-sm text-stone-700">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-stone-900 text-sm">Password</h4>
                            <p className="text-xs text-stone-500">Ubah password Anda secara berkala untuk keamanan.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsPasswordDialogOpen(true)}>
                        <Key className="w-4 h-4 mr-2" />
                        Ganti Password
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ganti Password</DialogTitle>
                    <DialogDescription>Masukkan password saat ini dan password baru Anda.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Password Saat Ini</Label>
                        <Input type="password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Password Baru</Label>
                        <Input type="password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Konfirmasi Password Baru</Label>
                        <Input type="password" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleChangePassword} disabled={loadingPass}>{loadingPass ? 'Menyimpan...' : 'Simpan'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Change Phone Dialog */}
        <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ubah Nomor Telepon</DialogTitle>
                    <DialogDescription>
                        {phoneStep === 'INPUT' 
                            ? 'Masukkan nomor telepon baru Anda. Kami akan mengirimkan OTP ke email terdaftar.' 
                            : 'Masukkan kode OTP yang telah dikirim ke email Anda.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {phoneStep === 'INPUT' ? (
                        <div className="space-y-2">
                            <Label>Nomor Telepon Baru</Label>
                            <Input 
                                placeholder="08..." 
                                value={changePhoneNum} 
                                onChange={e => setChangePhoneNum(e.target.value)} 
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-center mb-4">
                                <p className="text-sm text-stone-500">OTP dikirim ke: <span className="font-medium text-stone-900">{session?.user?.email}</span></p>
                            </div>
                            <Label>Kode OTP (6 Digit)</Label>
                            <Input 
                                className="text-center text-2xl tracking-widest"
                                maxLength={6}
                                value={otp} 
                                onChange={e => setOtp(e.target.value)} 
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsPhoneDialogOpen(false); setPhoneStep('INPUT'); }}>Batal</Button>
                    {phoneStep === 'INPUT' ? (
                        <Button onClick={handleRequestPhoneOtp} disabled={loadingPhone}>{loadingPhone ? 'Mengirim...' : 'Kirim OTP'}</Button>
                    ) : (
                         <Button onClick={handleVerifyPhoneOtp} disabled={loadingPhone}>{loadingPhone ? 'Memverifikasi...' : 'Verifikasi'}</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Address Book */}
        <Card className="lg:col-span-3 border-stone-100 shadow-sm">
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Daftar Alamat</CardTitle>
                    <CardDescription>Kelola alamat pengiriman untuk checkout lebih cepat.</CardDescription>
                </div>
                <Dialog open={isAddrDialogOpen} onOpenChange={(open) => { setIsAddrDialogOpen(open); if(!open) setEditId(null); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-stone-900 hover:bg-stone-800">
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Alamat
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editId ? 'Ubah Alamat' : 'Tambah Alamat Baru'}</DialogTitle>
                            <DialogDescription>Masukkan detail alamat pengiriman Anda.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Label Alamat</Label>
                                    <Input 
                                        placeholder="Rumah, Kantor, dll" 
                                        value={newAddr.label}
                                        onChange={e => setNewAddr({...newAddr, label: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nama Penerima</Label>
                                    <Input 
                                        placeholder="Nama lengkap" 
                                        value={newAddr.recipientName}
                                        onChange={e => setNewAddr({...newAddr, recipientName: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>No. Telepon Penerima</Label>
                                <Input 
                                    placeholder="08..." 
                                    value={newAddr.phone}
                                    onChange={e => setNewAddr({...newAddr, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Alamat Lengkap</Label>
                                <Input 
                                    placeholder="Jl. Contoh No. 123, Rt/Rw..." 
                                    value={newAddr.addressLine}
                                    onChange={e => setNewAddr({...newAddr, addressLine: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Provinsi</Label>
                                    <Input 
                                        placeholder="Jawa Barat" 
                                        value={newAddr.province}
                                        onChange={e => setNewAddr({...newAddr, province: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kota/Kabupaten</Label>
                                    <Input 
                                        placeholder="Bandung" 
                                        value={newAddr.city}
                                        onChange={e => setNewAddr({...newAddr, city: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Kecamatan</Label>
                                    <Input 
                                        placeholder="Coblong" 
                                        value={newAddr.district}
                                        onChange={e => setNewAddr({...newAddr, district: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kode Pos</Label>
                                    <Input 
                                        placeholder="40132" 
                                        value={newAddr.postalCode}
                                        onChange={e => setNewAddr({...newAddr, postalCode: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox 
                                    id="default" 
                                    checked={newAddr.isDefault}
                                    onCheckedChange={(c) => setNewAddr({...newAddr, isDefault: !!c})}
                                />
                                <Label htmlFor="default" className="text-sm font-normal">Jadikan Alamat Utama</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsAddrDialogOpen(false); setEditId(null); }}>Batal</Button>
                            <Button onClick={handleSaveAddress} disabled={savingAddr}>
                                {savingAddr ? 'Menyimpan...' : 'Simpan Alamat'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loadingAddresses ? (
                    <div className="text-center py-8 text-stone-400">Memuat alamat...</div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4 font-medium">Belum ada alamat tersimpan.</p>
                        <Button variant="outline" onClick={() => setIsAddrDialogOpen(true)}>Tambah Alamat Pengiriman</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                            <div key={addr.id} className="border border-stone-200 rounded-lg p-4 relative hover:border-stone-400 transition-colors bg-white">
                                {addr.isDefault && (
                                    <Badge className="absolute top-4 right-4 bg-stone-900 hover:bg-stone-900">Utama</Badge>
                                )}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                                        {addr.label.toLowerCase().includes('kantor') ? <Building className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-stone-900">{addr.label}</h4>
                                        <p className="text-sm text-stone-500">{addr.recipientName}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-stone-600 space-y-1 mb-4">
                                    <p>{addr.addressLine}</p>
                                    <p>{addr.district}, {addr.city}</p>
                                    <p>{addr.province}, {addr.postalCode}</p>
                                    <p className="flex items-center mt-2 text-stone-500">
                                        <Phone className="w-3.5 h-3.5 mr-2" />
                                        {addr.phone}
                                    </p>
                                </div>
                                <div className="flex justify-end pt-3 border-t border-stone-100">
                                    {!addr.isDefault && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-stone-500 hover:text-stone-900 h-8 mr-2"
                                            onClick={() => handleSetDefault(addr.id)}
                                        >
                                            Jadikan Utama
                                        </Button>
                                    )}
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 mr-2"
                                        onClick={() => handleEditAddress(addr)}
                                    >
                                        <Pencil className="w-3.5 h-3.5 mr-2" />
                                        Ubah
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                                        onClick={() => handleDeleteAddress(addr.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
