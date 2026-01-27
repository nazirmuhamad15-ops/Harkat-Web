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
import { Loader2, Phone, ArrowLeft, MessageCircle } from 'lucide-react'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function PhoneLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
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
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
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
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle>Login dengan WhatsApp</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Masukkan nomor HP yang terdaftar' 
              : `Masukkan kode OTP yang dikirim ke WhatsApp`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP</Label>
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
                  Contoh: 08123456789 atau 8123456789
                </p>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading || !phone}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim OTP...
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
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ganti nomor HP
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
              Masuk dengan Email
            </Button>
          </Link>
          <div className="text-center text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/auth/signup" className="text-stone-900 font-medium hover:underline">
              Daftar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
