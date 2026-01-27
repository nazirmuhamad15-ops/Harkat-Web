'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'

export function FinancialPeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || 'month'

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('period', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={period} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Pilih Periode" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Minggu Ini</SelectItem>
        <SelectItem value="month">Bulan Ini</SelectItem>
        <SelectItem value="year">Tahun Ini</SelectItem>
      </SelectContent>
    </Select>
  )
}
