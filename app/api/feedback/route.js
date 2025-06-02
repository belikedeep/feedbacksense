import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

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

    // Get feedback for the authenticated user
    const feedback = await prisma.feedback.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
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

    const body = await request.json()
    const { content, source, category, sentimentScore, sentimentLabel, topics, feedbackDate } = body

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

    // Create new feedback
    const newFeedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        content,
        source: source || 'manual',
        category: category || 'general',
        sentimentScore: sentimentScore || 0.5,
        sentimentLabel: sentimentLabel || 'neutral',
        topics: topics || [],
        feedbackDate: feedbackDate ? new Date(feedbackDate) : new Date()
      }
    })

    return NextResponse.json(newFeedback)
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}