import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request, { params }) {
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

    const { id } = await params

    // Delete feedback (only if it belongs to the user)
    const deletedFeedback = await prisma.feedback.deleteMany({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (deletedFeedback.count === 0) {
      return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Feedback deleted successfully' })
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
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

    const { id } = await params
    const body = await request.json()
    const { content, source, category, sentimentScore, sentimentLabel, topics, feedbackDate } = body

    // Update feedback (only if it belongs to the user)
    const updatedFeedback = await prisma.feedback.updateMany({
      where: {
        id: id,
        userId: user.id
      },
      data: {
        content,
        source,
        category,
        sentimentScore,
        sentimentLabel,
        topics,
        feedbackDate: feedbackDate ? new Date(feedbackDate) : undefined
      }
    })

    if (updatedFeedback.count === 0) {
      return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 })
    }

    // Fetch and return the updated feedback
    const result = await prisma.feedback.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}