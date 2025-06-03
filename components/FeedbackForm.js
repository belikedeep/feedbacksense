'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function FeedbackForm({ onFeedbackAdded }) {
  const [content, setContent] = useState('')
  const [source, setSource] = useState('manual')
  const [category, setCategory] = useState('') // Empty by default to let AI categorize
  const [feedbackDate, setFeedbackDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null)
  const [showAiResults, setShowAiResults] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setAiAnalysisResult(null)
    setShowAiResults(false)

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      // Insert feedback via API (AI analysis happens server-side)
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content,
          source,
          category: category || undefined, // Only send category if manually selected
          feedbackDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add feedback')
      }
      
      const data = await response.json()

      // Store AI analysis results for display
      if (data.aiCategoryConfidence !== null) {
        setAiAnalysisResult({
          category: data.category,
          confidence: data.aiCategoryConfidence,
          sentiment: data.sentimentLabel,
          sentimentScore: data.sentimentScore,
          topics: data.topics,
          wasManualOverride: data.manualOverride
        })
        setShowAiResults(true)
      }

      setMessage('Feedback added successfully!')
      setContent('')
      setCategory('')
      onFeedbackAdded(data)
    } catch (error) {
      setMessage('Error adding feedback: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Feedback</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Feedback Content
          </label>
          <div className="mt-1">
            <textarea
              id="content"
              name="content"
              rows={4}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter customer feedback..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Source
            </label>
            <select
              id="source"
              name="source"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="manual">Manual Entry</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="social">Social Media</option>
              <option value="survey">Survey</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category (Optional)
            </label>
            <select
              id="category"
              name="category"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Let AI categorize automatically</option>
              <option value="general_inquiry">General Inquiry</option>
              <option value="product_feedback">Product Feedback</option>
              <option value="service_complaint">Service Complaint</option>
              <option value="billing_issue">Billing Issue</option>
              <option value="technical_support">Technical Support</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="compliment">Compliment</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to let our AI automatically categorize your feedback
            </p>
          </div>

          <div>
            <label htmlFor="feedbackDate" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="feedbackDate"
              name="feedbackDate"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={feedbackDate}
              onChange={(e) => setFeedbackDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI Analyzing & Saving...
              </div>
            ) : 'Add Feedback'}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        {/* AI Analysis Results */}
        {showAiResults && aiAnalysisResult && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-3">
              🤖 AI Analysis Results
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {aiAnalysisResult.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {aiAnalysisResult.wasManualOverride && (
                    <span className="ml-2 text-xs text-gray-500">(manually overridden)</span>
                  )}
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700">Confidence:</span>
                <div className="mt-1">
                  <span className={`font-medium ${getConfidenceColor(aiAnalysisResult.confidence)}`}>
                    {getConfidenceLabel(aiAnalysisResult.confidence)} ({Math.round(aiAnalysisResult.confidence * 100)}%)
                  </span>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700">Sentiment:</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    aiAnalysisResult.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    aiAnalysisResult.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {aiAnalysisResult.sentiment} ({Math.round(aiAnalysisResult.sentimentScore * 100)}%)
                  </span>
                </div>
              </div>

              {aiAnalysisResult.topics && aiAnalysisResult.topics.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Topics:</span>
                  <div className="mt-1">
                    {aiAnalysisResult.topics.map((topic, index) => (
                      <span key={index} className="inline-block mr-1 mb-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setShowAiResults(false)}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </form>
    </div>
  )
}