'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import FeedbackForm from './FeedbackForm'
import CSVImport from './CSVImport'
import FeedbackList from './FeedbackList'
import Analytics from './Analytics'

export default function Dashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      // Ensure user profile exists
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Create or get user profile
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      // Then fetch feedback
      await fetchFeedback()
    } catch (error) {
      console.error('Error initializing user:', error)
      setLoading(false)
    }
  }

  const fetchFeedback = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch('/api/feedback', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch feedback')
      const data = await response.json()
      setFeedback(data || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut()
    } else {
      await supabase.auth.signOut()
    }
  }

  const addFeedback = (newFeedback) => {
    setFeedback([newFeedback, ...feedback])
  }

  const addBulkFeedback = (newFeedbacks) => {
    setFeedback([...newFeedbacks, ...feedback])
  }

  const reanalyzeAllFeedback = async () => {
    if (!confirm('This will re-analyze all your feedback with improved sentiment analysis. Continue?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/feedback/reanalyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Success! Re-analyzed ${result.count} feedback entries.`)
        // Refresh feedback data
        fetchFeedback()
      } else {
        throw new Error('Failed to re-analyze feedback')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">FeedbackSense</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user?.email || 'User'}</span>
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => window.location.href = '/dashboard/profile'}
                  className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
              </div>
              
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'add-feedback', label: 'Add Feedback' },
              { id: 'import-csv', label: 'Import CSV' },
              { id: 'feedback-list', label: 'All Feedback' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          
          {/* Re-analyze button */}
          <button
            onClick={reanalyzeAllFeedback}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            title="Re-analyze all feedback with improved sentiment analysis"
          >
            🔄 Fix Sentiment Scores
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Analytics feedback={feedback} />}
              {activeTab === 'add-feedback' && <FeedbackForm onFeedbackAdded={addFeedback} />}
              {activeTab === 'import-csv' && <CSVImport onFeedbackImported={addBulkFeedback} />}
              {activeTab === 'feedback-list' && <FeedbackList feedback={feedback} onUpdate={fetchFeedback} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}