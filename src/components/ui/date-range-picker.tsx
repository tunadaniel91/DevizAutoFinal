"use client"

import React from "react"
import { Calendar, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  value?: { start: string; end: string } | null
  onChange: (range: { start: string; end: string } | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selectează intervalul",
  disabled,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(() => {
    if (value?.start && value?.end) {
      const [startYear, startMonth, startDay] = value.start.split("-").map(Number)
      const [endYear, endMonth, endDay] = value.end.split("-").map(Number)
      return {
        from: new Date(startYear, startMonth - 1, startDay),
        to: new Date(endYear, endMonth - 1, endDay),
      }
    }
    return undefined
  })

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    if (range?.from && range?.to) {
      const startYear = range.from.getFullYear()
      const startMonth = String(range.from.getMonth() + 1).padStart(2, "0")
      const startDay = String(range.from.getDate()).padStart(2, "0")
      const startDate = `${startYear}-${startMonth}-${startDay}`

      const endYear = range.to.getFullYear()
      const endMonth = String(range.to.getMonth() + 1).padStart(2, "0")
      const endDay = String(range.to.getDate()).padStart(2, "0")
      const endDate = `${endYear}-${endMonth}-${endDay}`

      onChange({ start: startDate, end: endDate })
      setOpen(false)
    } else if (!range?.from && !range?.to) {
      onChange(null)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRange(undefined)
    onChange(null)
  }

  const displayValue =
    selectedRange?.from && selectedRange?.to
      ? `${selectedRange.from.toLocaleDateString("ro-RO")} - ${selectedRange.to.toLocaleDateString("ro-RO")}`
      : selectedRange?.from
        ? `${selectedRange.from.toLocaleDateString("ro-RO")} - ...`
        : ""

  const hasValue = selectedRange?.from || selectedRange?.to

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            value={displayValue}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className="cursor-pointer pr-16"
            onClick={() => !disabled && setOpen(true)}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {hasValue && (
              <button onClick={handleClear} className="text-red-500 hover:text-red-700 transition-colors" type="button">
                <X className="h-4 w-4" />
              </button>
            )}
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="range"
          selected={selectedRange}
          onSelect={handleRangeSelect}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
