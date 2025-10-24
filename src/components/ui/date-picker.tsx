"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Selectează data", disabled, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, month - 1, day)
  })

  // Update selectedDate when value prop changes
  React.useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-").map(Number)
      setSelectedDate(new Date(year, month - 1, day))
    } else {
      setSelectedDate(undefined)
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const formattedDate = `${year}-${month}-${day}`
      onChange(formattedDate)
    } else {
      onChange("")
    }
    setOpen(false)
  }

  const displayValue = selectedDate ? selectedDate.toLocaleDateString("ro-RO") : ""

  const handleInputClick = () => {
    if (!disabled) {
      setOpen(true)
    }
  }

  const handlePopoverOpenChange = (newOpen: boolean) => {
    if (!disabled) {
      setOpen(newOpen)
    }
  }

  return (
    <Popover open={open && !disabled} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            value={displayValue}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className={cn("cursor-pointer pr-10", disabled && "cursor-not-allowed opacity-50")}
            onClick={handleInputClick}
          />
          <Calendar
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
              disabled ? "text-gray-300" : "text-gray-400",
            )}
          />
        </div>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
        </PopoverContent>
      )}
    </Popover>
  )
}
