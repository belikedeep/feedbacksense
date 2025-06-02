'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'

export default function DateRangePicker({ onDateRangeChange, initialStartDate, initialEndDate }) {
  const [startDate, setStartDate] = useState(initialStartDate || null)
  const [endDate, setEndDate] = useState(initialEndDate || null)
  const [isCustomRange, setIsCustomRange] = useState(false)

  const predefinedRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', months: 3 },
    { label: 'Last 6 months', months: 6 },
    { label: 'Last year', years: 1 },
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
    setIsCustomRange(false)
    onDateRangeChange(start, end)
  }

  const handleCustomDateChange = (dates) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    
    if (start && end) {
      onDateRangeChange(startOfDay(start), endOfDay(end))
    } else if (!start && !end) {
      onDateRangeChange(null, null)
    }
  }

  const clearDateRange = () => {
    setStartDate(null)
    setEndDate(null)
    setIsCustomRange(false)
    onDateRangeChange(null, null)
  }

  const formatDateDisplay = (date) => {
    return date ? format(date, 'MMM dd, yyyy') : ''
  }

  return (
    <div className="space-y-4">
      {/* Predefined Ranges */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Date Ranges
        </label>
        <div className="flex flex-wrap gap-2">
          {predefinedRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => handlePredefinedRange(range)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={() => setIsCustomRange(true)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              isCustomRange 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {isCustomRange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Date Range
          </label>
          <div className="flex items-center space-x-3">
            <DatePicker
              selected={startDate}
              onChange={handleCustomDateChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              placeholderText="Select date range"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              dateFormat="MMM dd, yyyy"
              maxDate={new Date()}
            />
            {(startDate || endDate) && (
              <button
                onClick={clearDateRange}
                className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      {(startDate || endDate) && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <strong>Selected Range:</strong>{' '}
          {startDate && endDate 
            ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
            : startDate 
              ? `From ${formatDateDisplay(startDate)}`
              : `Until ${formatDateDisplay(endDate)}`
          }
        </div>
      )}
    </div>
  )
}