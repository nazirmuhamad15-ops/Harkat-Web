"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { DRIVER_NAVIGATION } from "./nav-items"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 lg:hidden pb-2">
      <div className="flex justify-around items-center h-16 bg-white">
        {DRIVER_NAVIGATION.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 active:bg-stone-50 transition-colors",
                isActive ? "text-stone-950" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
