'use client'

import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import TimeRangeSelector from './TimeRangeSelector'
import ExportPanel from './ExportPanel'
import { format, isWithinInterval, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

export default function Analytics({ feedback }) {
  const [selectedTimeRange, setSelectedTimeRange] = useState({
    start: startOfDay(subDays(new Date(), 29)),
    end: endOfDay(new Date()),
    rangeId: 'last30days'
  })
  const [showExportPanel, setShowExportPanel] = useState(false)

  // Filter feedback by selected time range
  const filteredFeedback = useMemo(() => {
    if (!selectedTimeRange.start || !selectedTimeRange.end) return feedback

    return feedback.filter(item => {
      const feedbackDate = new Date(item.feedbackDate || item.feedback_date)
      return isWithinInterval(feedbackDate, {
        start: selectedTimeRange.start,
        end: selectedTimeRange.end
      })
    })
  }, [feedback, selectedTimeRange])

  // Calculate previous period data for comparison
  const previousPeriodData = useMemo(() => {
    if (!selectedTimeRange.start || !selectedTimeRange.end) return []

    const rangeDuration = selectedTimeRange.end - selectedTimeRange.start
    const previousStart = new Date(selectedTimeRange.start.getTime() - rangeDuration)
    const previousEnd = new Date(selectedTimeRange.end.getTime() - rangeDuration)

    return feedback.filter(item => {
      const feedbackDate = new Date(item.feedbackDate || item.feedback_date)
      return isWithinInterval(feedbackDate, {
        start: previousStart,
        end: previousEnd
      })
    })
  }, [feedback, selectedTimeRange])

  const analytics = useMemo(() => {
    if (!filteredFeedback || filteredFeedback.length === 0) {
      return {
        totalFeedback: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        categoryDistribution: {},
        sourceDistribution: {},
        recentTrend: [],
        averageSentiment: 0
      }
    }

    // Basic metrics
    const totalFeedback = filteredFeedback.length
    const averageSentiment = totalFeedback > 0
      ? filteredFeedback.reduce((sum, f) => {
          const score = parseFloat(f.sentimentScore || f.sentiment_score || 0)
          return sum + score
        }, 0) / totalFeedback
      : 0

    // Sentiment distribution
    const sentimentDistribution = filteredFeedback.reduce((acc, f) => {
      const label = f.sentimentLabel || f.sentiment_label || 'neutral'
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})

    // Category distribution
    const categoryDistribution = filteredFeedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1
      return acc
    }, {})

    // Source distribution
    const sourceDistribution = filteredFeedback.reduce((acc, f) => {
      acc[f.source] = (acc[f.source] || 0) + 1
      return acc
    }, {})

    // Generate trend data based on selected time range
    const generateTrendData = (startDate, endDate, data) => {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      const trendData = []

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        const dayFeedback = data.filter(f => {
          const feedbackDate = f.feedbackDate || f.feedback_date
          if (!feedbackDate) return false
          
          const feedbackDateStr = typeof feedbackDate === 'string'
            ? feedbackDate.split('T')[0]
            : new Date(feedbackDate).toISOString().split('T')[0]
          
          return feedbackDateStr === dateStr
        })

        trendData.push({
          date: dateStr,
          count: dayFeedback.length,
          sentiment: dayFeedback.length > 0 ?
            dayFeedback.reduce((sum, f) => sum + parseFloat(f.sentimentScore || f.sentiment_score || 0), 0) / dayFeedback.length : 0
        })
      }

      return trendData
    }

    const recentTrend = generateTrendData(selectedTimeRange.start, selectedTimeRange.end, filteredFeedback)

    return {
      totalFeedback,
      sentimentDistribution,
      categoryDistribution,
      sourceDistribution,
      recentTrend,
      averageSentiment,
      previousPeriodData,
      selectedTimeRange
    }
  }, [filteredFeedback, previousPeriodData, selectedTimeRange])

  // Calculate period-over-period comparison
  const periodComparison = useMemo(() => {
    const currentTotal = analytics.totalFeedback
    const previousTotal = previousPeriodData.length
    
    const currentPositive = analytics.sentimentDistribution.positive || 0
    const previousPositive = previousPeriodData.filter(f =>
      (f.sentimentLabel || f.sentiment_label) === 'positive'
    ).length
    
    const currentAvgSentiment = analytics.averageSentiment
    const previousAvgSentiment = previousTotal > 0 ?
      previousPeriodData.reduce((sum, f) => sum + parseFloat(f.sentimentScore || f.sentiment_score || 0), 0) / previousTotal : 0

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      totalChange: calculateChange(currentTotal, previousTotal),
      positiveChange: calculateChange(currentPositive, previousPositive),
      sentimentChange: calculateChange(currentAvgSentiment, previousAvgSentiment),
      hasPreviousData: previousTotal > 0
    }
  }, [analytics, previousPeriodData])

  const handleTimeRangeChange = (start, end, rangeId) => {
    setSelectedTimeRange({ start, end, rangeId })
  }

  const sentimentChartData = {
    labels: Object.keys(analytics.sentimentDistribution),
    datasets: [
      {
        data: Object.values(analytics.sentimentDistribution),
        backgroundColor: [
          '#10B981', // green
          '#EF4444', // red
          '#6B7280', // gray
        ],
        borderWidth: 1,
      },
    ],
  }

  const categoryChartData = {
    labels: Object.keys(analytics.categoryDistribution),
    datasets: [
      {
        label: 'Feedback Count',
        data: Object.values(analytics.categoryDistribution),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  }

  const trendChartData = {
    labels: analytics.recentTrend.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Feedback Count',
        data: analytics.recentTrend.map(d => d.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  const formatChange = (change) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Analytics</h2>
        <p className="text-gray-500">No feedback data available. Add some feedback to see analytics.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h2>
        <button
          onClick={() => setShowExportPanel(!showExportPanel)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Data
        </button>
      </div>

      {/* Time Range Selector */}
      <TimeRangeSelector
        onRangeChange={handleTimeRangeChange}
        initialRange={selectedTimeRange.rangeId}
      />

      {/* Export Panel */}
      {showExportPanel && (
        <div className="mb-6">
          <ExportPanel
            feedback={feedback}
            analytics={analytics}
            filteredFeedback={filteredFeedback}
          />
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">#</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Feedback</dt>
                <dd className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900">{analytics.totalFeedback}</span>
                  {periodComparison.hasPreviousData && (
                    <span className={`text-sm ${getChangeColor(periodComparison.totalChange)}`}>
                      {formatChange(periodComparison.totalChange)}
                    </span>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">😊</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Positive</dt>
                <dd className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900">{analytics.sentimentDistribution.positive || 0}</span>
                  {periodComparison.hasPreviousData && (
                    <span className={`text-sm ${getChangeColor(periodComparison.positiveChange)}`}>
                      {formatChange(periodComparison.positiveChange)}
                    </span>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">😞</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Negative</dt>
                <dd className="text-lg font-medium text-gray-900">{analytics.sentimentDistribution.negative || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">📊</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Sentiment</dt>
                <dd className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900">
                    {isNaN(analytics.averageSentiment) ? '0.0' : (analytics.averageSentiment * 100).toFixed(1)}%
                  </span>
                  {periodComparison.hasPreviousData && (
                    <span className={`text-sm ${getChangeColor(periodComparison.sentimentChange)}`}>
                      {formatChange(periodComparison.sentimentChange)}
                    </span>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sentiment Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Distribution</h3>
          <div className="h-64" data-chart-export data-chart-title="Sentiment Distribution">
            <Pie data={sentimentChartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback by Category</h3>
          <div className="h-64" data-chart-export data-chart-title="Feedback by Category">
            <Bar data={categoryChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow border mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Feedback Trend ({selectedTimeRange.rangeId === 'custom' ? 'Custom Range' :
            selectedTimeRange.rangeId.replace('last', 'Last ').replace('days', ' Days').replace('months', ' Months').replace('1year', '1 Year')})
        </h3>
        <div className="h-64" data-chart-export data-chart-title="Feedback Trend">
          <Line data={trendChartData} options={chartOptions} />
        </div>
      </div>

      {/* Source Distribution */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Sources</h3>
        <div className="space-y-3">
          {Object.entries(analytics.sourceDistribution).map(([source, count]) => (
            <div key={source} className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900 capitalize">{source}</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(count / analytics.totalFeedback) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Period Comparison Summary */}
      {periodComparison.hasPreviousData && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Period-over-Period Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatChange(periodComparison.totalChange)}</div>
              <div className="text-sm text-gray-500">Total Feedback</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatChange(periodComparison.positiveChange)}</div>
              <div className="text-sm text-gray-500">Positive Feedback</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatChange(periodComparison.sentimentChange)}</div>
              <div className="text-sm text-gray-500">Avg Sentiment</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Compared to previous {selectedTimeRange.rangeId === 'custom' ? 'period' :
              selectedTimeRange.rangeId.replace('last', '').replace('days', ' days').replace('months', ' months').replace('1year', ' year')}
          </p>
        </div>
      )}
    </div>
  )
}