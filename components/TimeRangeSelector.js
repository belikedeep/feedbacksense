'use client'

import { useState } from 'react'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, isEqual } from 'date-fns'
import { Calendar as CalendarIcon, Clock, TrendingUp, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function TimeRangeSelector({ onRangeChange, initialRange }) {
  const [selectedRange, setSelectedRange] = useState(initialRange || 'last30days')
  const [customStartDate, setCustomStartDate] = useState(null)
  const [customEndDate, setCustomEndDate] = useState(null)
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false)
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false)

  const predefinedRanges = [
    { 
      id: 'last7days', 
      label: 'Last 7 days', 
      icon: '📅',
      description: 'Recent week activity'
    },
    { 
      id: 'last30days', 
      label: 'Last 30 days', 
      icon: '📊',
      description: 'Monthly overview'
    },
    { 
      id: 'last3months', 
      label: 'Last 3 months', 
      icon: '🗓️',
      description: 'Quarterly trends'
    },
    { 
      id: 'last6months', 
      label: 'Last 6 months', 
      icon: '📈',
      description: 'Semi-annual patterns'
    },
    { 
      id: 'last1year', 
      label: 'Last year', 
      icon: '🎯',
      description: 'Annual analysis'
    }
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

  const formatDateRange = (rangeId) => {
    const { start, end } = calculateDateRange(rangeId)
    
    if (!start || !end) return ''
    
    if (isEqual(startOfDay(start), startOfDay(end))) {
      return format(start, 'MMM dd, yyyy')
    }
    
    return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`
  }

  const getCurrentRangeInfo = () => {
    if (selectedRange === 'custom') {
      if (customStartDate && customEndDate) {
        return `${format(customStartDate, 'MMM dd, yyyy')} - ${format(customEndDate, 'MMM dd, yyyy')}`
      }
      return 'Select custom dates...'
    }
    return formatDateRange(selectedRange)
  }

  const getDaysInRange = (rangeId) => {
    const { start, end } = calculateDateRange(rangeId)
    if (!start || !end) return 0
    
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Time Range Analysis
        </CardTitle>
        <CardDescription>
          Select a time period to analyze feedback trends and patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Predefined Range Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Quick Time Ranges</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {predefinedRanges.map((range) => (
              <Button
                key={range.id}
                variant="outline"
                className={cn(
                  "relative h-auto p-4 flex flex-col items-center gap-2 text-center transition-all duration-200 hover:shadow-md",
                  selectedRange === range.id 
                    ? "border-teal-500 bg-teal-50 text-teal-900 hover:bg-teal-100 ring-2 ring-teal-200" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
                onClick={() => handleRangeSelect(range.id)}
              >
                <span className="text-2xl">{range.icon}</span>
                <div>
                  <div className="font-medium text-sm">{range.label}</div>
                  <div className={cn(
                    "text-xs mt-1",
                    selectedRange === range.id ? "text-teal-600" : "text-muted-foreground"
                  )}>
                    {range.description}
                  </div>
                  <Badge 
                    variant={selectedRange === range.id ? "default" : "secondary"} 
                    className={cn(
                      "mt-1 text-xs",
                      selectedRange === range.id && "bg-teal-600 text-white hover:bg-teal-700"
                    )}
                  >
                    {getDaysInRange(range.id)} days
                  </Badge>
                </div>
                {selectedRange === range.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Date Range */}
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
                        !customStartDate && 'text-muted-foreground border-gray-200 hover:border-gray-300',
                        customStartDate && 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 hover:border-teal-400'
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      <span className="flex-1">
                        {customStartDate ? format(customStartDate, 'MMM dd, yyyy') : 'Select start date'}
                      </span>
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
                        !customEndDate && 'text-muted-foreground border-gray-200 hover:border-gray-300',
                        customEndDate && 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 hover:border-teal-400'
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      <span className="flex-1">
                        {customEndDate ? format(customEndDate, 'MMM dd, yyyy') : 'Select end date'}
                      </span>
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
              </div>
            </div>

            {/* Date Range Validation */}
            {customStartDate && customEndDate && customStartDate > customEndDate && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-3 w-3 text-red-600" />
                </div>
                <p className="text-sm text-red-700 font-medium">
                  Start date cannot be after end date
                </p>
              </div>
            )}

            {/* Custom Range Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(!customStartDate || !customEndDate) && !(customStartDate && customEndDate && customStartDate > customEndDate) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>Select both dates to create a custom range</span>
                  </div>
                )}
                {customStartDate && customEndDate && customStartDate <= customEndDate && (
                  <Badge className="bg-teal-100 text-teal-700 border border-teal-200 text-xs">
                    {getDaysInRange('custom')} days selected
                  </Badge>
                )}
              </div>
              
              {(customStartDate || customEndDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCustomDates}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 h-8"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-md">
                <Clock className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-teal-900">Selected Period</h4>
                <p className="text-sm text-teal-700">{getCurrentRangeInfo()}</p>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className="mb-1 bg-teal-600 text-white hover:bg-teal-700">
                {selectedRange !== 'custom' ? getDaysInRange(selectedRange) : getDaysInRange('custom')} Days
              </Badge>
              <div className="text-xs text-teal-600">
                {selectedRange === 'custom' 
                  ? 'Custom Period' 
                  : predefinedRanges.find(r => r.id === selectedRange)?.description
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}