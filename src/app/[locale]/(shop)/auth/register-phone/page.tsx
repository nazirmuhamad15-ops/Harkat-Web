'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, ArrowLeft, MessageCircle, User, Mail } from 'lucide-react'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function RegisterPhone() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(60)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/otp/register-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim OTP')
        return
      }

      setStep('otp')
      startCountdown()
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (otp.length !== 6) {
      setError('Masukkan 6 digit kode OTP')
      setLoading(false)
      return
    }

    try {
      // Use existing phone-otp provider
      // It will now activate the user if inactive
      const result = await signIn('phone-otp', {
        phone,
        otp,
        redirect: false,
      })

      if (result?.error) {
        setError('Kode OTP tidak valid atau sudah expired')
        setLoading(false)
        return
      }

      // Get session to redirect
      const session = await getSession()
      
      if (session?.user?.role === 'DRIVER') {
        router.push('/driver')
      } else if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
        router.push('/admin')
      } else {
        router.push('/customer')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const resendOTP = async () => {
    if (countdown > 0) return
    
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/otp/register-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      })

      const data = await res.json()

      if (res.ok) {
        startCountdown()
        setOtp('')
      } else {
        setError(data.error || 'Gagal mengirim ulang OTP')
      }
    } catch (error) {
      setError('Gagal mengirim ulang')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-stone-50 to-stone-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle>Daftar dengan WhatsApp</CardTitle>
          <CardDescription>
            {step === 'form' 
              ? 'Lengkapi data diri Anda untuk mendaftar' 
              : `Masukkan kode OTP yang dikirim ke WhatsApp`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'form' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP (WhatsApp)</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-100 border rounded-md text-gray-600 text-sm">
                    +62
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="8123456789"
                    className="flex-1"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Pastikan nomor terhubung dengan WhatsApp
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || !phone || !name || !email}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Kirim OTP via WhatsApp
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-sm text-gray-500">
                  Kode dikirim ke <span className="font-medium">+62{phone}</span>
                </p>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi & Masuk'
                )}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-gray-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim ulang OTP'}
                </button>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => { setStep('form'); setOtp(''); setError('') }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ubah Data
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">atau</span>
            </div>
          </div>
          <Link href="/auth/signin" className="w-full">
            <Button variant="outline" className="w-full">
              Masuk dengan Akun Ada
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => signIn('google', { callbackUrl: '/customer' })}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Daftar dengan Google
          </Button>

          <div className="text-center text-sm text-gray-600">
             <Link href="/auth/signup" className="text-stone-900 font-medium hover:underline">
              Daftar dengan Email
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
