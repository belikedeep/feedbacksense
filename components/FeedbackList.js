'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import AdvancedSearchPanel from './AdvancedSearchPanel'

export default function FeedbackList({ feedback, onUpdate }) {
  const [filteredFeedback, setFilteredFeedback] = useState(feedback)
  const [currentFilters, setCurrentFilters] = useState({})

  const handleFilteredResults = (results) => {
    setFilteredFeedback(results)
  }

  const handleFiltersChange = (filters) => {
    setCurrentFilters(filters)
  }

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

  // Highlight search terms in content
  const highlightSearchTerms = (content, searchQuery) => {
    if (!searchQuery || !content) return content

    // Simple highlighting for now - can be enhanced for advanced search
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return content.split(regex).map((part, index) =>
      regex.test(part) ?
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> :
        part
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Feedback</h2>
      
      {/* Advanced Search Panel */}
      <AdvancedSearchPanel
        feedback={feedback}
        onFilteredResults={handleFilteredResults}
        onFiltersChange={handleFiltersChange}
      />

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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(item.sentimentLabel || item.sentiment_label)}`}>
                    {item.sentimentLabel || item.sentiment_label}
                  </span>
                  <span className="text-sm text-gray-500">{item.category}</span>
                  <span className="text-sm text-gray-500">{item.source}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {(() => {
                      const date = item.feedbackDate || item.feedback_date
                      if (!date) return 'No date'
                      const dateObj = new Date(date)
                      return isNaN(dateObj.getTime()) ? 'Invalid date' : dateObj.toLocaleDateString()
                    })()}
                  </span>
                  <button
                    onClick={() => deleteFeedback(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="text-gray-900 mb-3">
                {highlightSearchTerms(item.content, currentFilters.searchQuery)}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  Sentiment Score: {(parseFloat(item.sentimentScore || item.sentiment_score || 0) * 100).toFixed(1)}%
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