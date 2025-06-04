'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import FeedbackForm from './FeedbackForm'
import CSVImport from './CSVImport'
import FeedbackList from './FeedbackList'
import Analytics from './Analytics'
import CategoryAnalytics from './CategoryAnalytics'
import AIPerformanceMetrics from './AIPerformanceMetrics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

export default function Dashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeUser()
    
    // Listen for tab switch events from Analytics empty state
    const handleTabSwitch = (event) => {
      setActiveTab(event.detail)
    }
    
    window.addEventListener('switchTab', handleTabSwitch)
    
    return () => {
      window.removeEventListener('switchTab', handleTabSwitch)
    }
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 w-64 h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b px-6 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">FS</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight">FeedbackSense</h1>
              <Badge variant="secondary" className="w-fit text-xs">
                v2.0
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 p-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Analytics overview' },
              { id: 'add-feedback', label: 'Add Feedback', icon: '➕', description: 'Create new entry' },
              { id: 'import-csv', label: 'Import CSV', icon: '📁', description: 'Bulk import data' },
              { id: 'feedback-list', label: 'All Feedback', icon: '📝', description: 'View all entries' },
              { id: 'category-analytics', label: 'Categories', icon: '📈', description: 'Category insights' },
              { id: 'ai-performance', label: 'AI Performance', icon: '🤖', description: 'AI metrics' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-xs opacity-70">{item.description}</span>
                </div>
              </button>
            ))}
          </nav>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2 p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <Button
              onClick={reanalyzeAllFeedback}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              title="Re-analyze all feedback with AI categorization"
            >
              🤖 Re-analyze All
            </Button>
            <Button
              onClick={() => {
                const csvData = feedback.map(f => ({
                  content: f.content,
                  category: f.category,
                  aiConfidence: f.aiCategoryConfidence ? Math.round(f.aiCategoryConfidence * 100) + '%' : 'N/A',
                  manualOverride: f.manualOverride ? 'Yes' : 'No',
                  sentiment: f.sentimentLabel || f.sentiment_label,
                  source: f.source,
                  date: f.feedbackDate || f.feedback_date
                }))
                const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
                  'Content,Category,AI Confidence,Manual Override,Sentiment,Source,Date\n' +
                  csvData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
                )
                const link = document.createElement('a')
                link.href = csv
                link.download = 'feedback-category-report.csv'
                link.click()
              }}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              title="Export category analysis report"
            >
              📊 Export Report
            </Button>
          </div>

          <Separator />

          {/* User Section - Always Visible */}
          <div className="border-t p-4 mt-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {user?.email || 'User'}
                </span>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard/profile'}
                className="w-full justify-start gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  {activeTab === 'dashboard' && (
                    <>
                      <span className="text-2xl">📊</span>
                      Dashboard Analytics
                    </>
                  )}
                  {activeTab === 'add-feedback' && (
                    <>
                      <span className="text-2xl">➕</span>
                      Add New Feedback
                    </>
                  )}
                  {activeTab === 'import-csv' && (
                    <>
                      <span className="text-2xl">📁</span>
                      Import CSV Data
                    </>
                  )}
                  {activeTab === 'feedback-list' && (
                    <>
                      <span className="text-2xl">📝</span>
                      All Feedback
                    </>
                  )}
                  {activeTab === 'category-analytics' && (
                    <>
                      <span className="text-2xl">📈</span>
                      Category Analytics
                    </>
                  )}
                  {activeTab === 'ai-performance' && (
                    <>
                      <span className="text-2xl">🤖</span>
                      AI Performance Metrics
                    </>
                  )}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {activeTab === 'dashboard' && 'Comprehensive insights and performance metrics'}
                  {activeTab === 'add-feedback' && 'Create a new feedback entry with AI categorization'}
                  {activeTab === 'import-csv' && 'Bulk import feedback data from CSV files'}
                  {activeTab === 'feedback-list' && 'View and manage all feedback entries'}
                  {activeTab === 'category-analytics' && 'Deep dive into category performance'}
                  {activeTab === 'ai-performance' && 'Monitor AI categorization performance'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {feedback.length > 0 && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    {feedback.length} entries
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    Live
                  </Badge>
                </div>
              )}
              {activeTab === 'dashboard' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={fetchFeedback}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {loading ? (
              <Card>
                <CardContent className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {activeTab === 'dashboard' && <Analytics feedback={feedback} />}
                {activeTab === 'add-feedback' && (
                  <Card>
                    <CardContent className="p-6">
                      <FeedbackForm onFeedbackAdded={addFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'import-csv' && (
                  <Card>
                    <CardContent className="p-6">
                      <CSVImport onFeedbackImported={addBulkFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'feedback-list' && (
                  <Card>
                    <CardContent className="p-6">
                      <FeedbackList feedback={feedback} onUpdate={fetchFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'category-analytics' && (
                  <Card>
                    <CardContent className="p-6">
                      <CategoryAnalytics feedback={feedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'ai-performance' && (
                  <Card>
                    <CardContent className="p-6">
                      <AIPerformanceMetrics feedback={feedback} />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}