'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ChevronLeft, ChevronRight, User, Package, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import 'leaflet/dist/leaflet.css'

// Leaflet requires window object, so we import dynamically with ssr: false
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

interface Driver {
  id: string
  driverName: string
  driverPhone: string
  orderNumber: string
  customerName: string
  status: string
  lat: number
  lng: number
  lastPing: string
}

interface MapComponentProps {
  searchQuery: string
  statusFilter: string
}

export default function MapComponent({ searchQuery, statusFilter }: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456])

  useEffect(() => {
    setIsMounted(true)
    
    // Fix Leaflet Default Icon issue in Next.js
    const fixLeafletIcon = async () => {
        const L = (await import('leaflet')).default
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })
    }
    fixLeafletIcon()
    
    // Fetch data
    fetchMapData()
    const interval = setInterval(fetchMapData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchMapData = async () => {
      try {
          const res = await fetch('/api/admin/fleet/map-data')
          if (res.ok) {
              const json = await res.json()
              setDrivers(json.data || [])
          }
      } catch (err) {
          console.error("Failed to fetch map data", err)
      } finally {
          setLoading(false)
      }
  }

  // Filter drivers based on search and status
  const filteredDrivers = useMemo(() => {
    let filtered = drivers

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.driverName.toLowerCase().includes(query) ||
          d.orderNumber.toLowerCase().includes(query) ||
          d.customerName.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    return filtered
  }, [drivers, searchQuery, statusFilter])

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriverId(driver.id)
    setMapCenter([driver.lat, driver.lng])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PICKED_UP':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'Ditugaskan'
      case 'PICKED_UP':
        return 'Diambil'
      case 'IN_TRANSIT':
        return 'Dalam Perjalanan'
      case 'DELIVERED':
        return 'Terkirim'
      default:
        return status
    }
  }

  if (!isMounted) {
    return <div className="h-full w-full bg-stone-50 animate-pulse flex items-center justify-center text-stone-400 text-sm">Memuat Peta...</div>
  }

  const defaultPosition: [number, number] = [-6.2088, 106.8456] // Jakarta

  return (
    <div className="h-full w-full z-0 relative bg-stone-100 flex">
      {/* Driver List Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white border-r border-stone-200 overflow-hidden flex flex-col`}
      >
        <div className="p-3 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-stone-900">Driver Aktif</h3>
            <Badge variant="secondary" className="text-xs">
              {filteredDrivers.length}
            </Badge>
          </div>
          {searchQuery || statusFilter !== 'all' ? (
            <p className="text-[10px] text-stone-500">
              {filteredDrivers.length} dari {drivers.length} driver
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-stone-400">Memuat data...</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-stone-500 mb-1">Tidak ada driver</p>
              <p className="text-xs text-stone-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Coba ubah filter atau pencarian'
                  : 'Belum ada driver aktif saat ini'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredDrivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => handleDriverClick(driver)}
                  className={`w-full p-3 text-left hover:bg-stone-50 transition-colors ${
                    selectedDriverId === driver.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-stone-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-stone-900 truncate">
                        {driver.driverName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Package className="w-3 h-3 text-stone-400" />
                        <p className="text-xs text-stone-600 truncate">{driver.orderNumber}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <p className="text-xs text-stone-500 truncate">{driver.customerName}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(driver.status)}`}>
                          {getStatusLabel(driver.status)}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-stone-400">
                          <Clock className="w-3 h-3" />
                          {new Date(driver.lastPing).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-stone-200 rounded-r-lg p-1.5 hover:bg-stone-50 shadow-md transition-all"
        style={{ left: sidebarOpen ? '320px' : '0px' }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-stone-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-stone-600" />
        )}
      </button>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          key={`${mapCenter[0]}-${mapCenter[1]}`}
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* HQ Marker */}
          <Marker position={defaultPosition}>
            <Popup>
              <div className="text-sm font-semibold">Harkat Furniture HQ</div>
              <div className="text-xs">Pusat Distribusi Utama</div>
            </Popup>
          </Marker>

          {/* Driver Markers */}
          {filteredDrivers.map((driver) => (
            <Marker
              key={driver.id}
              position={[driver.lat, driver.lng]}
              eventHandlers={{
                click: () => handleDriverClick(driver),
              }}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <div className="font-bold text-sm text-stone-800">{driver.driverName}</div>
                  <div className="text-xs text-stone-600">Order: {driver.orderNumber}</div>
                  <div className="text-xs text-stone-600">To: {driver.customerName}</div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    Updated: {new Date(driver.lastPing).toLocaleTimeString()}
                  </div>
                  <Badge className={`text-[10px] mt-1 ${getStatusColor(driver.status)}`}>
                    {getStatusLabel(driver.status)}
                  </Badge>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay Stats */}
        <div className="absolute top-2 right-2 z-50 bg-white/90 backdrop-blur p-3 rounded-lg shadow-md border border-stone-200">
          <p className="text-xs font-bold text-stone-600 mb-1">Active Fleet</p>
          <div className="text-2xl font-bold text-stone-900">{filteredDrivers.length}</div>
          <p className="text-[10px] text-stone-400">
            {filteredDrivers.length === drivers.length ? 'Drivers on road' : 'Filtered drivers'}
          </p>
        </div>
      </div>
    </div>
  )
}
