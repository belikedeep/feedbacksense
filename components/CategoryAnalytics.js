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
import { format, isWithinInterval, subDays, startOfDay, endOfDay } from 'date-fns'

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

export default function CategoryAnalytics({ feedback }) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const analytics = useMemo(() => {
    if (!feedback || feedback.length === 0) {
      return {
        categories: {},
        categoryTrends: {},
        topKeywords: {}
      }
    }

    // Group feedback by category
    const categories = feedback.reduce((acc, f) => {
      const category = f.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          sentiment: { positive: 0, negative: 0, neutral: 0 },
          aiAnalyzed: 0,
          confidenceSum: 0,
          manualOverrides: 0,
          topics: []
        }
      }
      
      acc[category].count++
      
      // Sentiment breakdown
      const sentiment = f.sentimentLabel || f.sentiment_label || 'neutral'
      acc[category].sentiment[sentiment]++
      
      // AI metrics
      if (f.aiCategoryConfidence !== null && f.aiCategoryConfidence !== undefined) {
        acc[category].aiAnalyzed++
        acc[category].confidenceSum += parseFloat(f.aiCategoryConfidence || 0)
      }
      
      if (f.manualOverride) {
        acc[category].manualOverrides++
      }
      
      // Collect topics
      if (f.topics && f.topics.length > 0) {
        acc[category].topics.push(...f.topics)
      }
      
      return acc
    }, {})

    // Calculate averages and top topics for each category
    Object.keys(categories).forEach(category => {
      const cat = categories[category]
      cat.avgConfidence = cat.aiAnalyzed > 0 ? cat.confidenceSum / cat.aiAnalyzed : 0
      cat.avgSentiment = cat.count > 0 ? 
        (cat.sentiment.positive * 1 + cat.sentiment.neutral * 0.5 + cat.sentiment.negative * 0) / cat.count : 0
      
      // Top topics (most frequent)
      const topicCounts = cat.topics.reduce((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1
        return acc
      }, {})
      
      cat.topTopics = Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }))
    })

    // Category trends over last 30 days
    const last30Days = subDays(new Date(), 30)
    const categoryTrends = Object.keys(categories).reduce((acc, category) => {
      const categoryFeedback = feedback.filter(f => 
        (f.category || 'uncategorized') === category &&
        isWithinInterval(new Date(f.feedbackDate || f.feedback_date), {
          start: startOfDay(last30Days),
          end: endOfDay(new Date())
        })
      )
      
      acc[category] = categoryFeedback.reduce((trends, f) => {
        const date = format(new Date(f.feedbackDate || f.feedback_date), 'yyyy-MM-dd')
        if (!trends[date]) {
          trends[date] = { count: 0, sentiment: 0 }
        }
        trends[date].count++
        trends[date].sentiment += parseFloat(f.sentimentScore || f.sentiment_score || 0.5)
        return trends
      }, {})
      
      return acc
    }, {})

    return {
      categories,
      categoryTrends
    }
  }, [feedback])

  const formatCategoryName = (category) => {
    return category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  const categoryNames = Object.keys(analytics.categories)
  const filteredData = selectedCategory === 'all' ? analytics.categories : 
    { [selectedCategory]: analytics.categories[selectedCategory] }

  // Chart data for category comparison
  const categoryComparisonData = {
    labels: categoryNames.map(formatCategoryName),
    datasets: [
      {
        label: 'Feedback Count',
        data: categoryNames.map(cat => analytics.categories[cat].count),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'AI Confidence (%)',
        data: categoryNames.map(cat => analytics.categories[cat].avgConfidence * 100),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }

  // Sentiment breakdown for selected category
  const sentimentData = selectedCategory === 'all' 
    ? {
        positive: Object.values(analytics.categories).reduce((sum, cat) => sum + cat.sentiment.positive, 0),
        negative: Object.values(analytics.categories).reduce((sum, cat) => sum + cat.sentiment.negative, 0),
        neutral: Object.values(analytics.categories).reduce((sum, cat) => sum + cat.sentiment.neutral, 0),
      }
    : analytics.categories[selectedCategory]?.sentiment || { positive: 0, negative: 0, neutral: 0 }

  const sentimentChartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [sentimentData.positive, sentimentData.negative, sentimentData.neutral],
        backgroundColor: ['#10B981', '#EF4444', '#6B7280'],
        borderWidth: 1,
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
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const exportCategoryReport = () => {
    const reportData = Object.entries(analytics.categories).map(([category, data]) => ({
      category: formatCategoryName(category),
      feedbackCount: data.count,
      aiAnalyzed: data.aiAnalyzed,
      avgConfidence: Math.round(data.avgConfidence * 100) + '%',
      manualOverrides: data.manualOverrides,
      positiveCount: data.sentiment.positive,
      negativeCount: data.sentiment.negative,
      neutralCount: data.sentiment.neutral,
      avgSentiment: (data.avgSentiment * 100).toFixed(1) + '%',
      topTopics: data.topTopics.map(t => t.topic).join('; ')
    }))

    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
      'Category,Feedback Count,AI Analyzed,Avg Confidence,Manual Overrides,Positive,Negative,Neutral,Avg Sentiment,Top Topics\n' +
      reportData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
    )
    
    const link = document.createElement('a')
    link.href = csv
    link.download = 'category-analytics-report.csv'
    link.click()
  }

  if (!feedback || feedback.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Analytics</h2>
        <p className="text-gray-500">No feedback data available for category analysis.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Category Analytics</h2>
        <button
          onClick={exportCategoryReport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          📊 Export Report
        </button>
      </div>

      {/* Category Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analyze Category:
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {categoryNames.map(category => (
            <option key={category} value={category}>
              {formatCategoryName(category)}
            </option>
          ))}
        </select>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Object.entries(filteredData).map(([category, data]) => (
          <div key={category} className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {formatCategoryName(category)}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Feedback:</span>
                <span className="font-medium">{data.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">AI Analyzed:</span>
                <span className="font-medium">{data.aiAnalyzed} ({Math.round((data.aiAnalyzed / data.count) * 100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Confidence:</span>
                <span className={`font-medium ${
                  data.avgConfidence > 0.8 ? 'text-green-600' :
                  data.avgConfidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(data.avgConfidence * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Manual Overrides:</span>
                <span className="font-medium">{data.manualOverrides}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Category Comparison */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance Comparison</h3>
          <div className="h-64">
            <Bar data={categoryComparisonData} options={chartOptions} />
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Sentiment Distribution {selectedCategory !== 'all' && `- ${formatCategoryName(selectedCategory)}`}
          </h3>
          <div className="h-64">
            <Pie data={sentimentChartData} options={{ responsive: true }} />
          </div>
        </div>
      </div>

      {/* Top Topics for Selected Category */}
      {selectedCategory !== 'all' && analytics.categories[selectedCategory]?.topTopics?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Topics - {formatCategoryName(selectedCategory)}
          </h3>
          <div className="flex flex-wrap gap-2">
            {analytics.categories[selectedCategory].topTopics.map(({ topic, count }, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {topic} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Category Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Coverage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manual Overrides</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Topics</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analytics.categories).map(([category, data]) => (
                <tr key={category} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCategoryName(category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round((data.aiAnalyzed / data.count) * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      data.avgConfidence > 0.8 ? 'bg-green-100 text-green-800' :
                      data.avgConfidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(data.avgConfidence * 100)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(data.avgSentiment * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.manualOverrides} ({Math.round((data.manualOverrides / data.count) * 100)}%)
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {data.topTopics.slice(0, 3).map(({ topic }, index) => (
                        <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                          {topic}
                        </span>
                      ))}
                      {data.topTopics.length > 3 && (
                        <span className="text-xs text-gray-400">+{data.topTopics.length - 3} more</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}