'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RefreshCw, 
  Smartphone, 
  Power, 
  PowerOff, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  FileText,
  Send,
  Users,
  ChevronRight,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface WhatsAppStatus {
  status: 'offline' | 'disconnected' | 'scanning' | 'connected'
  qr: string | null
  user: { id: string; name: string } | null
  botUrl?: string
  message?: string
}

interface Template {
  id: string
  name: string
  title: string
  content: string
  category: string
  isActive: boolean
  createdAt: string
}

const TEMPLATE_VARIABLES = [
  { name: '{{customer_name}}', description: 'Nama pelanggan' },
  { name: '{{order_number}}', description: 'Nomor order' },
  { name: '{{order_total}}', description: 'Total order (Rp)' },
  { name: '{{tracking_number}}', description: 'Nomor resi' },
  { name: '{{store_name}}', description: 'Nama toko' },
  { name: '{{delivery_date}}', description: 'Estimasi pengiriman' },
]

const DEFAULT_TEMPLATES = [
  {
    name: 'order_confirmation',
    title: 'Konfirmasi Order',
    category: 'order',
    content: `Halo {{customer_name}}! 👋

Terima kasih telah berbelanja di {{store_name}}.

📦 *Order #{{order_number}}*
💰 Total: Rp {{order_total}}

Kami akan segera memproses pesanan Anda.

Terima kasih! 🙏`
  },
  {
    name: 'shipping_update',
    title: 'Update Pengiriman',
    category: 'shipping',
    content: `Halo {{customer_name}}! 📦

Pesanan Anda sudah dikirim!

📦 Order: #{{order_number}}
🚚 No. Resi: {{tracking_number}}
📅 Estimasi: {{delivery_date}}

Track pesanan Anda di website kami.

Terima kasih! 🙏`
  },
  {
    name: 'payment_reminder',
    title: 'Pengingat Pembayaran',
    category: 'order',
    content: `Halo {{customer_name}}! 👋

Kami ingin mengingatkan bahwa pesanan Anda belum dibayar:

📦 Order: #{{order_number}}
💰 Total: Rp {{order_total}}

Silakan selesaikan pembayaran agar pesanan dapat diproses.

Terima kasih! 🙏`
  },
  {
    name: 'delivery_confirmation',
    title: 'Konfirmasi Pengiriman Sampai',
    category: 'shipping',
    content: `Halo {{customer_name}}! 🎉

Pesanan Anda sudah sampai!

📦 Order: #{{order_number}}

Terima kasih telah berbelanja di {{store_name}}.
Semoga puas dengan produk kami! ⭐

Jika ada pertanyaan, balas pesan ini.`
  },
  {
    name: 'order_cancelled',
    title: 'Order Dibatalkan',
    category: 'order',
    content: `Halo {{customer_name}},

Dengan berat hati kami informasikan bahwa pesanan Anda telah dibatalkan:

📦 Order: #{{order_number}}

Jika ini adalah kesalahan atau Anda ingin memesan kembali, silakan hubungi kami.

Terima kasih! 🙏`
  },
  {
    name: 'payment_received',
    title: 'Pembayaran Diterima',
    category: 'order',
    content: `Halo {{customer_name}}! ✅

Pembayaran Anda sudah kami terima!

📦 Order: #{{order_number}}
💰 Total: Rp {{order_total}}

Pesanan Anda sedang diproses dan akan segera dikirim.

Terima kasih! 🙏`
  },
  {
    name: 'welcome_customer',
    title: 'Selamat Datang',
    category: 'general',
    content: `Halo {{customer_name}}! 👋

Selamat datang di {{store_name}}! 🏠

Terima kasih telah bergabung dengan kami. Temukan koleksi furniture premium kami di:
🌐 harkatfurniture.com

Ada promo menarik untuk member baru! ✨

Selamat berbelanja! 🛒`
  },
  {
    name: 'promo_announcement',
    title: 'Promo & Diskon',
    category: 'promotion',
    content: `Halo {{customer_name}}! 🎁

*PROMO SPESIAL!* 🔥

Dapatkan diskon hingga 50% untuk semua produk furniture!

🛒 Belanja sekarang di harkatfurniture.com
📅 Berlaku sampai akhir bulan ini

Jangan sampai kehabisan! 🏃‍♂️`
  },
  {
    name: 'follow_up',
    title: 'Follow Up After Sales',
    category: 'general',
    content: `Halo {{customer_name}}! 👋

Bagaimana kabar furniture yang Anda beli dari kami?

📦 Order: #{{order_number}}

Kami ingin memastikan Anda puas dengan produk kami. Jika ada kendala atau pertanyaan, jangan ragu untuk menghubungi kami.

⭐ Jika puas, jangan lupa berikan ulasan ya!

Terima kasih! 🙏`
  },
  {
    name: 'broadcast_new_product',
    title: 'Broadcast: Produk Baru',
    category: 'promotion',
    content: `Halo {{customer_name}}! ✨

*PRODUK BARU TELAH HADIR!* 🆕

Kami baru saja meluncurkan koleksi terbaru yang pastinya cocok untuk rumah Anda!

🪑 Lihat koleksi lengkap di:
🌐 harkatfurniture.com/new-arrivals

Jangan lewatkan kesempatan menjadi yang pertama memilikinya! 🏠`
  },
  {
    name: 'broadcast_flash_sale',
    title: 'Broadcast: Flash Sale',
    category: 'promotion',
    content: `⚡ *FLASH SALE - HARI INI SAJA!* ⚡

Halo {{customer_name}}!

Diskon hingga 70% untuk produk pilihan!
⏰ Hanya 24 JAM!

🔥 Buruan checkout sebelum kehabisan!
🌐 harkatfurniture.com/flash-sale

Stok terbatas! 🏃‍♂️💨`
  },
  {
    name: 'broadcast_reminder',
    title: 'Broadcast: Reminder Umum',
    category: 'promotion',
    content: `Halo {{customer_name}}! 👋

Jangan lupa kunjungi website kami untuk promo dan penawaran menarik!

🌐 harkatfurniture.com

Kami tunggu pesanan Anda! 🛒

Terima kasih selalu menjadi pelanggan setia kami! ❤️`
  },
  {
    name: 'broadcast_greeting',
    title: 'Broadcast: Ucapan Hari Raya',
    category: 'promotion',
    content: `Halo {{customer_name}}! 🎉

*Selamat Hari Raya!* 🙏

Dari kami semua di {{store_name}}, kami mengucapkan selamat merayakan hari yang penuh berkah ini.

Semoga kebahagiaan selalu menyertai Anda dan keluarga! ✨

Salam hangat,
Tim Harkat Furniture 🏠`
  },
  {
    name: 'broadcast_exclusive',
    title: 'Broadcast: Penawaran Eksklusif',
    category: 'promotion',
    content: `Halo {{customer_name}}! 🌟

*KHUSUS UNTUK ANDA!* 💎

Sebagai pelanggan setia, Anda mendapatkan penawaran EKSKLUSIF:

🎁 Diskon 20% untuk pembelian berikutnya
📦 Gratis Ongkir ke seluruh Indonesia
🎉 Bonus merchandise menarik

Gunakan kode: VIP2024
📅 Berlaku 7 hari

🌐 harkatfurniture.com

Terima kasih atas kepercayaan Anda! 🙏`
  }
]

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    qr: null,
    user: null
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    content: '',
    category: 'order'
  })
  
  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastFilter, setBroadcastFilter] = useState('with_orders')
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastStats, setBroadcastStats] = useState<{ orderCustomers: number; registeredUsers: number } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      // Add timestamp to prevent browser caching
      const res = await fetch(`/api/admin/whatsapp?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.log('WhatsApp service error:', error)
      setStatus({ status: 'disconnected', qr: null, user: null })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  const fetchBroadcastStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/broadcast')
      if (res.ok) {
        const data = await res.json()
        setBroadcastStats({ orderCustomers: data.orderCustomers, registeredUsers: data.registeredUsers })
      }
    } catch (error) {
      console.error('Failed to fetch broadcast stats:', error)
    }
  }, [])

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error('Pesan tidak boleh kosong')
      return
    }
    
    setBroadcastLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage, filter: broadcastFilter })
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success(`Broadcast selesai! ${data.sent} terkirim, ${data.failed} gagal`)
        setBroadcastMessage('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Broadcast gagal')
      }
    } catch (error) {
      toast.error('Error saat broadcast')
    } finally {
      setBroadcastLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchTemplates()
    fetchBroadcastStats()
    
    // Poll status every 3 seconds when not connected (to catch QR updates)
    const interval = setInterval(() => {
      if (status.status !== 'connected') {
        fetchStatus()
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [fetchStatus, fetchTemplates, fetchBroadcastStats, status.status])

  const handleConnect = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      })
      
      if (res.ok) {
        toast.success('Connection initiated. Scan the QR code.')
        setTimeout(fetchStatus, 2000)
      } else {
        toast.error('Failed to connect')
      }
    } catch (error) {
      toast.error('Connection error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      })
      
      if (res.ok) {
        toast.success('Disconnected from WhatsApp')
        fetchStatus()
      } else {
        toast.error('Failed to disconnect')
      }
    } catch (error) {
      toast.error('Disconnect error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Update
        const res = await fetch('/api/admin/whatsapp/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTemplate.id, ...templateForm })
        })
        if (res.ok) {
          toast.success('Template updated')
          fetchTemplates()
          setShowTemplateDialog(false)
          resetTemplateForm()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to update')
        }
      } else {
        // Create
        const res = await fetch('/api/admin/whatsapp/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateForm)
        })
        if (res.ok) {
          toast.success('Template created')
          fetchTemplates()
          setShowTemplateDialog(false)
          resetTemplateForm()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to create')
        }
      }
    } catch (error) {
      toast.error('Error saving template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Hapus template ini?')) return
    try {
      const res = await fetch(`/api/admin/whatsapp/templates?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Template deleted')
        fetchTemplates()
      } else {
        toast.error('Failed to delete')
      }
    } catch (error) {
      toast.error('Error deleting template')
    }
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      title: template.title,
      content: template.content,
      category: template.category
    })
    setShowTemplateDialog(true)
  }

  const handleCreateDefaultTemplates = async () => {
    let added = 0
    let skipped = 0
    
    for (const template of DEFAULT_TEMPLATES) {
      try {
        const res = await fetch('/api/admin/whatsapp/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        })
        if (res.ok) {
          added++
        } else {
          skipped++
        }
      } catch (e) {
        skipped++
      }
    }
    
    if (added > 0) {
      toast.success(`${added} template baru ditambahkan${skipped > 0 ? `, ${skipped} sudah ada` : ''}`)
    } else {
      toast.info('Semua template sudah ada')
    }
    fetchTemplates()
  }

  const resetTemplateForm = () => {
    setEditingTemplate(null)
    setTemplateForm({ name: '', title: '', content: '', category: 'order' })
  }

  const insertVariable = (variable: string) => {
    setTemplateForm(prev => ({
      ...prev,
      content: prev.content + variable
    }))
  }

  const getStatusBadge = () => {
    switch (status.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Terhubung</Badge>
      case 'scanning':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Scan QR...</Badge>
      case 'disconnected':
        return <Badge className="bg-stone-100 text-stone-600 border-stone-200"><XCircle className="w-3 h-3 mr-1" /> Belum Terhubung</Badge>
      case 'offline':
        return <Badge className="bg-red-50 text-red-600 border-red-200"><PowerOff className="w-3 h-3 mr-1" /> Bot Offline</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      order: 'bg-blue-50 text-blue-700 border-blue-200',
      shipping: 'bg-orange-50 text-orange-700 border-orange-200',
      promotion: 'bg-purple-50 text-purple-700 border-purple-200',
      general: 'bg-stone-100 text-stone-700 border-stone-200'
    }
    return <Badge variant="outline" className={`${colors[category] || colors.general} border capitalize`}>{category}</Badge>
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 bg-white px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-100 rounded-lg">
             <Smartphone className="w-5 h-5 text-stone-700" />
          </div>
          <div>
             <h1 className="text-lg font-bold text-stone-900">WhatsApp Gateway</h1>
             <p className="text-xs text-stone-500">Koneksi dan broadcast pesan WhatsApp</p>
          </div>
          <div className="h-6 w-px bg-stone-200 mx-2"></div>
          {getStatusBadge()}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchStatus(); fetchTemplates(); }} disabled={actionLoading} className="border-stone-200 text-stone-600 hover:bg-stone-50">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="connection" className="space-y-4">
          <TabsList className="bg-stone-100 p-1">
            <TabsTrigger value="connection" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">
              <Smartphone className="w-4 h-4 mr-2" />
              Koneksi
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4 mr-2" />
              Template Pesan
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">
              <Send className="w-4 h-4 mr-2" />
              Broadcast
            </TabsTrigger>
          </TabsList>

          {/* Connection Tab */}
          <TabsContent value="connection">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code / Connection Status Card */}
              <Card className="border-stone-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-stone-900 flex items-center">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Status Koneksi
                  </CardTitle>
                  <CardDescription>
                    Hubungkan WhatsApp Anda untuk mengirim notifikasi
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                  {status.status === 'connected' ? (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto border border-green-100">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-stone-900">Terhubung! ✅</p>
                        {status.user && (
                           <Badge variant="outline" className="mt-2 text-stone-600 font-normal">
                              {status.user.name || status.user.id}
                           </Badge>
                        )}
                      </div>
                      <Button variant="destructive" onClick={handleDisconnect} disabled={actionLoading} size="sm">
                        <PowerOff className="w-4 h-4 mr-2" />
                        Putuskan Koneksi
                      </Button>
                    </div>
                  ) : status.status === 'scanning' && status.qr ? (
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-white rounded-lg border-2 border-dashed border-stone-200 inline-block">
                        <QRCodeSVG value={status.qr} size={200} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-900">Scan QR Code dengan WhatsApp</p>
                        <p className="text-xs text-stone-500">
                           Settings → Linked Devices → Link a Device
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 py-1 px-3 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Menunggu scan...
                      </div>
                    </div>
                  ) : status.status === 'offline' ? (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
                        <PowerOff className="w-10 h-10 text-red-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-stone-900">Bot Offline</p>
                        <p className="text-sm text-stone-500">Service WhatsApp Bot tidak merespon</p>
                      </div>
                      <Button onClick={fetchStatus} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Coba Lagi
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-6 w-full">
                      <div className="relative w-full max-w-[280px] mx-auto">
                        <div className="p-1 bg-white rounded-xl border border-stone-200">
                           {/* Use iframe for remote QR */}
                          <iframe 
                            src={`${status.botUrl || 'https://harkat-whatsapp-bot-production.up.railway.app'}/qr`}
                            className="w-full aspect-square border-0 rounded-lg"
                            title="WhatsApp QR Code"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">Scan QR Code di atas</p>
                        <p className="text-xs text-stone-500 mt-1">
                          Buka WhatsApp → Linked Devices → Link a Device
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="border-stone-200 shadow-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-stone-900 flex items-center">
                     <Info className="w-4 h-4 mr-2" />
                     Informasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-900">Siapkan WhatsApp</p>
                        <p className="text-xs text-stone-500">Gunakan WhatsApp di HP Anda (Pribadi atau Bisnis) untuk menjadi pengirim pesan bot.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-900">Scan QR Code</p>
                        <p className="text-xs text-stone-500">QR Code akan muncul di sebelah kiri. Scan layaknya menghubungkan WhatsApp Web.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-900">Selesai!</p>
                        <p className="text-xs text-stone-500">Bot akan otomatis mengirim pesan notifikasi order sesuai template yang aktif.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                     <p className="text-xs font-medium text-stone-900 mb-2">Server Status:</p>
                     <div className="flex items-center gap-2 text-xs bg-stone-50 p-2 rounded border border-stone-200">
                        <div className={`w-2 h-2 rounded-full ${status.botUrl ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-stone-600 truncate">{status.botUrl || 'Service url not configured'}</span>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 py-3 px-4">
                <div>
                  <CardTitle className="text-base font-bold text-stone-900">Message Templates</CardTitle>
                  <CardDescription>Kelola template pesan otomatis</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCreateDefaultTemplates} className="h-8 text-xs border-stone-200">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Reset Default
                  </Button>
                  <Button size="sm" onClick={() => { resetTemplateForm(); setShowTemplateDialog(true); }} className="h-8 text-xs bg-stone-900 hover:bg-stone-800">
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Buat Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {templatesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Belum ada template pesan.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-stone-50">
                      <TableRow>
                        <TableHead className="w-[200px]">Nama Template</TableHead>
                        <TableHead className="w-[150px]">Kategori</TableHead>
                        <TableHead>Preview Konten</TableHead>
                        <TableHead className="w-[100px] text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id} className="hover:bg-stone-50 cursor-pointer" onClick={() => handleEditTemplate(template)}>
                          <TableCell className="font-medium text-stone-900">
                            {template.title}
                            <div className="text-xs text-stone-500 font-normal mt-0.5">{template.name}</div>
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(template.category)}
                          </TableCell>
                          <TableCell className="text-xs text-stone-600 max-w-[400px]">
                            <p className="truncate">{template.content.replace(/\n/g, ' ')}</p>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}>
                                <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-600" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-stone-200 shadow-sm">
                   <CardHeader>
                      <CardTitle className="text-base font-bold text-stone-900">Kirim Broadcast</CardTitle>
                      <CardDescription>Kirim pesan massal ke pelanggan</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="space-y-2">
                         <Label>Target Penerima</Label>
                         <Select value={broadcastFilter} onValueChange={setBroadcastFilter}>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="with_orders">Pelanggan dengan Order ({broadcastStats?.orderCustomers || 0})</SelectItem>
                             <SelectItem value="all">Semua Kontak Tersimpan</SelectItem>
                           </SelectContent>
                         </Select>
                      </div>
                      
                      <div className="space-y-2">
                         <Label>Pesan Broadcast</Label>
                         <Textarea 
                           placeholder="Tulis pesan broadcast di sini..."
                           rows={6}
                           value={broadcastMessage}
                           onChange={(e) => setBroadcastMessage(e.target.value)}
                           className="font-sans"
                         />
                         <p className="text-xs text-stone-500">
                           Tips: Gunakan *bold*, _italic_, atau ~strikethrough~ untuk format teks WhatsApp.
                         </p>
                      </div>

                      <div className="pt-2">
                        <Button onClick={handleBroadcast} disabled={broadcastLoading || !broadcastMessage} className="bg-stone-900 hover:bg-stone-800">
                           {broadcastLoading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
                           ) : (
                              <><Send className="w-4 h-4 mr-2" /> Kirim Broadcast Sekarang</>
                           )}
                        </Button>
                      </div>
                   </CardContent>
                </Card>

                <div className="space-y-4">
                   <Card className="border-stone-200 shadow-sm bg-stone-50">
                      <CardHeader className="pb-2">
                         <CardTitle className="text-sm font-bold text-stone-900 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Estimasi Penerima
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="text-2xl font-bold text-stone-900">
                            {broadcastFilter === 'with_orders' ? (broadcastStats?.orderCustomers || 0) : '0'}
                         </div>
                         <p className="text-xs text-stone-500 mt-1">
                            {broadcastFilter === 'with_orders' ? 'Pelanggan yang pernah melakukan order' : 'Total kontak di database'}
                         </p>
                      </CardContent>
                   </Card>

                   <Card className="border-stone-200 shadow-sm">
                      <CardHeader className="pb-2">
                         <CardTitle className="text-sm font-bold text-stone-900">Panduan Broadcast</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-stone-600 space-y-2">
                         <p>• Pastikan pesan relevan dan tidak mengandung spam.</p>
                         <p>• Jeda pengiriman otomatis diatur agar aman dari blokir.</p>
                         <p>• Gunakan bahasa yang sopan dan personal.</p>
                      </CardContent>
                   </Card>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Buat Template Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label>Nama Template (Internal)</Label>
                  <Input 
                     placeholder="e.g. order_confirmation" 
                     value={templateForm.name} 
                     onChange={e => setTemplateForm({...templateForm, name: e.target.value})} 
                  />
               </div>
               <div className="space-y-2">
                  <Label>Judul (Untuk Admin)</Label>
                  <Input 
                     placeholder="e.g. Konfirmasi Order" 
                     value={templateForm.title} 
                     onChange={e => setTemplateForm({...templateForm, title: e.target.value})} 
                  />
               </div>
               <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select 
                     value={templateForm.category} 
                     onValueChange={v => setTemplateForm({...templateForm, category: v})}
                  >
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="shipping">Shipping</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label>Konten Pesan</Label>
                  <Textarea 
                     className="h-[200px] font-mono text-sm"
                     placeholder="Halo {{customer_name}}..." 
                     value={templateForm.content} 
                     onChange={e => setTemplateForm({...templateForm, content: e.target.value})} 
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs">Variabel Tersedia:</Label>
                  <div className="flex flex-wrap gap-2">
                     {TEMPLATE_VARIABLES.map(v => (
                        <Badge 
                           key={v.name} 
                           variant="secondary" 
                           className="cursor-pointer hover:bg-stone-200 text-[10px]"
                           onClick={() => insertVariable(v.name)}
                           title={v.description}
                        >
                           {v.name}
                        </Badge>
                     ))}
                  </div>
               </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Batal</Button>
            <Button onClick={handleSaveTemplate} className="bg-stone-900 hover:bg-stone-800">Simpan Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
