'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { analyzeSentiment } from '@/lib/sentimentAnalysis'

export default function FeedbackForm({ onFeedbackAdded }) {
  const [content, setContent] = useState('')
  const [source, setSource] = useState('manual')
  const [category, setCategory] = useState('general')
  const [feedbackDate, setFeedbackDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Analyze sentiment
      const sentimentResult = await analyzeSentiment(content)
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      // Insert feedback via API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content,
          source,
          category,
          sentimentScore: sentimentResult.score,
          sentimentLabel: sentimentResult.label,
          feedbackDate,
          topics: sentimentResult.topics || []
        })
      })

      if (!response.ok) throw new Error('Failed to add feedback')
      const data = await response.json()

      setMessage('Feedback added successfully!')
      setContent('')
      setCategory('general')
      onFeedbackAdded(data)
    } catch (error) {
      setMessage('Error adding feedback: ' + error.message)
    } finally {
      setLoading(false)
    }
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
              Category
            </label>
            <select
              id="category"
              name="category"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="product">Product Quality</option>
              <option value="service">Customer Service</option>
              <option value="pricing">Pricing</option>
              <option value="delivery">Delivery</option>
              <option value="support">Technical Support</option>
              <option value="feature">Feature Request</option>
            </select>
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
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Analyzing & Saving...' : 'Add Feedback'}
          </button>
        </div>

        {message && (
          <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}