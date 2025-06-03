import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { reanalyzeFeedback } from '@/lib/sentimentAnalysis'

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

    // Parse request body for query parameters
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
      // Continue with empty body for backward compatibility
    }

    const {
      categories = [],
      sources = [],
      dateFrom = null,
      dateTo = null,
      batchSize = 10
    } = body

    // Build where clause based on filters
    const whereClause = {
      userId: user.id
    }

    if (categories.length > 0) {
      whereClause.category = { in: categories }
    }

    if (sources.length > 0) {
      whereClause.source = { in: sources }
    }

    if (dateFrom || dateTo) {
      whereClause.feedbackDate = {}
      if (dateFrom) whereClause.feedbackDate.gte = new Date(dateFrom)
      if (dateTo) whereClause.feedbackDate.lte = new Date(dateTo)
    }

    // Get filtered feedback for this user
    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Re-analyzing ${feedback.length} feedback entries with AI categorization...`)

    if (feedback.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No feedback found matching the specified criteria'
      })
    }

    // Process in batches to avoid overwhelming the AI service
    const results = {
      total: feedback.length,
      processed: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < feedback.length; i += batchSize) {
      const batch = feedback.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (f) => {
        try {
          // Get existing classification history
          const existingHistory = Array.isArray(f.classificationHistory)
            ? f.classificationHistory
            : []

          // Re-analyze with AI
          const analysis = await reanalyzeFeedback(f.content, existingHistory)
          
          // Update feedback with new AI analysis
          const updatedFeedback = await prisma.feedback.update({
            where: { id: f.id },
            data: {
              category: analysis.aiCategory,
              sentimentScore: analysis.sentimentScore,
              sentimentLabel: analysis.sentimentLabel,
              topics: analysis.topics,
              aiCategoryConfidence: analysis.aiCategoryConfidence,
              aiClassificationMeta: analysis.classificationMeta,
              classificationHistory: analysis.classificationHistory,
              manualOverride: false // Reset manual override since we're re-analyzing
            }
          })

          results.processed++
          return updatedFeedback
        } catch (analysisError) {
          console.error(`Failed to re-analyze feedback ${f.id}:`, analysisError)
          results.failed++
          results.errors.push({
            feedbackId: f.id,
            error: analysisError.message
          })
          return null
        }
      })

      // Wait for batch to complete before processing next batch
      await Promise.all(batchPromises)
      
      // Add small delay between batches to be respectful to AI service
      if (i + batchSize < feedback.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`Re-analysis complete: ${results.processed} processed, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      ...results,
      message: `Successfully re-analyzed ${results.processed}/${results.total} feedback entries`
    })

  } catch (error) {
    console.error('Error re-analyzing feedback:', error)
    return NextResponse.json({
      error: 'Failed to re-analyze feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}