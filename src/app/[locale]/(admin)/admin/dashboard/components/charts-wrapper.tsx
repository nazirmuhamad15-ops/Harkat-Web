'use client'

import dynamic from 'next/dynamic'

// Loading placeholder
const ChartsLoading = () => (
<div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">
  Loading Charts...
</div>
)

// Dynamic import with SSR disabled
const DashboardChartsImpl = dynamic(() => import('./dashboard-charts'), {
ssr: false,
loading: () => <ChartsLoading />
})

export default function DashboardChartsWrapper(props: any) {
  return <DashboardChartsImpl {...props} />
}
