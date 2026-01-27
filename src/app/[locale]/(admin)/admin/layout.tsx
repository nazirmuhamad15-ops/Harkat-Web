'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { CsrfProvider } from '@/components/providers/csrf-provider'
import { Separator } from '@/components/ui/separator'
import { CommandPalette } from '@/components/admin/command-palette'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
      return <div className="flex h-screen w-full items-center justify-center text-sm text-gray-500">Loading admin session...</div>
  }

  if (status === 'unauthenticated' || !session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        {/* <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-stone-50/50 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
             <CommandPalette />
          </div>
        </header> */}
        <div className="h-screen overflow-hidden">
             <CsrfProvider>
                {children}
             </CsrfProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}