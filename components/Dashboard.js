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
import BrandLogo from '@/components/icons/BrandLogo'
import AnalyticsIcon from '@/components/icons/AnalyticsIcon'
import AIIcon from '@/components/icons/AIIcon'
import DataProcessingIcon from '@/components/icons/DataProcessingIcon'
import SecurityIcon from '@/components/icons/SecurityIcon'
import {
  PlusIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

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
    <div className="flex h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 w-72 h-screen bg-gradient-to-b from-teal-900 via-teal-800 to-teal-700 shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-teal-600/30 px-6 py-6">
            <BrandLogo className="w-10 h-10 text-stone-100" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-stone-50">FeedbackSense</h1>
              <Badge className="w-fit text-xs bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30">
                v2.0 AI-Powered
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 p-4 flex-1">
            <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-4">
              Main Navigation
            </div>
            {[
              {
                id: 'dashboard',
                label: 'Analytics Dashboard',
                icon: AnalyticsIcon,
                description: 'Comprehensive insights'
              },
              {
                id: 'add-feedback',
                label: 'Add Feedback',
                icon: PlusIcon,
                description: 'Create new entry'
              },
              {
                id: 'import-csv',
                label: 'Import Data',
                icon: DocumentArrowUpIcon,
                description: 'Bulk import CSV'
              },
              {
                id: 'feedback-list',
                label: 'All Feedback',
                icon: DocumentTextIcon,
                description: 'View all entries'
              },
              {
                id: 'category-analytics',
                label: 'Category Insights',
                icon: ChartBarIcon,
                description: 'Deep category analysis'
              },
              {
                id: 'ai-performance',
                label: 'AI Performance',
                icon: AIIcon,
                description: 'AI metrics & accuracy'
              },
            ].map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-stone-100/10 text-stone-50 shadow-lg backdrop-blur-sm border border-stone-100/20'
                      : 'text-stone-200 hover:bg-stone-100/5 hover:text-stone-50 hover:translate-x-1'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-200'
                      : 'bg-teal-600/30 text-stone-300 group-hover:bg-teal-500/40 group-hover:text-stone-200'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold">{item.label}</span>
                    <span className={`text-xs ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="space-y-3 p-4 border-t border-teal-600/30">
            <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-3">
              Quick Actions
            </div>
            <Button
              onClick={reanalyzeAllFeedback}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-3 bg-teal-600/20 border-teal-500/30 text-stone-200 hover:bg-teal-500/30 hover:text-stone-50 hover:border-teal-400/50"
              title="Re-analyze all feedback with AI categorization"
            >
              <AIIcon className="h-4 w-4" />
              <span>Re-analyze All</span>
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
              className="w-full justify-start gap-3 bg-teal-600/20 border-teal-500/30 text-stone-200 hover:bg-teal-500/30 hover:text-stone-50 hover:border-teal-400/50"
              title="Export category analysis report"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
          </div>

          {/* User Section */}
          <div className="border-t border-teal-600/30 p-4 bg-teal-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-stone-50">
                  {user?.email || 'User'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-stone-300">Online</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard/profile'}
                className="w-full justify-start gap-3 bg-transparent border-stone-300/30 text-stone-200 hover:bg-stone-100/10 hover:text-stone-50 hover:border-stone-200/50"
              >
                <UserIcon className="h-4 w-4" />
                <span>View Profile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start gap-3 bg-transparent border-red-400/30 text-red-200 hover:bg-red-500/20 hover:text-red-100 hover:border-red-300/50"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-gray-900">
                  {activeTab === 'dashboard' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
                        <AnalyticsIcon className="h-6 w-6 text-teal-700" />
                      </div>
                      Analytics Dashboard
                    </>
                  )}
                  {activeTab === 'add-feedback' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                        <PlusIcon className="h-6 w-6 text-amber-700" />
                      </div>
                      Add New Feedback
                    </>
                  )}
                  {activeTab === 'import-csv' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg">
                        <DocumentArrowUpIcon className="h-6 w-6 text-stone-700" />
                      </div>
                      Import CSV Data
                    </>
                  )}
                  {activeTab === 'feedback-list' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-teal-700" />
                      </div>
                      All Feedback
                    </>
                  )}
                  {activeTab === 'category-analytics' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-amber-700" />
                      </div>
                      Category Analytics
                    </>
                  )}
                  {activeTab === 'ai-performance' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
                        <AIIcon className="h-6 w-6 text-teal-700" />
                      </div>
                      AI Performance
                    </>
                  )}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
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
                  <Badge className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800">
                    <span className="h-2 w-2 rounded-full bg-amber-300"></span>
                    {feedback.length} entries
                  </Badge>
                  <Badge className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700">
                    <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse"></span>
                    Live
                  </Badge>
                </div>
              )}
              {activeTab === 'dashboard' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300"
                    onClick={fetchFeedback}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
          <div className="p-6">
            {loading ? (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                <CardContent className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {activeTab === 'dashboard' && <Analytics feedback={feedback} />}
                {activeTab === 'add-feedback' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <FeedbackForm onFeedbackAdded={addFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'import-csv' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <CSVImport onFeedbackImported={addBulkFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'feedback-list' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <FeedbackList feedback={feedback} onUpdate={fetchFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'category-analytics' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <CategoryAnalytics feedback={feedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'ai-performance' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
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