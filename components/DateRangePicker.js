'use client'

import { useState } from 'react'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import { Calendar as CalendarIcon, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function DateRangePicker({ onDateRangeChange, initialStartDate, initialEndDate }) {
  const [startDate, setStartDate] = useState(initialStartDate || null)
  const [endDate, setEndDate] = useState(initialEndDate || null)
  const [selectedRange, setSelectedRange] = useState(null)
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false)
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false)

  const predefinedRanges = [
    { 
      label: 'Last 7 days', 
      days: 7,
      icon: '📅',
      description: 'Recent week'
    },
    { 
      label: 'Last 30 days', 
      days: 30,
      icon: '📊',
      description: 'Monthly view'
    },
    { 
      label: 'Last 3 months', 
      months: 3,
      icon: '🗓️',
      description: 'Quarterly'
    },
    { 
      label: 'Last 6 months', 
      months: 6,
      icon: '📈',
      description: 'Semi-annual'
    },
    { 
      label: 'Last year', 
      years: 1,
      icon: '🎯',
      description: 'Annual view'
    },
  ]

  const handlePredefinedRange = (range) => {
    const end = endOfDay(new Date())
    let start

    if (range.days) {
      start = startOfDay(subDays(end, range.days - 1))
    } else if (range.months) {
      start = startOfDay(subMonths(end, range.months))
    } else if (range.years) {
      start = startOfDay(subYears(end, range.years))
    }

    setStartDate(start)
    setEndDate(end)
    setSelectedRange(range.label)
    onDateRangeChange(start, end)
  }

  const handleStartDateSelect = (date) => {
    setStartDate(date)
    setSelectedRange(null)
    setStartDatePopoverOpen(false)
    
    if (date && endDate) {
      onDateRangeChange(startOfDay(date), endOfDay(endDate))
    } else if (date) {
      onDateRangeChange(startOfDay(date), endDate)
    }
  }

  const handleEndDateSelect = (date) => {
    setEndDate(date)
    setSelectedRange(null)
    setEndDatePopoverOpen(false)
    
    if (startDate && date) {
      onDateRangeChange(startOfDay(startDate), endOfDay(date))
    } else if (date) {
      onDateRangeChange(startDate, endOfDay(date))
    }
  }

  const clearDateRange = () => {
    setStartDate(null)
    setEndDate(null)
    setSelectedRange(null)
    onDateRangeChange(null, null)
  }

  const clearStartDate = () => {
    setStartDate(null)
    setSelectedRange(null)
    onDateRangeChange(null, endDate)
  }

  const clearEndDate = () => {
    setEndDate(null)
    setSelectedRange(null)
    onDateRangeChange(startDate, null)
  }

  const formatDateDisplay = (date) => {
    return date ? format(date, 'MMM dd, yyyy') : ''
  }

  const getDaysCount = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate - startDate)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }
    return 0
  }

  const isDateDisabled = (date, type) => {
    if (date > new Date()) return true
    
    if (type === 'start' && endDate) {
      return date > endDate
    }
    
    if (type === 'end' && startDate) {
      return date < startDate
    }
    
    return false
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Date Range Selection
        </CardTitle>
        <CardDescription>
          Choose a time period to analyze your feedback data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Range Buttons */}
        <div>
          <h4 className="text-sm font-medium mb-3">Quick Ranges</h4>
          <div className="flex flex-wrap gap-2">
            {predefinedRanges.map((range, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handlePredefinedRange(range)}
                className={cn(
                  "h-auto py-2 px-3 flex-col gap-1 transition-colors",
                  selectedRange === range.label 
                    ? "border-teal-500 bg-teal-50 text-teal-900 hover:bg-teal-100" 
                    : "hover:bg-gray-50"
                )}
              >
                <span className="text-sm">{range.icon}</span>
                <span className="text-xs font-medium">{range.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Date Range Selection */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-600" />
            Custom Date Range
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {/* Start Date Picker */}
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">From</label>
                <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-11 justify-start text-left font-normal border-2 transition-all duration-200',
                        !startDate && 'text-muted-foreground border-gray-200 hover:border-gray-300',
                        startDate && 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 hover:border-teal-400'
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      <span className="flex-1">
                        {startDate ? formatDateDisplay(startDate) : 'Select start date'}
                      </span>
                      {startDate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2 hover:bg-red-500 hover:text-white rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearStartDate()
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateSelect}
                      disabled={(date) => isDateDisabled(date, 'start')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Arrow Separator */}
              <div className="flex items-end pb-2">
                <div className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* End Date Picker */}
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">To</label>
                <Popover open={endDatePopoverOpen} onOpenChange={setEndDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-11 justify-start text-left font-normal border-2 transition-all duration-200',
                        !endDate && 'text-muted-foreground border-gray-200 hover:border-gray-300',
                        endDate && 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 hover:border-teal-400'
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      <span className="flex-1">
                        {endDate ? formatDateDisplay(endDate) : 'Select end date'}
                      </span>
                      {endDate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2 hover:bg-red-500 hover:text-white rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearEndDate()
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateSelect}
                      disabled={(date) => isDateDisabled(date, 'end')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Date Range Validation */}
            {startDate && endDate && startDate > endDate && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-3 w-3 text-red-600" />
                </div>
                <p className="text-sm text-red-700 font-medium">
                  Start date cannot be after end date
                </p>
              </div>
            )}

            {/* Helper Text */}
            {(!startDate || !endDate) && !(startDate && endDate && startDate > endDate) && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Select both dates to create a custom range</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Range Display */}
        {(startDate || endDate) && !(startDate && endDate && startDate > endDate) && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-md">
                  <CalendarIcon className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-teal-900">Selected Range</h4>
                  <p className="text-sm text-teal-700 mt-1">
                    {startDate && endDate 
                      ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
                      : startDate 
                        ? `From ${formatDateDisplay(startDate)} (no end date)`
                        : `Until ${formatDateDisplay(endDate)} (no start date)`
                    }
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                {getDaysCount() > 0 && (
                  <Badge className="mb-1 bg-teal-600 text-white hover:bg-teal-700">
                    {getDaysCount()} days
                  </Badge>
                )}
                <div className="text-xs text-teal-600">
                  {selectedRange || 'Custom range'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clear All Button */}
        {(startDate || endDate) && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={clearDateRange}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Dates
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        {(!startDate || !endDate) && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Select both start and end dates to analyze your data, or use the quick range buttons above
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}