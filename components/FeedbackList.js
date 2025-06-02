'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function FeedbackList({ feedback, onUpdate }) {
  const [filter, setFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')

  const filteredFeedback = feedback.filter(item => {
    const matchesText = item.content.toLowerCase().includes(filter.toLowerCase())
    const matchesCategory = !categoryFilter || item.category === categoryFilter
    const matchesSentiment = !sentimentFilter || item.sentiment_label === sentimentFilter
    return matchesText && matchesCategory && matchesSentiment
  })

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const deleteFeedback = async (id) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('User not authenticated')

        const response = await fetch(`/api/feedback/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to delete feedback')
        onUpdate()
      } catch (error) {
        alert('Error deleting feedback: ' + error.message)
      }
    }
  }

  const categories = [...new Set(feedback.map(f => f.category))]
  const sentiments = [...new Set(feedback.map(f => f.sentiment_label))]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Feedback</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Search feedback..."
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
          >
            <option value="">All Sentiments</option>
            {sentiments.map(sent => (
              <option key={sent} value={sent}>{sent}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-500 flex items-center">
          Showing {filteredFeedback.length} of {feedback.length} items
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No feedback found matching your filters.</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(item.sentiment_label)}`}>
                    {item.sentiment_label}
                  </span>
                  <span className="text-sm text-gray-500">{item.category}</span>
                  <span className="text-sm text-gray-500">{item.source}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {new Date(item.feedback_date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteFeedback(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="text-gray-900 mb-3">{item.content}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  Sentiment Score: {(item.sentiment_score * 100).toFixed(1)}%
                </div>
                {item.topics && item.topics.length > 0 && (
                  <div>
                    Topics: {item.topics.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}