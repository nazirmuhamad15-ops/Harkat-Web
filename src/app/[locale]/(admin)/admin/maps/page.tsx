'use client'

import { useState } from 'react';
import MapComponent from "./map-component";
import { Map, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function MapsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'ASSIGNED', label: 'Ditugaskan' },
    { value: 'PICKED_UP', label: 'Diambil' },
    { value: 'IN_TRANSIT', label: 'Dalam Perjalanan' },
    { value: 'DELIVERED', label: 'Terkirim' },
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 shrink-0 bg-white p-4 border-b border-stone-100">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-stone-100 rounded-lg">
                  <Map className="w-5 h-5 text-stone-700" />
               </div>
               <div>
                  <h1 className="text-lg font-bold text-stone-900">Peta Lokasi Armada</h1>
                  <p className="text-xs text-stone-500">Pantau lokasi driver dan pengiriman secara real-time</p>
               </div>
            </div>
         </div>

         {/* Search and Filters */}
         <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
               <Input
                  type="text"
                  placeholder="Cari driver, order, atau customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-stone-50 border-stone-200 text-sm"
               />
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
               {statusOptions.map((option) => (
                  <Button
                     key={option.value}
                     variant={statusFilter === option.value ? 'default' : 'outline'}
                     size="sm"
                     onClick={() => setStatusFilter(option.value)}
                     className={`h-9 text-xs whitespace-nowrap ${
                        statusFilter === option.value
                           ? 'bg-stone-900 text-white hover:bg-stone-800'
                           : 'bg-white text-stone-600 hover:bg-stone-50'
                     }`}
                  >
                     {option.label}
                  </Button>
               ))}
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-hidden p-2">
         <div className="h-full w-full rounded-xl border border-stone-200 overflow-hidden shadow-sm bg-white">
            <MapComponent searchQuery={searchQuery} statusFilter={statusFilter} />
         </div>
      </div>
    </div>
  );
}
