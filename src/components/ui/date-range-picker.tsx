"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function CalendarDateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  
  const [date, setDate] = React.useState<DateRange | undefined>(
    fromParam ? {
      from: new Date(fromParam),
      to: toParam ? new Date(toParam) : undefined
    } : undefined
  )

  const onSelect = (newDate: DateRange | undefined) => {
    setDate(newDate)
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (newDate?.from) {
      params.set("from", newDate.from.toISOString())
      if (newDate.to) {
        params.set("to", newDate.to.toISOString())
      } else {
        params.delete("to")
      }
    } else {
      params.delete("from")
      params.delete("to")
    }
    
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
