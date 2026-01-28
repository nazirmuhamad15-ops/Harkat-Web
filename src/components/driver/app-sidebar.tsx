"use client"

import * as React from "react"
import {
  LogOut,
  Truck
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DRIVER_NAVIGATION } from "./nav-items"

export function DriverSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props} className="border-r-0">
      <SidebarHeader>
        <div className="flex bg-sidebar h-16 items-center px-4 border-b border-sidebar-border group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 gap-3">
             <div className="bg-white p-1.5 rounded-lg shrink-0">
                <Truck className="w-5 h-5 text-stone-950" />
            </div>
             <span className="font-sans font-bold text-lg group-data-[collapsible=icon]:hidden">Driver<span className="text-stone-400">.</span>Portal</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Driver Navigation Group */}
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                {DRIVER_NAVIGATION.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild tooltip={item.name} isActive={isActive} size="lg">
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 bg-sidebar-accent/30 rounded-xl m-2 group-data-[collapsible=icon]:p-2">
             <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-9 w-9 border border-stone-700 shrink-0">
                    <AvatarFallback className="bg-stone-800 text-white">{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-bold truncate">{user?.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Driver</span>
                </div>
             </div>
             <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 group-data-[collapsible=icon]:hidden hover:bg-red-50 hover:text-red-600"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
             >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
             </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
