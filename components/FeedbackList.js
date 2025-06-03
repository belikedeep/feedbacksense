'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import AdvancedSearchPanel from './AdvancedSearchPanel'

export default function FeedbackList({ feedback, onUpdate }) {
  const [filteredFeedback, setFilteredFeedback] = useState(feedback)
  const [currentFilters, setCurrentFilters] = useState({})
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState('')
  const [updatingFeedback, setUpdatingFeedback] = useState(null)

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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Med'
    return 'Low'
  }

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return '🟢'
    if (confidence >= 0.5) return '🟡'
    return '🔴'
  }

  const updateFeedbackCategory = async (id, category) => {
    setUpdatingFeedback(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ category })
      })
      
      if (!response.ok) throw new Error('Failed to update feedback')
      
      setEditingCategory(null)
      setNewCategory('')
      onUpdate() // Refresh the list
    } catch (error) {
      alert('Error updating feedback: ' + error.message)
    } finally {
      setUpdatingFeedback(null)
    }
  }

  const triggerReanalysis = async (id) => {
    setUpdatingFeedback(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reanalyze: true })
      })
      
      if (!response.ok) throw new Error('Failed to reanalyze feedback')
      
      onUpdate() // Refresh the list
    } catch (error) {
      alert('Error reanalyzing feedback: ' + error.message)
    } finally {
      setUpdatingFeedback(null)
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

  const categories = [
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'product_feedback', label: 'Product Feedback' },
    { value: 'service_complaint', label: 'Service Complaint' },
    { value: 'billing_issue', label: 'Billing Issue' },
    { value: 'technical_support', label: 'Technical Support' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'compliment', label: 'Compliment' }
  ]

  const formatCategoryName = (category) => {
    return category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
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
                <div className="flex items-center space-x-3 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(item.sentimentLabel || item.sentiment_label)}`}>
                    {item.sentimentLabel || item.sentiment_label}
                  </span>
                  
                  {/* Category with AI confidence */}
                  <div className="flex items-center space-x-2">
                    {editingCategory === item.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                          disabled={updatingFeedback === item.id}
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => updateFeedbackCategory(item.id, newCategory)}
                          disabled={!newCategory || updatingFeedback === item.id}
                          className="text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
                        >
                          {updatingFeedback === item.id ? '...' : '✓'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null)
                            setNewCategory('')
                          }}
                          disabled={updatingFeedback === item.id}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600"
                          onClick={() => {
                            setEditingCategory(item.id)
                            setNewCategory(item.category || '')
                          }}
                          title="Click to edit category"
                        >
                          {formatCategoryName(item.category)}
                        </span>
                        
                        {/* AI Confidence Badge */}
                        {item.aiCategoryConfidence !== null && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getConfidenceColor(item.aiCategoryConfidence)}`}>
                            {getConfidenceIcon(item.aiCategoryConfidence)} AI: {getConfidenceLabel(item.aiCategoryConfidence)} ({Math.round(item.aiCategoryConfidence * 100)}%)
                          </span>
                        )}
                        
                        {/* Manual Override Indicator */}
                        {item.manualOverride && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700" title="Manually categorized">
                            Manual
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
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
                  
                  {/* Quick Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => triggerReanalysis(item.id)}
                      disabled={updatingFeedback === item.id}
                      className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                      title="Re-analyze with AI"
                    >
                      {updatingFeedback === item.id ? '...' : '🤖'}
                    </button>
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Delete feedback"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-900 mb-3">
                {highlightSearchTerms(item.content, currentFilters.searchQuery)}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Sentiment Score:</span>
                  <span className="font-medium">
                    {(parseFloat(item.sentimentScore || item.sentiment_score || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                
                {item.aiCategoryConfidence !== null && (
                  <div className="flex items-center justify-between">
                    <span>AI Confidence:</span>
                    <span className={`font-medium ${getConfidenceColor(item.aiCategoryConfidence).replace('bg-', 'text-').replace('-100', '-600')}`}>
                      {Math.round(item.aiCategoryConfidence * 100)}%
                    </span>
                  </div>
                )}
                
                {item.topics && item.topics.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Topics: </span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {item.topics.map((topic, index) => (
                        <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {item.classificationHistory && item.classificationHistory.length > 1 && (
                  <div className="md:col-span-2">
                    <details className="cursor-pointer">
                      <summary className="text-xs text-blue-600 hover:text-blue-800">
                        View Classification History ({item.classificationHistory.length} entries)
                      </summary>
                      <div className="mt-2 space-y-1">
                        {item.classificationHistory.slice(-3).map((history, index) => (
                          <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{formatCategoryName(history.category)}</span>
                              <span>{new Date(history.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="text-gray-600">
                              {history.method} - {Math.round(history.confidence * 100)}% confidence
                            </div>
                            {history.reasoning && (
                              <div className="text-gray-500 italic">{history.reasoning}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
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