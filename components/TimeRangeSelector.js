'use client'

import { useState } from 'react'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export default function TimeRangeSelector({ onRangeChange, initialRange }) {
  const [selectedRange, setSelectedRange] = useState(initialRange || 'last30days')
  const [customStartDate, setCustomStartDate] = useState(null)
  const [customEndDate, setCustomEndDate] = useState(null)
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false)
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false)

  const predefinedRanges = [
    { id: 'last7days', label: '7d', fullLabel: 'Last 7 days' },
    { id: 'last30days', label: '30d', fullLabel: 'Last 30 days' },
    { id: 'last3months', label: '3m', fullLabel: 'Last 3 months' },
    { id: 'last6months', label: '6m', fullLabel: 'Last 6 months' },
    { id: 'last1year', label: '1y', fullLabel: 'Last year' }
  ]

  const calculateDateRange = (rangeId) => {
    const end = endOfDay(new Date())
    let start

    switch (rangeId) {
      case 'last7days':
        start = startOfDay(subDays(end, 6))
        break
      case 'last30days':
        start = startOfDay(subDays(end, 29))
        break
      case 'last3months':
        start = startOfDay(subMonths(end, 3))
        break
      case 'last6months':
        start = startOfDay(subMonths(end, 6))
        break
      case 'last1year':
        start = startOfDay(subYears(end, 1))
        break
      case 'custom':
        return { start: customStartDate, end: customEndDate }
      default:
        start = startOfDay(subDays(end, 29))
    }

    return { start, end }
  }

  const handleRangeSelect = (rangeId) => {
    setSelectedRange(rangeId)

    if (rangeId !== 'custom') {
      const { start, end } = calculateDateRange(rangeId)
      setCustomStartDate(null)
      setCustomEndDate(null)
      onRangeChange(start, end, rangeId)
    } else if (customStartDate && customEndDate) {
      onRangeChange(customStartDate, customEndDate, rangeId)
    }
  }

  const handleStartDateSelect = (date) => {
    setCustomStartDate(date)
    setSelectedRange('custom')
    setStartDatePopoverOpen(false)
    
    if (date && customEndDate) {
      onRangeChange(startOfDay(date), endOfDay(customEndDate), 'custom')
    }
  }

  const handleEndDateSelect = (date) => {
    setCustomEndDate(date)
    setSelectedRange('custom')
    setEndDatePopoverOpen(false)
    
    if (customStartDate && date) {
      onRangeChange(startOfDay(customStartDate), endOfDay(date), 'custom')
    }
  }

  const clearCustomDates = () => {
    setCustomStartDate(null)
    setCustomEndDate(null)
    setSelectedRange('last30days')
    const { start, end } = calculateDateRange('last30days')
    onRangeChange(start, end, 'last30days')
  }

  const isDateDisabled = (date, type) => {
    if (date > new Date()) return true
    
    if (type === 'start' && customEndDate) {
      return date > customEndDate
    }
    
    if (type === 'end' && customStartDate) {
      return date < customStartDate
    }
    
    return false
  }

  const getCustomDateDisplay = (type) => {
    const date = type === 'start' ? customStartDate : customEndDate
    return date ? format(date, 'MMM dd') : `${type === 'start' ? 'From' : 'To'}`
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
      {/* Quick Range Pills */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600 mr-1">Period:</span>
        {predefinedRanges.map((range) => (
          <Button
            key={range.id}
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-3 text-xs font-medium transition-all duration-200",
              selectedRange === range.id 
                ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600" 
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
            onClick={() => handleRangeSelect(range.id)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-gray-300"></div>

      {/* Custom Date Inputs */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Custom:</span>
        
        {/* Start Date */}
        <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 px-2 text-xs min-w-[60px] justify-center",
                customStartDate && selectedRange === 'custom' 
                  ? "bg-teal-50 border-teal-300 text-teal-900 hover:bg-teal-100" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {getCustomDateDisplay('start')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customStartDate}
              onSelect={handleStartDateSelect}
              disabled={(date) => isDateDisabled(date, 'start')}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-xs text-gray-400">→</span>

        {/* End Date */}
        <Popover open={endDatePopoverOpen} onOpenChange={setEndDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 px-2 text-xs min-w-[60px] justify-center",
                customEndDate && selectedRange === 'custom' 
                  ? "bg-teal-50 border-teal-300 text-teal-900 hover:bg-teal-100" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {getCustomDateDisplay('end')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customEndDate}
              onSelect={handleEndDateSelect}
              disabled={(date) => isDateDisabled(date, 'end')}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear Custom Dates */}
        {(customStartDate || customEndDate) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
            onClick={clearCustomDates}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Current Selection Info */}
      {selectedRange === 'custom' && customStartDate && customEndDate && (
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
            {Math.ceil((customEndDate - customStartDate) / (1000 * 60 * 60 * 24)) + 1} days
          </Badge>
        </div>
      )}
    </div>
  )
}