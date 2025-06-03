'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { format, isWithinInterval, subDays, startOfDay, endOfDay, subHours } from 'date-fns'

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

export default function AIPerformanceMetrics({ feedback }) {
  const [systemHealth, setSystemHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemHealth()
  }, [])

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const healthData = await response.json()
        setSystemHealth(healthData)
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
    } finally {
      setLoading(false)
    }
  }

  const aiMetrics = useMemo(() => {
    if (!feedback || feedback.length === 0) {
      return {
        totalProcessed: 0,
        aiAnalyzed: 0,
        averageConfidence: 0,
        confidenceDistribution: { high: 0, medium: 0, low: 0 },
        processingTimes: [],
        errorRate: 0,
        manualOverrideRate: 0,
        categoryAccuracy: {},
        recentPerformance: [],
        aiUsageByHour: {},
        fallbackUsage: 0
      }
    }

    const aiAnalyzedFeedback = feedback.filter(f => f.aiCategoryConfidence !== null && f.aiCategoryConfidence !== undefined)
    const totalProcessed = feedback.length
    const aiAnalyzed = aiAnalyzedFeedback.length

    // Confidence statistics
    const averageConfidence = aiAnalyzed > 0 
      ? aiAnalyzedFeedback.reduce((sum, f) => sum + parseFloat(f.aiCategoryConfidence || 0), 0) / aiAnalyzed
      : 0

    const confidenceDistribution = aiAnalyzedFeedback.reduce((acc, f) => {
      const confidence = parseFloat(f.aiCategoryConfidence || 0)
      if (confidence > 0.8) acc.high++
      else if (confidence > 0.5) acc.medium++
      else acc.low++
      return acc
    }, { high: 0, medium: 0, low: 0 })

    // Processing performance over last 7 days
    const last7Days = subDays(new Date(), 7)
    const recentFeedback = feedback.filter(f => 
      isWithinInterval(new Date(f.createdAt || f.created_at || f.feedbackDate), {
        start: startOfDay(last7Days),
        end: endOfDay(new Date())
      })
    )

    const recentPerformance = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayFeedback = recentFeedback.filter(f => {
        const feedbackDate = f.createdAt || f.created_at || f.feedbackDate
        return format(new Date(feedbackDate), 'yyyy-MM-dd') === dateStr
      })
      
      const dayAIFeedback = dayFeedback.filter(f => f.aiCategoryConfidence !== null)
      
      return {
        date: dateStr,
        processed: dayFeedback.length,
        aiAnalyzed: dayAIFeedback.length,
        avgConfidence: dayAIFeedback.length > 0 
          ? dayAIFeedback.reduce((sum, f) => sum + parseFloat(f.aiCategoryConfidence || 0), 0) / dayAIFeedback.length
          : 0,
        manualOverrides: dayFeedback.filter(f => f.manualOverride).length
      }
    })

    // AI usage by hour (simulated based on creation times)
    const aiUsageByHour = recentFeedback.reduce((acc, f) => {
      const hour = new Date(f.createdAt || f.created_at || f.feedbackDate).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})

    // Category accuracy (how often AI categories match manual overrides)
    const categoryAccuracy = {}
    const categoriesWithOverrides = feedback.filter(f => f.manualOverride && f.classificationHistory)
    
    categoriesWithOverrides.forEach(f => {
      if (f.classificationHistory && f.classificationHistory.length > 1) {
        const history = Array.isArray(f.classificationHistory) ? f.classificationHistory : JSON.parse(f.classificationHistory || '[]')
        const aiCategory = history.find(h => h.method === 'AI')?.category
        const manualCategory = f.category
        
        if (aiCategory) {
          if (!categoryAccuracy[aiCategory]) {
            categoryAccuracy[aiCategory] = { correct: 0, total: 0 }
          }
          categoryAccuracy[aiCategory].total++
          if (aiCategory === manualCategory) {
            categoryAccuracy[aiCategory].correct++
          }
        }
      }
    })

    // Calculate rates
    const manualOverrideRate = (feedback.filter(f => f.manualOverride).length / totalProcessed) * 100
    const errorRate = Math.max(0, 100 - averageConfidence * 100) // Simplified error rate based on confidence
    const fallbackUsage = ((totalProcessed - aiAnalyzed) / totalProcessed) * 100

    return {
      totalProcessed,
      aiAnalyzed,
      averageConfidence,
      confidenceDistribution,
      recentPerformance,
      aiUsageByHour,
      categoryAccuracy,
      manualOverrideRate,
      errorRate,
      fallbackUsage
    }
  }, [feedback])

  // Chart data
  const performanceTrendData = {
    labels: aiMetrics.recentPerformance.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [
      {
        label: 'Total Processed',
        data: aiMetrics.recentPerformance.map(d => d.processed),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'AI Analyzed',
        data: aiMetrics.recentPerformance.map(d => d.aiAnalyzed),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const confidenceTrendData = {
    labels: aiMetrics.recentPerformance.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [
      {
        label: 'Average Confidence (%)',
        data: aiMetrics.recentPerformance.map(d => d.avgConfidence * 100),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const usageByHourData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Feedback Processed',
        data: Array.from({ length: 24 }, (_, i) => aiMetrics.aiUsageByHour[i] || 0),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
    ],
  }

  const confidenceDistData = {
    labels: ['High (>80%)', 'Medium (50-80%)', 'Low (<50%)'],
    datasets: [
      {
        data: [
          aiMetrics.confidenceDistribution.high,
          aiMetrics.confidenceDistribution.medium,
          aiMetrics.confidenceDistribution.low
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
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
  }

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRecommendations = () => {
    const recommendations = []
    
    if (aiMetrics.averageConfidence < 0.7) {
      recommendations.push({
        type: 'warning',
        message: 'Average AI confidence is below 70%. Consider reviewing and improving training data.'
      })
    }
    
    if (aiMetrics.manualOverrideRate > 20) {
      recommendations.push({
        type: 'warning',
        message: `Manual override rate is ${aiMetrics.manualOverrideRate.toFixed(1)}%. High override rate may indicate AI model needs retraining.`
      })
    }
    
    if (aiMetrics.fallbackUsage > 30) {
      recommendations.push({
        type: 'error',
        message: `${aiMetrics.fallbackUsage.toFixed(1)}% of feedback is not being AI-analyzed. Check AI service connectivity.`
      })
    }
    
    if (aiMetrics.confidenceDistribution.low / aiMetrics.aiAnalyzed > 0.3) {
      recommendations.push({
        type: 'warning',
        message: 'Over 30% of AI categorizations have low confidence. Consider expanding training data for underperforming categories.'
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'AI system is performing well! All metrics are within acceptable ranges.'
      })
    }
    
    return recommendations
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">AI Performance Metrics</h2>
        <button
          onClick={fetchSystemHealth}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="bg-white p-6 rounded-lg shadow border mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${getHealthStatusColor(systemHealth.database?.status)}`}>
              <div className="flex items-center">
                <span className="text-lg font-semibold">Database</span>
                <span className="ml-2">{systemHealth.database?.status === 'healthy' ? '✅' : '⚠️'}</span>
              </div>
              <p className="text-sm mt-1">{systemHealth.database?.message}</p>
            </div>
            <div className={`p-4 rounded-lg border ${getHealthStatusColor(systemHealth.geminiAI?.status)}`}>
              <div className="flex items-center">
                <span className="text-lg font-semibold">Gemini AI</span>
                <span className="ml-2">{systemHealth.geminiAI?.status === 'healthy' ? '✅' : '⚠️'}</span>
              </div>
              <p className="text-sm mt-1">{systemHealth.geminiAI?.message}</p>
            </div>
            <div className={`p-4 rounded-lg border ${getHealthStatusColor(systemHealth.overall?.status)}`}>
              <div className="flex items-center">
                <span className="text-lg font-semibold">Overall</span>
                <span className="ml-2">{systemHealth.overall?.status === 'healthy' ? '✅' : '⚠️'}</span>
              </div>
              <p className="text-sm mt-1">System {systemHealth.overall?.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">📊</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">AI Coverage</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {aiMetrics.totalProcessed > 0 ? Math.round((aiMetrics.aiAnalyzed / aiMetrics.totalProcessed) * 100) : 0}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">🎯</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Confidence</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {Math.round(aiMetrics.averageConfidence * 100)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">✋</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Override Rate</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {aiMetrics.manualOverrideRate.toFixed(1)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">⚠️</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Fallback Usage</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {aiMetrics.fallbackUsage.toFixed(1)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Processing Trend */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Trend (Last 7 Days)</h3>
          <div className="h-64">
            <Line data={performanceTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Confidence Trend */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confidence Trend</h3>
          <div className="h-64">
            <Line data={confidenceTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Usage by Hour */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Processing by Hour</h3>
          <div className="h-64">
            <Bar data={usageByHourData} options={chartOptions} />
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confidence Distribution</h3>
          <div className="h-64">
            <Doughnut data={confidenceDistData} options={{ responsive: true }} />
          </div>
        </div>
      </div>

      {/* Category Accuracy */}
      {Object.keys(aiMetrics.categoryAccuracy).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Accuracy (Based on Manual Overrides)</h3>
          <div className="space-y-3">
            {Object.entries(aiMetrics.categoryAccuracy).map(([category, accuracy]) => {
              const percentage = (accuracy.correct / accuracy.total) * 100
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-600' : percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {accuracy.correct}/{accuracy.total} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Recommendations</h3>
        <div className="space-y-3">
          {getRecommendations().map((rec, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${
                rec.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-start">
                <span className="mr-2">
                  {rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : '🚨'}
                </span>
                <p className="text-sm">{rec.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}