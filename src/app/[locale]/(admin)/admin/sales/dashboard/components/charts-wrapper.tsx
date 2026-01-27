'use client'

import dynamic from 'next/dynamic'

// Loading placeholder
const ChartsLoading = () => (
<div className="h-[350px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">
  Loading Charts...
</div>
)

// Dynamic import with SSR disabled
const FinancialChartsImpl = dynamic(() => import('./financial-charts').then(mod => mod.FinancialCharts), {
ssr: false,
loading: () => <ChartsLoading />
})

export default function FinancialChartsWrapper(props: any) {
  return <FinancialChartsImpl {...props} />
}
