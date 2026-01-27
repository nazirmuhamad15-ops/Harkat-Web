'use client'

import { useEffect, useState } from 'react'
import { Navigation } from 'lucide-react'
import { toast } from 'sonner'

export function LocationTracker() {
  const [tracking, setTracking] = useState(false)
  
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.')
      return
    }

    const sendLocation = async (lat: number, lng: number) => {
        try {
            await fetch('/api/driver/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng })
            })
            // console.log('Location sent:', lat, lng) // Debug
        } catch (error) {
            console.error('Failed to send location', error)
        }
    }

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setTracking(true)
        const { latitude, longitude } = position.coords
        
        // Rate limit: For now, we trust the browser/OS to throttle watchPosition, 
        // but typically it fires heavily. We should throttle or debounce.
        // Let's implement a simple throttle: only send if > 30s since last send.
        
        const now = Date.now()
        const lastSent = Number(sessionStorage.getItem('last_gps_sent') || '0')
        
        if (now - lastSent > 30000) { // 30 seconds
            sendLocation(latitude, longitude)
            sessionStorage.setItem('last_gps_sent', now.toString())
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        setTracking(false)
        if (error.code === 1) { // PERMISSION_DENIED
             toast.error("Izin lokasi diperlukan agar admin bisa memantau pengiriman.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  if (!tracking) return null

  return (
    <div className="fixed bottom-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg z-50 animate-pulse" title="Sharing Location">
      <Navigation className="h-5 w-5" />
    </div>
  )
}
