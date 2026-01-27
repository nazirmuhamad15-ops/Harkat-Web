'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Navigation, Truck } from "lucide-react"

interface DriverLocation {
  lat: number
  lng: number
  lastUpdate: string | null
  driverName?: string
  driverPhone?: string
}

interface DriverLocationMapProps {
  location: DriverLocation
}

export default function DriverLocationMap({ location }: DriverLocationMapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Navigation className="w-5 h-5 mr-2" />
          Live Driver Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">{location.driverName || 'Driver'}</p>
                <p className="text-sm text-blue-700">{location.driverPhone || 'N/A'}</p>
                {location.lastUpdate && (
                  <p className="text-xs text-blue-600 mt-1">
                    Last updated: {new Date(location.lastUpdate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${location.lat},${location.lng}&zoom=15`}
              allowFullScreen
            />
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            📍 Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
