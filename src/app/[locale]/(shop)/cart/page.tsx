'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import CouponInput from '@/components/shop/coupon-input'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

export default function CartPage() {
  const router = useRouter()
  const cart = useCart()
  const totals = cart.getTotals()
  
  // Handlers
  const handleQuantityChange = (id: string, newQty: number) => {
    if (newQty < 1) return
    cart.updateQuantity(id, newQty)
  }

  const handleDelete = (id: string) => {
    cart.removeItem(id)
    toast.success('Item removed')
  }

  const handleCheckout = () => {
    if (totals.subtotal > 0) {
        router.push('/checkout')
    } else {
        toast.error('Please select items to checkout')
    }
  }

  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p)

  if (cart.items.length === 0) {
      return (
          <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 max-w-md w-full">
                  <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">Keranjang Anda Kosong</h2>
                  <p className="text-stone-500 mb-8">Sepertinya Anda belum menambahkan produk apapun. Mari temukan furnitur impian Anda.</p>
                  <Link href="/products">
                    <Button className="w-full h-12 rounded-full bg-stone-900 text-white hover:bg-stone-800">
                        Mulai Belanja
                    </Button>
                  </Link>
              </div>
          </div>
      )
  }

  const allSelected = cart.items.length > 0 && cart.items.every(i => i.selected)

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-20">
        <header className="bg-white border-b border-stone-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl text-[#0058A3]">Harkat Furniture<span className="text-[#FFDB00]">.</span></Link>
                <Link href="/catalog">
                    <Button variant="ghost" size="sm" className="text-stone-600">Lanjut Belanja</Button>
                </Link>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart ({cart.items.length})</h1>
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items List */}
                <div className="flex-1 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-stone-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                id="select-all" 
                                checked={allSelected}
                                onCheckedChange={(checked) => cart.toggleAll(checked as boolean)}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer select-none">Pilih Semua</label>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => cart.clearCart()}
                        >
                            Hapus Semua
                        </Button>
                    </div>

                    {cart.items.map((item) => (
                        <div key={item.id} className={`bg-white p-4 rounded-xl border transition-colors ${item.selected ? 'border-stone-900 shadow-sm' : 'border-stone-100 opacity-75'}`}>
                            <div className="flex gap-4">
                                <div className="flex items-start pt-2">
                                    <Checkbox 
                                        checked={item.selected}
                                        onCheckedChange={() => cart.toggleItem(item.id)}
                                        aria-label={`Select ${item.name}`}
                                    />
                                </div>
                                
                                {/* Image */}
                                <div className="relative w-24 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-stone-900">{item.name}</h3>
                                            <div className="text-right">
                                                <p className="font-bold text-stone-900">{formatPrice(item.price * item.quantity)}</p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs text-stone-500">{formatPrice(item.price)} / pc</p>
                                                )}
                                            </div>
                                        </div>
                                        {item.sku && <p className="text-xs text-stone-400 mt-1">SKU: {item.sku}</p>}
                                    </div>

                                    <div className="flex justify-between items-end mt-4">
                                        <div className="flex items-center bg-stone-100 rounded-full h-8 px-1" role="group" aria-label="Quantity controls">
                                            <button 
                                                className="w-7 h-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                aria-label={`Decrease quantity of ${item.name}`}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
                                            <button 
                                                className="w-7 h-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                aria-label={`Increase quantity of ${item.name}`}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-red-500" aria-label={`Remove ${item.name} from cart`}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Apakah Anda yakin ingin menghapus <strong>{item.name}</strong> dari keranjang?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                {/* Summary Sidebar */}
                <div className="lg:w-96 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm sticky top-24">
                        <h2 className="font-bold text-xl mb-6">Ringkasan Pesanan</h2>
                        
                        <div className="mb-6">
                             <CouponInput />
                        </div>

                        <Separator className="mb-6" />

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-stone-600">
                                <span>Total Item</span>
                                <span>{cart.items.filter(i => i.selected).reduce((acc, i) => acc + i.quantity, 0)} pcs</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                                <span>Total Berat</span>
                                <span>{totals.finalDetailWeight.toFixed(1)} kg</span>
                            </div>
                            
                            {totals.discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Diskon</span>
                                    <span>- {formatPrice(totals.discountAmount)}</span>
                                </div>
                            )}

                            <Separator />
                            <div className="flex justify-between font-bold text-lg text-stone-900">
                                <span>Total Belanja</span>
                                <span>{formatPrice(totals.total)}</span>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-14 text-lg rounded-full bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
                            onClick={handleCheckout}
                            disabled={totals.subtotal === 0}
                        >
                            Checkout ({cart.items.filter(i => i.selected).length})
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        
                        {totals.isHeavyCargo && (
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mt-4">
                                <span className="font-bold block mb-1">Heavy Cargo</span>
                                Pesanan ini termasuk kargo berat (&gt;50kg) dan akan dikirim menggunakan armada Harkat Logistics.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    </div>
  )
}
