import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LiveTrackingMap } from '@/components/tracking/live-map';

export const metadata = {
  title: 'Live Tracking - Harkat Furniture',
  description: 'Lacak pesanan Anda secara real-time',
};

export default function LiveTrackingPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-2">
            Live Tracking
          </h1>
          <p className="text-gray-600">
            Pantau lokasi driver secara real-time untuk pesanan{' '}
            <span className="font-semibold">{params.orderNumber}</span>
          </p>
        </div>

        {/* Map Component */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
              <Loader2 className="w-8 h-8 animate-spin text-[#0051BA]" />
            </div>
          }
        >
          <LiveTrackingMap orderNumber={params.orderNumber} />
        </Suspense>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            📍 Tentang Live Tracking
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Lokasi driver diperbarui setiap 2 menit</li>
            <li>• Peta akan refresh otomatis setiap 30 detik</li>
            <li>• Estimasi waktu tiba dapat berubah sesuai kondisi lalu lintas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
