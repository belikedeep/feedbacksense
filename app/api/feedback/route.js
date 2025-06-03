import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { analyzeAndCategorizeFeedback } from '@/lib/sentimentAnalysis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get feedback for the authenticated user with retry logic
    let feedback
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        feedback = await prisma.feedback.findMany({
          where: {
            userId: user.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        break
      } catch (dbError) {
        retryCount++
        console.error(`Database error (attempt ${retryCount}):`, dbError)
        
        if (retryCount >= maxRetries) {
          // Check if it's a connection error
          if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database server")) {
            return NextResponse.json({
              error: 'Database connection failed. Please check your database connection and try again.',
              details: 'Unable to connect to database server'
            }, { status: 503 })
          }
          throw dbError
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    return NextResponse.json(feedback || [])
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({
      error: 'Failed to fetch feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Safely parse JSON with error handling
    let body = {}
    try {
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await request.text()
        if (text.trim()) {
          body = JSON.parse(text)
        }
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    const { content, source, category, sentimentScore, sentimentLabel, topics, feedbackDate } = body

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Perform AI-powered analysis
    let analysisResult = null
    try {
      analysisResult = await analyzeAndCategorizeFeedback(content.trim())
    } catch (analysisError) {
      console.error('AI analysis failed, proceeding with manual categorization:', analysisError)
      // Continue with manual categorization - don't block user flow
    }

    // Ensure user profile exists with retry logic
    let existingProfile
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        existingProfile = await prisma.profile.findUnique({
          where: { id: user.id }
        })
        break
      } catch (dbError) {
        retryCount++
        console.error(`Database error checking profile (attempt ${retryCount}):`, dbError)
        
        if (retryCount >= maxRetries) {
          if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database server")) {
            return NextResponse.json({
              error: 'Database connection failed. Please check your database connection and try again.',
              details: 'Unable to connect to database server'
            }, { status: 503 })
          }
          throw dbError
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    if (!existingProfile) {
      try {
        // Create profile if it doesn't exist
        await prisma.profile.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            preferences: {},
            timezone: 'UTC'
          }
        })
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({
          error: 'Failed to create user profile. Please try again.',
          details: process.env.NODE_ENV === 'development' ? profileError.message : undefined
        }, { status: 500 })
      }
    }

    // Create new feedback with retry logic
    let newFeedback
    retryCount = 0
    
    // Prepare feedback data with AI analysis results or fallback values
    const feedbackData = {
      userId: user.id,
      content: content.trim(),
      source: source || 'manual',
      feedbackDate: feedbackDate ? new Date(feedbackDate) : new Date()
    }

    if (analysisResult) {
      // Use AI analysis results
      feedbackData.category = category || analysisResult.aiCategory || 'general'
      feedbackData.sentimentScore = analysisResult.sentimentScore || 0.5
      feedbackData.sentimentLabel = analysisResult.sentimentLabel || 'neutral'
      feedbackData.topics = analysisResult.topics || []
      feedbackData.aiCategoryConfidence = analysisResult.aiCategoryConfidence || null
      feedbackData.aiClassificationMeta = analysisResult.classificationMeta || null
      feedbackData.classificationHistory = [analysisResult.historyEntry] || []
      feedbackData.manualOverride = category ? true : false // Set to true if category was manually provided
    } else {
      // Fallback to manual/existing values
      feedbackData.category = category || 'general'
      feedbackData.sentimentScore = sentimentScore || 0.5
      feedbackData.sentimentLabel = sentimentLabel || 'neutral'
      feedbackData.topics = topics || []
      feedbackData.aiCategoryConfidence = null
      feedbackData.aiClassificationMeta = null
      feedbackData.classificationHistory = []
      feedbackData.manualOverride = category ? true : false
    }
    
    while (retryCount < maxRetries) {
      try {
        newFeedback = await prisma.feedback.create({
          data: feedbackData
        })
        break
      } catch (dbError) {
        retryCount++
        console.error(`Database error creating feedback (attempt ${retryCount}):`, dbError)
        
        if (retryCount >= maxRetries) {
          if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database server")) {
            return NextResponse.json({
              error: 'Database connection failed. Please check your database connection and try again.',
              details: 'Unable to connect to database server'
            }, { status: 503 })
          }
          throw dbError
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    return NextResponse.json(newFeedback)
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}