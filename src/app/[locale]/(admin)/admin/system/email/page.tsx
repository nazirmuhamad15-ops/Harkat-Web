'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Mail, Server, Webhook, Save, RefreshCw, Send, CheckCircle, 
  XCircle, Loader2, AlertTriangle, ShieldCheck, Database, Cloud,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailSettings {
  requireVerification: boolean
  provider: 'smtp' | 'webhook'
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPassword: string
  smtpFrom: string
  webhookUrl: string
  webhookSecret: string
}

export default function EmailSettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<EmailSettings>({
    requireVerification: false,
    provider: 'smtp',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    webhookUrl: '',
    webhookSecret: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [usingEnvFallback, setUsingEnvFallback] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/settings/email')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
        setUsingEnvFallback(data.usingEnvFallback || false)
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!isSuperAdmin) {
      toast.error('Hanya Super Admin yang dapat mengubah konfigurasi')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Konfigurasi email berhasil disimpan')
        setUsingEnvFallback(false) // Setelah save, tidak lagi pakai env fallback
      } else {
        toast.error(data.error || 'Gagal menyimpan konfigurasi')
      }
    } catch (error) {
      toast.error('Error menyimpan konfigurasi')
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Masukkan alamat email untuk test')
      return
    }

    setTesting(true)
    try {
      const res = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      })

      if (res.ok) {
        toast.success('Test email berhasil dikirim! Cek inbox Anda.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengirim test email')
      }
    } catch (error) {
      toast.error('Error mengirim test email')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-500">Memuat konfigurasi email...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 bg-white px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-100 rounded-lg">
             <Mail className="w-5 h-5 text-stone-700" />
          </div>
          <div>
             <h1 className="text-lg font-bold text-stone-900">Pengaturan Email</h1>
             <div className="flex items-center gap-2">
                <p className="text-xs text-stone-500">SMTP & Notifikasi</p>
                <div className="h-3 w-px bg-stone-300 mx-1"></div>
                {connectionStatus === 'connected' ? (
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 h-5 px-1.5">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Terhubung
                  </Badge>
                ) : connectionStatus === 'error' ? (
                  <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50 h-5 px-1.5">
                    <XCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                ) : null}
                {usingEnvFallback && (
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 h-5 px-1.5">
                    <Cloud className="w-3 h-3 mr-1" />
                    ENV File
                  </Badge>
                )}
             </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings} className="border-stone-200 text-stone-600 hover:bg-stone-50">
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          {isSuperAdmin ? (
            <Button size="sm" onClick={saveSettings} disabled={saving} className="bg-stone-900 hover:bg-stone-800">
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              Simpan Konfigurasi
            </Button>
          ) : (
            <Button size="sm" disabled variant="secondary" className="bg-stone-100 text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              Hanya Super Admin
            </Button>
          )}
        </div>
      </div>

      {/* Warning for non-super admin */}
      {!isSuperAdmin && (
        <div className="mx-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Akses Terbatas</p>
            <p className="text-sm text-amber-700">
              Anda dapat melihat konfigurasi email, tetapi hanya Super Admin yang dapat mengubah pengaturan ini.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
               {/* SMTP Settings */}
               {settings.provider === 'smtp' && (
               <Card className="border-stone-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-stone-100">
                     <CardTitle className="text-base font-bold text-stone-900 flex items-center">
                     <Server className="w-4 h-4 mr-2" />
                     Konfigurasi SMTP
                     </CardTitle>
                     <CardDescription>
                     Konfigurasi SMTP server untuk mengirim email (Gmail, Mailgun, dll)
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>SMTP Host <span className="text-red-500">*</span></Label>
                        <Input
                           placeholder="smtp.gmail.com"
                           value={settings.smtpHost}
                           onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input
                           placeholder="587"
                           value={settings.smtpPort}
                           onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Username / Email <span className="text-red-500">*</span></Label>
                        <Input
                           placeholder="your-email@gmail.com"
                           value={settings.smtpUser}
                           onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Password / App Password</Label>
                        <Input
                           type="password"
                           placeholder="••••••••"
                           value={settings.smtpPassword}
                           onChange={(e) => setSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label>From Email</Label>
                        <Input
                           placeholder="noreply@harkatfurniture.com"
                           value={settings.smtpFrom}
                           onChange={(e) => setSettings(prev => ({ ...prev, smtpFrom: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                        <p className="text-xs text-stone-500">
                           Alamat email yang akan muncul sebagai pengirim
                        </p>
                     </div>
                     </div>

                     <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-stone-600" />
                        <p className="text-sm font-bold text-stone-700">Contoh Konfigurasi Gmail</p>
                     </div>
                     <ul className="text-sm text-stone-600 space-y-1 ml-6 list-disc">
                        <li>Host: <code className="bg-stone-100 px-1 py-0.5 rounded text-xs">smtp.gmail.com</code></li>
                        <li>Port: <code className="bg-stone-100 px-1 py-0.5 rounded text-xs">587</code></li>
                        <li>Password: Gunakan <strong>App Password</strong> (bukan password login biasa)</li>
                     </ul>
                     </div>
                  </CardContent>
               </Card>
               )}

               {/* Webhook Settings */}
               {settings.provider === 'webhook' && (
               <Card className="border-stone-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-stone-100">
                     <CardTitle className="text-base font-bold text-stone-900 flex items-center">
                     <Webhook className="w-4 h-4 mr-2" />
                     Konfigurasi Webhook
                     </CardTitle>
                     <CardDescription>
                     Kirim email via webhook API (Resend, SendGrid, Mailgun)
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                     <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-2">
                        <Label>Webhook URL <span className="text-red-500">*</span></Label>
                        <Input
                           placeholder="https://api.resend.com/emails"
                           value={settings.webhookUrl}
                           onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                        <p className="text-xs text-stone-500">
                           POST request akan dikirim dengan data email
                        </p>
                     </div>
                     <div className="space-y-2">
                        <Label>API Key / Secret</Label>
                        <Input
                           type="password"
                           placeholder="re_xxxxxxxxxxxx"
                           value={settings.webhookSecret}
                           onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                        <p className="text-xs text-stone-500">
                           Akan dikirim sebagai Bearer token di header Authorization
                        </p>
                     </div>
                     <div className="space-y-2">
                        <Label>From Email</Label>
                        <Input
                           placeholder="admin@harkatfurniture.web.id"
                           value={settings.smtpFrom}
                           onChange={(e) => setSettings(prev => ({ ...prev, smtpFrom: e.target.value }))}
                           disabled={!isSuperAdmin}
                           className="border-stone-200"
                        />
                     </div>
                     </div>

                     <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                     <p className="text-sm text-purple-800 font-medium mb-2">💡 Layanan yang Direkomendasikan:</p>
                     <ul className="text-sm text-purple-700 space-y-1">
                        <li><strong>Resend</strong>: Gratis 100 email/hari - resend.com</li>
                        <li><strong>SendGrid</strong>: Gratis 100 email/hari - sendgrid.com</li>
                     </ul>
                     </div>
                  </CardContent>
               </Card>
               )}
           </div>

           <div className="space-y-6">
               {/* Email Verification Setting */}
               <Card className="border-stone-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-stone-100">
                  <CardTitle className="text-base font-bold text-stone-900 flex items-center">
                     <Mail className="w-4 h-4 mr-2" />
                     Verifikasi
                  </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <Label>Verifikasi Email</Label>
                        <p className="text-xs text-stone-500">
                        Wajibkan user verifikasi email saat daftar
                        </p>
                     </div>
                     <Switch
                        checked={settings.requireVerification}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireVerification: checked }))}
                        disabled={!isSuperAdmin}
                     />
                  </div>

                  {settings.requireVerification && (
                     <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        Pastikan provider email aktif agar user bisa menerima kode/link verifikasi.
                     </div>
                  )}
                  </CardContent>
               </Card>

               {/* Email Provider Selection */}
               <Card className="border-stone-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-stone-100">
                  <CardTitle className="text-base font-bold text-stone-900 flex items-center">
                     <Server className="w-4 h-4 mr-2" />
                     Tipe Provider
                  </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                     <Label>Pilih Provider</Label>
                     <Select 
                        value={settings.provider} 
                        onValueChange={(v: 'smtp' | 'webhook') => setSettings(prev => ({ ...prev, provider: v }))}
                        disabled={!isSuperAdmin}
                     >
                        <SelectTrigger className="border-stone-200">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="smtp">
                           <div className="flex items-center">
                              <Server className="w-4 h-4 mr-2" />
                              SMTP Server
                           </div>
                        </SelectItem>
                        <SelectItem value="webhook">
                           <div className="flex items-center">
                              <Webhook className="w-4 h-4 mr-2" />
                              Webhook API
                           </div>
                        </SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {usingEnvFallback && (
                     <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        <Cloud className="w-3 h-3 inline mr-1" />
                        Menggunakan konfigurasi dari .env file. Simpan untuk override.
                     </div>
                  )}
                  </CardContent>
               </Card>

               {/* Test Email */}
               <Card className="border-stone-200 shadow-sm bg-stone-50">
                  <CardHeader className="pb-3 border-b border-stone-100">
                  <CardTitle className="text-base font-bold text-stone-900 flex items-center">
                     <Send className="w-4 h-4 mr-2" />
                     Test Koneksi
                  </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                     <Label>Kirim Test Email</Label>
                     <Input
                        placeholder="email@anda.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="bg-white border-stone-200"
                     />
                  </div>
                  <Button onClick={sendTestEmail} disabled={testing} className="w-full bg-stone-900 hover:bg-stone-800">
                     {testing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
                     ) : (
                        <><Send className="w-4 h-4 mr-2" /> Kirim Test</>
                     )}
                  </Button>
                  </CardContent>
               </Card>
           </div>
        </div>
      </div>
    </div>
  )
}
