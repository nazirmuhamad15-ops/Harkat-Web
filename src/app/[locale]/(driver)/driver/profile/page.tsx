'use client'

import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Mail, Shield, ShieldCheck, Key, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function DriverProfilePage() {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
     currentPassword: '',
     newPassword: ''
  })

  if (!session) return null

  const user = session.user

  const handleUpdatePassword = () => {
      toast.info('Fitur perubahan kata sandi sedang dalam pemeliharaan')
      setFormData({ currentPassword: '', newPassword: '' })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section is already in layout, but we can add a page specific indicator if needed */}
      <div className="relative">
        <h1 className="text-3xl font-serif font-black text-stone-900 tracking-tight">
          Profil Saya
        </h1>
        <p className="text-stone-500 text-sm mt-1 font-medium"> Kelola akun dan keamanan Anda. </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card Premium */}
        <Card className="rounded-[2.5rem] border-0 bg-stone-900 text-white overflow-hidden shadow-2xl shadow-stone-200/50">
            <CardContent className="p-8">
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
                    <div className="relative group">
                        <Avatar className="w-28 h-28 border-4 border-white/10 shadow-2xl transition-transform group-hover:scale-105">
                            <AvatarImage src={user.image || ''} />
                            <AvatarFallback className="text-3xl bg-white text-stone-900 font-serif font-black">
                                {user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-stone-900 p-1.5 rounded-full shadow-lg">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-serif font-black tracking-tight">{user.name}</h2>
                            <p className="text-stone-400 font-medium">{user.email}</p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            <div className="px-4 py-1.5 bg-white/10 rounded-xl border border-white/5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-100">Aktif</span>
                            </div>
                            <div className="px-4 py-1.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                                <User className="w-3 h-3 text-stone-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Driver</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex justify-between items-center group">
                 <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Akses Portal Driver</span>
                 <ShieldCheck className="w-4 h-4 text-stone-700 group-hover:text-emerald-500 transition-colors" />
            </div>
        </Card>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-stone-100 shadow-sm bg-white border-0">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center">
                        <Mail className="w-3 h-3 mr-2 text-stone-400" />
                        Detail Akun
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="p-4 bg-stone-50 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Email Utama</p>
                            <p className="text-sm font-bold text-stone-900">{user.email}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Identitas Driver</p>
                            <p className="text-sm font-bold text-stone-900">Driver #{user.id?.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-stone-100 shadow-sm bg-white border-0">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center">
                        <Shield className="w-3 h-3 mr-2 text-stone-400" />
                        Keamanan & Sandi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-stone-400 tracking-widest uppercase pl-1">Kata Sandi Baru</Label>
                        <div className="relative">
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="h-12 rounded-2xl border-stone-100 bg-stone-50 focus:bg-white transition-all pl-10"
                                value={formData.newPassword}
                                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                            />
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        </div>
                    </div>
                    <Button 
                        className="w-full h-12 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-lg shadow-stone-100 active:scale-95 transition-all"
                        onClick={handleUpdatePassword}
                    >
                        Ganti Sandi
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
            <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
                <LogOut className="w-5 h-5" />
                <span>Keluar dari Akun</span>
            </Button>
            <p className="text-center mt-6 text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">
                Hasan Furniture • Driver App v1.2
            </p>
        </div>
      </div>
    </div>
  )
}
