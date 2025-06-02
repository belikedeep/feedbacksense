'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, isEqual } from 'date-fns'
import "react-datepicker/dist/react-datepicker.css"

export default function TimeRangeSelector({ onRangeChange, initialRange }) {
  const [selectedRange, setSelectedRange] = useState(initialRange || 'last30days')
  const [customStartDate, setCustomStartDate] = useState(null)
  const [customEndDate, setCustomEndDate] = useState(null)
  const [isCustomRange, setIsCustomRange] = useState(false)

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
    },
    { 
      id: 'custom', 
      label: 'Custom range', 
      icon: '⚙️',
      description: 'Select specific dates'
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
    setIsCustomRange(rangeId === 'custom')

    if (rangeId !== 'custom') {
      const { start, end } = calculateDateRange(rangeId)
      onRangeChange(start, end, rangeId)
    } else if (customStartDate && customEndDate) {
      onRangeChange(customStartDate, customEndDate, rangeId)
    }
  }

  const handleCustomDateChange = (dates) => {
    const [start, end] = dates
    setCustomStartDate(start)
    setCustomEndDate(end)
    
    if (start && end) {
      const range = {
        start: startOfDay(start),
        end: endOfDay(end)
      }
      onRangeChange(range.start, range.end, 'custom')
    }
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
        return formatDateRange('custom')
      }
      return 'Select dates...'
    }
    return formatDateRange(selectedRange)
  }

  const getDaysInRange = (rangeId) => {
    const { start, end } = calculateDateRange(rangeId)
    if (!start || !end) return 0
    
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Time Range Analysis</h3>
        <p className="text-sm text-gray-600">
          Select a time period to analyze feedback trends and patterns
        </p>
      </div>

      {/* Predefined Range Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {predefinedRanges.map((range) => (
          <button
            key={range.id}
            onClick={() => handleRangeSelect(range.id)}
            className={`
              relative p-4 text-left border-2 rounded-lg transition-all duration-200 hover:shadow-md
              ${selectedRange === range.id
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl mb-2">{range.icon}</span>
              <span className="font-medium text-sm mb-1">{range.label}</span>
              <span className="text-xs text-gray-500">{range.description}</span>
              {range.id !== 'custom' && (
                <span className="text-xs text-gray-400 mt-1">
                  {getDaysInRange(range.id)} days
                </span>
              )}
            </div>
            
            {selectedRange === range.id && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {isCustomRange && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Custom Date Range
          </label>
          <div className="flex items-center space-x-4">
            <DatePicker
              selected={customStartDate}
              onChange={handleCustomDateChange}
              startDate={customStartDate}
              endDate={customEndDate}
              selectsRange
              placeholderText="Click to select date range"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              dateFormat="MMM dd, yyyy"
              maxDate={new Date()}
              isClearable
            />
            
            {customStartDate && customEndDate && (
              <div className="text-sm text-gray-600 whitespace-nowrap">
                {getDaysInRange('custom')} days
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-blue-900">Selected Time Range</h4>
            <p className="text-sm text-blue-700 mt-1">{getCurrentRangeInfo()}</p>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-blue-900">
              {selectedRange !== 'custom' ? getDaysInRange(selectedRange) : getDaysInRange('custom')} Days
            </div>
            <div className="text-xs text-blue-600">
              {selectedRange === 'custom' ? 'Custom Period' : predefinedRanges.find(r => r.id === selectedRange)?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-500">
          Analysis will show trends and comparisons for the selected period
        </div>
        
        {selectedRange !== 'last30days' && (
          <button
            onClick={() => handleRangeSelect('last30days')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset to 30 days
          </button>
        )}
      </div>
    </div>
  )
}