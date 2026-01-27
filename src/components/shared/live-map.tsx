'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Truck } from 'lucide-react';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface LiveMapProps {
  initialLat: number;
  initialLng: number;
  driverId: string;
  taskId: string;
}

// Custom hook to update map view when position changes not strictly needed with basic MapContainer unless we want to "flyTo"
// We can use a component inside MapContainer to handle map view updates
const MapUpdater = ({ lat, lng }: { lat: number; lng: number }) => {
  const [L, setL] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  
  // Get Leaflet instance and Map instance
  useEffect(() => {
    import('leaflet').then((mod) => {
        setL(mod.default);
    });
  }, []);

  // Getting map instance in react-leaflet v4 is done via useMap() hook inside a child component
  // Use a separate component for this logic if I want to strictly follow v4 patterns, 
  // but for simplicity, let's just create a component "RecenterMap"
  return null;
}

const RecenterAutomated = ({ lat, lng }: { lat: number; lng: number }) => {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// We need to wrap the useMap hook usage in a component that is definitely inside MapContainer
// Since MapContainer is dynamically imported, we can define RecenterChild outside but it will only work if rendered inside MapContainer.

// Let's create a Client Component wrapper or just put it inside the render
const RecenterMap = dynamic(
    () => Promise.resolve(({ lat, lng }: {lat: number, lng: number}) => {
        const { useMap } = require('react-leaflet');
        const map = useMap();
        useEffect(() => {
             map.flyTo([lat, lng], 15);
        }, [lat, lng, map]);
        return null;
    }),
    { ssr: false }
)


export const LiveMap: React.FC<LiveMapProps> = ({
  initialLat,
  initialLng,
  driverId,
  taskId,
}) => {
  const [location, setLocation] = useState({ lat: initialLat, lng: initialLng });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Poll for updates every 120 seconds as per plan
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/track/${taskId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data?.currentLat && data.data?.currentLng) {
            setLocation({
              lat: data.data.currentLat,
              lng: data.data.currentLng,
            });
          }
        }
      } catch (err) {
        console.error('Gagal mengambil lokasi supir:', err);
      }
    }, 120000);

    // Fix icons
    const fixLeafletIcon = async () => {
        const L = (await import('leaflet')).default
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })
    }
    fixLeafletIcon()

    return () => clearInterval(interval);
  }, [taskId]);

  if (!isMounted) {
      return <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Loading Tracking Map...</div>
  }

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-inner bg-gray-100 z-0 relative">
       <MapContainer 
            center={[location.lat, location.lng]} 
            zoom={15} 
            style={{ height: "100%", width: "100%" }}
       >
         <TileLayer
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
         />
         <Marker position={[location.lat, location.lng]}>
           <Popup>
             <div className="flex items-center gap-2">
                <Truck size={16} />
                <span>Driver Location</span>
             </div>
           </Popup>
         </Marker>
         <RecenterMap lat={location.lat} lng={location.lng} />
       </MapContainer>
    </div>
  );
};
