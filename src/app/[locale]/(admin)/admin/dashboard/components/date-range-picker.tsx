'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export function DateRangePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const range = searchParams.get('range') || '30d'

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('range', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      <Select value={range} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">7 Hari Terakhir</SelectItem>
          <SelectItem value="30d">30 Hari Terakhir</SelectItem>
          <SelectItem value="90d">3 Bulan Terakhir</SelectItem>
          <SelectItem value="1y">1 Tahun Terakhir</SelectItem>
          <SelectItem value="all">Semua Waktu</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
