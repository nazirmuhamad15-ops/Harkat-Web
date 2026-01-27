'use client';

import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Loader2, MapPin, User, Phone, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DriverLocation {
  latitude: number;
  longitude: number;
  lastUpdate: string;
}

interface OrderInfo {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  status: string;
  estimatedDelivery: string;
  driverName: string;
  driverPhone?: string;
}

interface LiveTrackingData {
  driver: DriverLocation | null;
  order: OrderInfo;
}

export function LiveTrackingMap({ orderNumber }: { orderNumber: string }) {
  const [data, setData] = useState<LiveTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tracking data
  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`/api/public/tracking/${orderNumber}/live`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTrackingData();
  }, [orderNumber]);

  // Poll every 30 seconds for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-stone-500">{error || 'No tracking data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const { driver, order } = data;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

  // Default center (customer location or driver location)
  const center = driver
    ? { lat: driver.latitude, lng: driver.longitude }
    : { lat: -6.2088, lng: 106.8456 }; // Default Jakarta

  return (
    <div className="space-y-4">
      {/* Order Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-playfair">Order Tracking</CardTitle>
            <Badge variant={order.status === 'IN_TRANSIT' ? 'default' : 'secondary'}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 mt-1 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Order Number</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 mt-1 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Customer</p>
                  <p className="font-semibold">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Delivery Address</p>
                  <p className="text-sm">{order.deliveryAddress}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 mt-1 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Driver</p>
                  <p className="font-semibold">{order.driverName}</p>
                </div>
              </div>
              {order.driverPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-1 text-stone-500" />
                  <div>
                    <p className="text-xs text-stone-500">Driver Phone</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 font-semibold"
                      asChild
                    >
                      <a href={`tel:${order.driverPhone}`}>{order.driverPhone}</a>
                    </Button>
                  </div>
                </div>
              )}
              {driver && (
                <div>
                  <p className="text-xs text-stone-500">Last Update</p>
                  <p className="text-sm">
                    {new Date(driver.lastUpdate).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[500px] w-full rounded-lg overflow-hidden">
            {driver ? (
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={center}
                  defaultZoom={15}
                  mapId="live-tracking-map"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                >
                  <AdvancedMarker position={center}>
                    <Pin
                      background="#0058A3"
                      borderColor="#003d73"
                      glyphColor="#ffffff"
                    />
                  </AdvancedMarker>
                </Map>
              </APIProvider>
            ) : (
              <div className="flex items-center justify-center h-full bg-stone-100">
                <p className="text-stone-500">Driver location not available yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
