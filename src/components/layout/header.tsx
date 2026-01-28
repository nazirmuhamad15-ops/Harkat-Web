"use client"

import { useState, useEffect } from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShoppingCart, Search, Menu, User, LayoutDashboard, LogOut, Package } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageSwitcher } from '../language-switcher'

export function Header() {
  const { data: session } = useSession()
  const cart = useCart()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('Navbar')
  const locale = useLocale()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getDashboardLink = () => {
    if (session?.user?.role === 'DRIVER') return '/driver'
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') return '/admin'
    return '/customer'
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        {/* Hamburger Menu & Logo */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-black hover:bg-gray-100 rounded-full h-10 w-10"
                aria-label="Toggle Menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="text-left font-bold text-[#0058A3] text-xl">Menu</SheetTitle>
              </SheetHeader>
              <div className="py-4 flex flex-col h-full">
                <nav className="flex flex-col gap-1">
                  <Link href="/" className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">{t('home')}</Link>
                  <Link href="/products" className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">{t('products')}</Link>
                  <Link href="/categories" className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">{t('categories')}</Link>
                  <Link href="/inspiration" className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">{t('inspiration')}</Link>
                  <Link href="/track" className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">{t('trackOrder')}</Link>
                  <div className="h-px bg-gray-200 my-2" />
                  <Link href="/about" className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">{t('about')}</Link>
                  {!session?.user ? (
                    <Link href="/auth/signin" className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">{t('login')}</Link>
                  ) : (
                    <>
                      <Link href={getDashboardLink()} className="px-4 py-3 hover:bg-gray-100 rounded-md text-base font-bold text-gray-800">
                        {t('dashboard')} ({session.user.name?.split(' ')[0]})
                      </Link>
                      <div 
                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        className="px-4 py-3 hover:bg-red-50 hover:text-red-600 rounded-md cursor-pointer text-base font-bold text-gray-800 transition-colors"
                      >
                         {t('logout')}
                      </div>
                    </>
                  )}
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-100 rounded-md cursor-pointer text-base font-bold text-gray-800">
                     <span>{t('language')}</span>
                     <div className="flex gap-2 text-sm font-normal">
                         <Link href={pathname} locale="id" className={`${locale === 'id' ? 'text-black font-bold' : 'text-gray-500'}`}>Indonesia</Link>
                         <span className="text-gray-300">|</span>
                         <Link href={pathname} locale="en" className={`${locale === 'en' ? 'text-black font-bold' : 'text-gray-500'}`}>English</Link>
                     </div>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="shrink-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-[#0058A3] flex items-center gap-1">
              Harkat Furniture<span className="text-[#FFDB00] text-4xl leading-none">.</span>
            </h1>
          </Link>
        </div>

        {/* Search Bar - Center (IKEA Style) */}
        <div className="hidden md:flex flex-1 max-w-2xl relative">
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            className="w-full h-12 pl-12 pr-4 bg-gray-100 hover:bg-gray-200 focus:bg-white border-none rounded-full transition-colors text-base text-gray-900 placeholder:text-gray-500 outline-none ring-2 ring-transparent focus:ring-[#0058A3]"
            aria-label="Search"
          />
          <button 
            type="submit"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-transparent hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Submit search"
          >
            <Search className="text-gray-500 w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Desktop Lang Switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Mobile Search Trigger */}
          <Button variant="ghost" size="icon" className="md:hidden text-black hover:bg-gray-100 rounded-full" aria-label="Open Search">
            <Search className="w-6 h-6" />
          </Button>
          
          {/* Cart */}
          <Link 
            href="/cart" 
            className="relative text-black hover:bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center transition-colors" 
            aria-label={`Shopping Cart ${mounted && cart.items.length > 0 ? `(${cart.items.length})` : ''}`}
          >
            <ShoppingCart className="w-6 h-6" />
            {mounted && cart.items.length > 0 && (
              <span className="absolute top-1 right-0 h-4 w-4 rounded-full bg-[#0058A3] text-white text-[10px] flex items-center justify-center font-bold">
                {cart.items.length}
              </span>
            )}
          </Link>

          {/* Auth / Profile */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full border-none hover:bg-gray-100"
                  aria-label="Toggle profile menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                    <AvatarFallback className="bg-[#FFDB00] text-[#0058A3] flex items-center justify-center font-bold text-xs">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={getDashboardLink()}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/customer/orders">
                    <Package className="w-4 h-4 mr-2" />
                    {t('myOrders')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link 
              href="/auth/signin" 
              className="text-black hover:bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center transition-colors" 
              aria-label="User Account"
            >
              <User className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
