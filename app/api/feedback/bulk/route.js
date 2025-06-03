import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

    const body = await request.json()
    const { feedbacks } = body

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 })
    }

    // Ensure user profile exists with retry logic
    let existingProfile
    try {
      existingProfile = await prisma.profile.findUnique({
        where: { id: user.id }
      })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({
        error: 'Database connection failed. Please try again in a moment.'
      }, { status: 503 })
    }

    if (!existingProfile) {
      try {
        // Create profile if it doesn't exist
        await prisma.profile.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email
          }
        })
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({
          error: 'Failed to create user profile. Please try again.'
        }, { status: 500 })
      }
    }

    // Prepare feedback data for bulk insert with AI fields
    const feedbackData = feedbacks.map(feedback => ({
      userId: user.id,
      content: feedback.content,
      source: feedback.source || 'csv_import',
      category: feedback.category || 'general_inquiry',
      sentimentScore: feedback.sentimentScore || 0.5,
      sentimentLabel: feedback.sentimentLabel || 'neutral',
      topics: feedback.topics || [],
      feedbackDate: feedback.feedbackDate ? new Date(feedback.feedbackDate) : new Date(),
      // AI categorization fields
      aiCategoryConfidence: feedback.aiCategoryConfidence || null,
      aiClassificationMeta: feedback.aiClassificationMeta || null,
      classificationHistory: feedback.classificationHistory || [],
      manualOverride: feedback.manualOverride || false
    }))

    // Count how many have AI analysis
    const aiAnalyzedCount = feedbacks.filter(f => f.aiCategoryConfidence !== null && f.aiCategoryConfidence !== undefined).length

    // Bulk insert feedback
    const createdFeedbacks = await prisma.feedback.createMany({
      data: feedbackData,
      skipDuplicates: true
    })

    // Fetch the created feedbacks to return them
    const result = await prisma.feedback.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: feedbacks.length
    })

    return NextResponse.json({
      count: createdFeedbacks.count,
      aiAnalyzed: aiAnalyzedCount,
      feedbacks: result
    })
  } catch (error) {
    console.error('Error bulk creating feedback:', error)
    return NextResponse.json({ error: 'Failed to bulk create feedback' }, { status: 500 })
  }
}