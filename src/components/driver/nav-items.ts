import {
  LayoutDashboard,
  Package,
  User,
  MapPin,
} from "lucide-react"

export const DRIVER_NAVIGATION = [
  { name: 'Dashboard', href: '/driver/dashboard', icon: LayoutDashboard },
  { name: 'Tugas', href: '/driver/dashboard', icon: Package },
  { name: 'Log BBM', href: '/driver/fuel', icon: MapPin },
  { name: 'Profil', href: '/driver/profile', icon: User },
]
