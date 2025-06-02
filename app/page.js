'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import AuthForm from '@/components/AuthForm'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Dashboard user={user} />
      ) : (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h1 className="text-center text-4xl font-bold text-gray-900 mb-2">
              FeedbackSense
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Transform customer feedback into actionable insights
            </p>
          </div>
          <AuthForm />
        </div>
      )}
    </div>
  )
}
