"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Tag
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string | null
    email: string | null
    role: string | null
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const userRole = user?.role
  const t = useTranslations('Sidebar')
  const tCommon = useTranslations('Common')

  // Redefine inside component to use t()
  const navGroups = [
    {
      label: "Platform",
      items: [
        {
          name: t('dashboard'),
          href: '/admin/dashboard',
          icon: LayoutDashboard,
        },
      ]
    },
    {
      label: t('catalog'),
      items: [
         {
          name: t('catalog'), // Or 'Products' group
          icon: Package,
          items: [
            { name: t('products'), href: '/admin/catalog/products' },
            { name: t('categories'), href: '/admin/catalog/categories' },
            { name: 'Stock', href: '/admin/catalog/stock' }, // Missing trans keys for some, fallback to string
            { name: 'Scraper', href: '/admin/scraper' },
            { name: 'Banners', href: '/admin/catalog/banners' },
          ]
         }
      ]
    },
    {
      label: t('sales'),
      items: [
        {
          name: 'Sales',
          icon: ShoppingCart,
          items: [
            { name: t('orders'), href: '/admin/sales/orders' },
            { name: 'Order History', href: '/admin/sales/history' },
            { name: t('finance'), href: '/admin/sales/dashboard' },
          ]
        }
      ]
    },
    {
      label: t('marketing'),
      items: [
        {
          name: t('promotions'),
          icon: Tag,
          items: [
             { name: t('coupons'), href: '/admin/marketing/coupons' }
          ]
        }
      ]
    },
    {
      label: t('system'),
      superAdminOnly: true,
      items: [
        {
          name: 'System',
          icon: Settings,
          items: [
            { name: t('users'), href: '/admin/system/users' },
            { name: t('settings'), href: '/admin/system/settings' },
            { name: 'Email', href: '/admin/system/email' },
            { name: 'Fleet', href: '/admin/system/fleet' },
            { name: 'Customer Chat', href: '/admin/chat' },
            { name: 'WhatsApp Bot', href: '/admin/system/whatsapp' },
            { name: 'Audit Logs', href: '/admin/system/logs' },
            { name: 'Maps', href: '/admin/maps' },
          ]
        }
      ]
    }
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex bg-sidebar h-12 items-center px-4 border-b border-sidebar-border group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
             <span className="font-serif font-bold text-lg group-data-[collapsible=icon]:hidden">Harkat Admin</span>
             <span className="font-serif font-bold text-lg hidden group-data-[collapsible=icon]:block">H</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {navGroups.map((group) => {
           if (group.superAdminOnly && userRole !== 'SUPER_ADMIN') return null

           return (
             <SidebarGroup key={group.label}>
               <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
               <SidebarGroupContent>
                 <SidebarMenu>
                   {group.items.map((item: any) => {
                     // Handle simple items
                     if (!item.items) {
                       return (
                         <SidebarMenuItem key={item.name}>
                           <SidebarMenuButton asChild tooltip={item.name} isActive={pathname === item.href}>
                             <Link href={item.href}>
                               <item.icon />
                               <span>{item.name}</span>
                             </Link>
                           </SidebarMenuButton>
                         </SidebarMenuItem>
                       )
                     }

                     // Handle Collapsible Sections (Catalog, Sales, System)
                     const isChildActive = item.items.some((child: any) => pathname === child.href)
                     // Default open if a child is active
                     const isOpen = item.items.some((child: any) => pathname.startsWith(child.href))

                     return (
                        <Collapsible key={item.name} asChild defaultOpen={isOpen} className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.name} isActive={isChildActive}>
                                        <item.icon />
                                        <span>{item.name}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((child: any) => (
                                            <SidebarMenuSubItem key={child.name}>
                                                <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                                                    <Link href={child.href}>
                                                        <span>{child.name}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                     )
                   })}
                 </SidebarMenu>
               </SidebarGroupContent>
             </SidebarGroup>
           )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <div className="ml-auto text-xs opacity-50"><ChevronDown className="h-4 w-4" /></div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                 <div className="p-2 text-xs font-medium text-muted-foreground uppercase">{user?.role?.replace('_', ' ')}</div>
                 <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {tCommon('logout')}
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
