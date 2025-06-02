'use client'

import { useMemo } from 'react'
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
  const analytics = useMemo(() => {
    if (!feedback || feedback.length === 0) {
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
    const totalFeedback = feedback.length
    const averageSentiment = feedback.reduce((sum, f) => sum + (f.sentimentScore || f.sentiment_score || 0), 0) / totalFeedback

    // Sentiment distribution
    const sentimentDistribution = feedback.reduce((acc, f) => {
      const label = f.sentimentLabel || f.sentiment_label || 'neutral'
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})

    // Category distribution
    const categoryDistribution = feedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1
      return acc
    }, {})

    // Source distribution
    const sourceDistribution = feedback.reduce((acc, f) => {
      acc[f.source] = (acc[f.source] || 0) + 1
      return acc
    }, {})

    // Recent trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const recentTrend = last7Days.map(date => {
      const dayFeedback = feedback.filter(f => {
        const feedbackDate = f.feedbackDate || f.feedback_date
        if (!feedbackDate) return false
        
        // Handle both string and Date object formats
        const dateStr = typeof feedbackDate === 'string'
          ? feedbackDate
          : feedbackDate.toISOString ? feedbackDate.toISOString().split('T')[0]
          : String(feedbackDate).split('T')[0]
        
        return dateStr === date
      })
      
      return {
        date,
        count: dayFeedback.length,
        sentiment: dayFeedback.length > 0 ?
          dayFeedback.reduce((sum, f) => sum + (f.sentimentScore || f.sentiment_score || 0), 0) / dayFeedback.length : 0
      }
    })

    return {
      totalFeedback,
      sentimentDistribution,
      categoryDistribution,
      sourceDistribution,
      recentTrend,
      averageSentiment
    }
  }, [feedback])

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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Analytics</h2>
      
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
                <dd className="text-lg font-medium text-gray-900">{analytics.totalFeedback}</dd>
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
                <dd className="text-lg font-medium text-gray-900">{analytics.sentimentDistribution.positive || 0}</dd>
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
                <dd className="text-lg font-medium text-gray-900">{(analytics.averageSentiment * 100).toFixed(1)}%</dd>
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
          <div className="h-64">
            <Pie data={sentimentChartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback by Category</h3>
          <div className="h-64">
            <Bar data={categoryChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow border mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Trend (Last 7 Days)</h3>
        <div className="h-64">
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
    </div>
  )
}