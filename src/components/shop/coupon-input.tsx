'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag, Loader2, X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

export default function CouponInput() {
    const cart = useCart()
    const totals = cart.getTotals()
    
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleApply = async () => {
        if (!code) return
        setLoading(true)
        try {
            const res = await fetch('/api/public/coupons/check', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    code,
                    cartTotal: totals.subtotal
                })
            })
            const data = await res.json()

            if (res.ok && data.valid) {
                 cart.applyCoupon(data.couponCode, data.discountAmount)
                 toast.success('Kupon berhasil digunakan!')
                 setCode('')
            } else {
                 toast.error(data.error || 'Kode kupon tidak valid')
            }

        } catch (error) {
            toast.error('Gagal memverifikasi kupon')
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = () => {
        cart.removeCoupon()
        toast.info('Kupon dihapus')
    }

    if (cart.couponCode) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <div>
                        <p className="font-bold text-sm text-green-800">{cart.couponCode}</p>
                        <p className="text-xs text-green-600">Hemat Rp {cart.discountAmount.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-700 hover:text-red-600 hover:bg-red-50" onClick={handleRemove}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-900">Punya kode promo?</Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <Input 
                        placeholder="Masukkan kode voucher" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="pl-9 bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                </div>
                <Button 
                    variant="outline" 
                    className="border-stone-900 text-stone-900 hover:bg-stone-50"
                    onClick={handleApply}
                    disabled={!code || loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gunakan'}
                </Button>
            </div>
        </div>
    )
}
