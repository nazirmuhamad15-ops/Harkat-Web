'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { DriverSidebar } from '@/components/driver/app-sidebar'
import { LocationTracker } from '@/components/driver/location-tracker'

import { BottomNav } from '@/components/driver/bottom-nav'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 mb-4"></div>
          <p className="text-stone-600 font-medium font-serif">Memuat Portal Driver...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    redirect('/auth/signin')
  }

  return (
    <SidebarProvider>
      <LocationTracker />
      <DriverSidebar user={session.user} />
      <SidebarInset>
         <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:hidden bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <span className="font-bold">Driver App</span>
         </header>
         <main className="flex-1 overflow-y-auto p-4 lg:p-8 w-full max-w-5xl mx-auto pb-24 lg:pb-8">
            {children}
         </main>
         <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}