'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Package, 
  Camera, 
  CheckCircle,
  AlertTriangle,
  Navigation,
  Clock,
  Truck,
  User,
  DollarSign,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { compressImage } from '@/lib/client-image-compression'

interface TaskDetail {
  id: string
  status: string
  notes: string | null
  order: {
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    shippingAddress: string
    total: number
    paymentStatus: string
    paymentMethod: string
    orderNotes: string | null
    createdAt: string
    items: Array<{
       productName: string
       variantName: string
       quantity: number
       price: number
    }>
  }
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const sigPad = useRef<SignatureCanvas>(null)

  useEffect(() => {
    fetchTaskDetails()
  }, [id])

  const fetchTaskDetails = async () => {
    try {
      console.log('Fetching task with ID:', id)
      const response = await fetch(`/api/driver/tasks/${id}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Task data received:', data)
        setTask(data.task)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch task:', response.status, errorText)
        toast.error(`Gagal memuat detail tugas: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch task:', error)
      toast.error('Terjadi kesalahan saat memuat detail tugas')
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (addressStr: string) => {
    if (!addressStr) return 'No address provided';
    try {
      if (addressStr.trim().startsWith('{')) {
        const parsed = JSON.parse(addressStr);
        const parts = [
          parsed.address,
          parsed.city,
          parsed.province,
          parsed.zip
        ].filter(Boolean);
        return parts.join(', ');
      }
      return addressStr;
    } catch (e) {
      return addressStr;
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
        toast.loading('Mengompress foto...')
        const compressedBase64 = await compressImage(file, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.7
        })
        setDeliveryPhoto(compressedBase64)
        toast.dismiss()
        toast.success('Foto berhasil diunggah')
    } catch (error) {
        console.error('Photo upload error:', error)
        toast.dismiss()
        toast.error('Gagal mengunggah foto')
    }
  }

  const handleCompleteDelivery = async () => {
    if (!deliveryPhoto) {
        toast.error('Harap unggah foto bukti pengiriman')
        return
    }
    
    // Check signature pad exists and is not empty
    const isSigEmpty = !sigPad.current || sigPad.current.isEmpty();
    if (isSigEmpty) {
        toast.error('Harap minta tanda tangan penerima')
        return
    }

    setUploading(true)
    try {
        const signature = sigPad.current?.toDataURL()
        console.log('Sending delivery completion request...')
        
        const response = await fetch(`/api/driver/tasks/${id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deliveryPhoto,
                signature,
                notes: deliveryNotes,
                timestamp: new Date().toISOString()
            })
        })

        const data = await response.json()
        console.log('Completion response:', data)

        if (response.ok) {
            toast.success('Pengiriman berhasil diselesaikan!')
            router.push('/driver/dashboard')
        } else {
            console.error('Completion failed:', data)
            toast.error(data.error || 'Gagal menyelesaikan pengiriman')
        }
    } catch (error) {
        console.error('Completion error:', error)
        toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
        setUploading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
      try {
          console.log(`Updating status to: ${newStatus}`)
          const response = await fetch(`/api/driver/tasks/${id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
          })
          
          const data = await response.json()
          
          if (response.ok) {
              const statusLabel = newStatus === 'PICKED_UP' ? 'Barang Diambil' : 'Dalam Perjalanan';
              toast.success(`Berhasil: ${statusLabel}`)
              // Refresh task details
              fetchTaskDetails()
          } else {
              toast.error(data.error || 'Gagal memperbarui status')
          }
      } catch (error) {
          console.error('Status update error:', error)
          toast.error('Gagal memperbarui status: Masalah koneksi')
      }
  }

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900" />
              <p className="font-medium text-stone-500 text-sm">Memuat data...</p>
          </div>
      </div>
  )
  
  if (!task) return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
          <Card className="max-w-md w-full p-8 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-stone-400" />
              </div>
              <h2 className="font-bold text-lg text-stone-900 mb-2">Tugas Tidak Ditemukan</h2>
              <p className="text-sm text-stone-500 mb-6">
                  Tugas tidak tersedia atau Anda tidak memiliki akses.
              </p>
              <Button onClick={() => router.back()} variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
              </Button>
          </Card>
      </div>
  )

  const fullAddress = formatAddress(task.order.shippingAddress);
  const isCOD = task.order.paymentMethod === 'COD' || task.order.paymentStatus !== 'PAID';

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ASSIGNED': return { label: 'Ditugaskan', color: 'bg-stone-900 text-white' }
      case 'PICKED_UP': return { label: 'Diambil', color: 'bg-amber-500 text-white' }
      case 'IN_TRANSIT': return { label: 'Dalam Perjalanan', color: 'bg-blue-500 text-white' }
      case 'DELIVERED': return { label: 'Selesai', color: 'bg-emerald-500 text-white' }
      default: return { label: status, color: 'bg-stone-500 text-white' }
    }
  }

  const statusBadge = getStatusBadge(task.status)

  return (
    <div className="min-h-screen bg-stone-50">
        {/* Compact Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm z-30">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">#{task.order.orderNumber}</p>
                    <h1 className="font-bold text-sm text-stone-900">Detail Pengiriman</h1>
                </div>
            </div>
            <Badge className={`text-[10px] font-bold px-2 py-0.5 ${statusBadge.color}`}>
                {statusBadge.label}
            </Badge>
        </div>

        <div className="p-4 space-y-3 pb-24">
            {/* Customer Info - Compact */}
            <Card className="p-3 border-stone-200">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-stone-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-stone-900">{task.order.customerName}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">{task.order.customerPhone}</p>
                        <div className="flex items-start gap-1.5 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-stone-600 leading-relaxed">{fullAddress}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Communication & Navigation Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Button 
                    className="bg-white border border-stone-200 text-stone-900 hover:bg-stone-50 h-12 shadow-sm font-bold"
                    onClick={() => {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`, '_blank')
                    }}
                >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigasi
                </Button>
                <Button 
                    className="bg-white border border-stone-200 text-stone-900 hover:bg-stone-50 h-12 shadow-sm font-bold"
                    onClick={() => window.location.href = `tel:${task.order.customerPhone}`}
                >
                    <Phone className="w-4 h-4 mr-2" />
                    Telepon
                </Button>
            </div>

            {/* Action Buttons - Compact */}
            <div className="space-y-2">
                {task.status === 'ASSIGNED' && (
                    <Button 
                        className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white font-bold"
                        onClick={() => handleStatusUpdate('PICKED_UP')}
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Ambil Barang di Toko
                    </Button>
                )}
                
                {task.status === 'PICKED_UP' && (
                    <>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                            <p className="text-sm font-bold text-amber-900">Barang Sudah Diambil</p>
                            <p className="text-xs text-amber-600 mt-1">Konfirmasi barang diterima untuk mulai pengantaran</p>
                        </div>
                        <Button 
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            onClick={() => handleStatusUpdate('IN_TRANSIT')}
                        >
                            <Truck className="w-4 h-4 mr-2" />
                            Barang Diterima - Mulai Pengantaran
                        </Button>
                    </>
                )}

                {task.status === 'IN_TRANSIT' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-sm font-bold text-blue-900">Dalam Perjalanan</p>
                        <p className="text-xs text-blue-600 mt-1">Scroll ke bawah untuk mengisi Bukti Pengiriman</p>
                    </div>
                )}
            </div>


            {/* Items - Compact */}
            <Card className="p-3 border-stone-200">
                <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-stone-500" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                        Barang ({task.order.items.length})
                    </h3>
                </div>
                <div className="space-y-2">
                    {task.order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-start text-xs">
                            <div className="flex-1">
                                <p className="font-medium text-stone-900">{item.productName}</p>
                                {item.variantName && <p className="text-stone-500">{item.variantName}</p>}
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-stone-900">{item.quantity}x</p>
                                <p className="text-stone-500">{formatPrice(item.price)}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-900">Total</span>
                    <span className="text-sm font-bold text-stone-900">{formatPrice(task.order.total)}</span>
                </div>
                {isCOD && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-bold">COD - Tagih ke customer</span>
                    </div>
                )}
            </Card>

            {/* Notes */}
            {task.order.orderNotes && (
                <Card className="p-3 border-stone-200 bg-blue-50">
                    <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-blue-900 mb-1">Catatan Customer:</p>
                            <p className="text-xs text-blue-700 italic">"{task.order.orderNotes}"</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Proof of Delivery - Only for IN_TRANSIT */}
            {task.status === 'IN_TRANSIT' && (
                <Card className="p-4 border-4 border-emerald-500 bg-emerald-50 mt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-base text-emerald-900">📸 Bukti Pengiriman</h3>
                        <Badge className="bg-emerald-600 text-white">Wajib Diisi</Badge>
                    </div>
                    
                    {/* Photo & Signature - Side by Side */}
                    {/* Photo & Signature - Vertical Layout for Mobile */}
                    <div className="flex flex-col gap-4 mb-4">
                        {/* Photo */}
                        <div>
                            <Label className="text-xs font-bold text-stone-600 block mb-2">Foto Barang di Lokasi</Label>
                            <div className="relative w-full h-48">
                                <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-stone-300 rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 overflow-hidden transition-colors">
                                    {deliveryPhoto ? (
                                        <img src={deliveryPhoto} alt="POD" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-stone-400">
                                            <Camera className="w-8 h-8" />
                                            <span className="text-xs font-bold uppercase">Ambil Foto</span>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
                                </label>
                                {deliveryPhoto && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md" 
                                        onClick={() => setDeliveryPhoto(null)}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Signature */}
                        <div>
                            <Label className="text-xs font-bold text-stone-600 block mb-2">Tanda Tangan Penerima</Label>
                            <div className="relative border-2 border-stone-300 rounded-lg bg-white overflow-hidden w-full h-48 touch-none">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="absolute top-1 right-1 h-6 text-[10px] px-2 z-10 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold border border-stone-200" 
                                    onClick={() => sigPad.current?.clear()}
                                >
                                    HAPUS
                                </Button>
                                <SignatureCanvas 
                                    ref={sigPad}
                                    canvasProps={{className: 'w-full h-full'}}
                                    backgroundColor="rgba(255,255,255,1)"
                                    penColor="#1c1917"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes - Compact */}
                    <div className="space-y-1 mb-3">
                        <Label className="text-[10px] font-bold text-stone-600">Catatan (Opsional)</Label>
                        <Textarea 
                            placeholder="Diterima oleh..."
                            className="text-xs min-h-[50px] p-2"
                            value={deliveryNotes}
                            onChange={e => setDeliveryNotes(e.target.value)}
                        />
                    </div>

                    {/* Validation Warning */}
                    {(!deliveryPhoto || sigPad.current?.isEmpty()) && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-center mb-3">
                            <p className="text-xs font-bold text-amber-900">
                                {!deliveryPhoto && !sigPad.current?.isEmpty() && "⚠️ Foto belum diupload"}
                                {deliveryPhoto && sigPad.current?.isEmpty() && "⚠️ Tanda tangan belum diisi"}
                                {!deliveryPhoto && sigPad.current?.isEmpty() && "⚠️ Foto dan tanda tangan wajib diisi"}
                            </p>
                        </div>
                    )}

                    <Button 
                        className="w-full h-12 font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#059669', color: '#ffffff' }}
                        onClick={handleCompleteDelivery}
                        disabled={uploading || !deliveryPhoto || sigPad.current?.isEmpty()}
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full mr-2" />
                                Mengunggah...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Konfirmasi Barang Sampai
                            </>
                        )}
                    </Button>
                </Card>
            )}
        </div>
    </div>
  )
}
