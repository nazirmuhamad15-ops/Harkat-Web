'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  if (success === 'true') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Email Terverifikasi!</h2>
            <p className="text-gray-500">Akun Anda sudah aktif. Silakan login untuk melanjutkan.</p>
            <Link href="/auth/signin">
              <Button className="w-full">Masuk Sekarang</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    let errorMessage = 'Terjadi kesalahan saat verifikasi.'
    if (error === 'missing_token') {
      errorMessage = 'Link verifikasi tidak valid.'
    } else if (error === 'invalid_token') {
      errorMessage = 'Link verifikasi sudah expired atau tidak valid. Silakan daftar ulang.'
    }

    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Verifikasi Gagal</h2>
            <p className="text-gray-500">{errorMessage}</p>
            <div className="space-y-2">
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full">Daftar Ulang</Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full">Kembali ke Login</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default: Waiting for verification (after signup)
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle>Cek Email Anda</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-500">
          Kami telah mengirimkan link verifikasi ke email Anda. 
          Silakan cek inbox (dan folder spam) untuk memverifikasi akun.
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Link verifikasi akan expired dalam 24 jam.
          </p>
        </div>
        <Link href="/auth/signin">
          <Button variant="ghost" className="w-full mt-4">
            Kembali ke Login
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-stone-50 to-stone-100 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500">Loading...</p>
            </div>
          </CardContent>
        </Card>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
