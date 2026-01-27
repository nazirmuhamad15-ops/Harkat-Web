import { Suspense } from 'react'
import { getFuelData } from './actions'
import { FuelLogForm } from './fuel-form'
import { Skeleton } from '@/components/ui/skeleton'

import { CalendarDateRangePicker } from '@/components/ui/date-range-picker'

export const metadata = {
  title: 'Fuel Log | Driver App',
}

export default async function FuelLogPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  
  const dateRange = from ? {
    from: new Date(from),
    to: to ? new Date(to) : new Date(from) // Defaults to same day end roughly if only from, but better to just use from. The action logic handles this.
  } : undefined

  // Adjust `to` to end of day if present, to make sure filter captures full day
  if (dateRange?.to) {
     dateRange.to.setHours(23, 59, 59, 999)
  }

  const data = await getFuelData(dateRange)

  // Handle case where user is not authorized or data fetch failed
  if (!data) {
     return <div className="p-4">Unauthorized or Error fetching data</div>
  }

  const { vehicles, activeOrders, recentLogs } = data

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Fuel Log</h1>
        <div className="flex justify-end">
            <CalendarDateRangePicker />
        </div>
      </div>
      
      <Suspense fallback={<FuelLogSkeleton />}>
        <FuelLogForm 
           initialLogs={recentLogs} 
           vehicles={vehicles}
           activeOrders={activeOrders}
        />
      </Suspense>
    </div>
  )
}

function FuelLogSkeleton() {
  return (
    <div className="space-y-6">
       <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
       </div>
    </div>
  )
}
