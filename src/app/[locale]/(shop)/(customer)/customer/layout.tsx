'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  User, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Home,
  LayoutDashboard,
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navigation = [
    { name: 'Dashboard', href: '/customer', icon: LayoutDashboard },
    { name: 'My Orders', href: '/customer/orders', icon: ShoppingBag },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart },
    { name: 'Profile', href: '/customer/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-stone-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-wide text-[#0058A3]">
            Harkat Furniture<span className="text-[#FFDB00]">.</span>
          </Link>
          <div className="flex items-center space-x-4">
             <span className="text-sm text-stone-500">
                Welcome, <span className="font-medium text-stone-900">{session?.user?.name || 'Customer'}</span>
             </span>
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-stone-400 hover:text-red-600 hover:bg-red-50"
             >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
             </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Sidebar Navigation */}
            <aside className="md:col-span-1 space-y-6">
                <div className="bg-white rounded-xl border border-stone-100 p-3 shadow-sm">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link key={item.name} href={item.href}>
                                <Button 
                                    variant={isActive ? 'secondary' : 'ghost'} 
                                    className={`w-full justify-start mb-1 h-10 ${
                                        isActive 
                                        ? 'bg-stone-900 text-white font-medium shadow-sm hover:bg-stone-800' 
                                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 mr-3" />
                                    {item.name}
                                </Button>
                            </Link>
                        )
                    })}
                </div>
                
                <div className="bg-stone-100 rounded-xl p-5 border border-stone-200">
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">Need Assistance?</h4>
                    <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                        Have questions about your order or need to reschedule delivery?
                    </p>
                    <Link href="https://wa.me/6281234567890" target="_blank">
                        <Button size="sm" className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs rounded-lg h-9">
                            Contact Support
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:col-span-3">
                {children}
            </main>
        </div>
      </div>
    </div>
  )
}
