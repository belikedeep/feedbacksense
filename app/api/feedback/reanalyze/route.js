import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { prisma } from '@/lib/prisma'
import { analyzeSentiment } from '@/lib/sentimentAnalysis'

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

    // Get all feedback for this user
    const feedback = await prisma.feedback.findMany({
      where: { userId: user.id }
    })

    console.log(`Re-analyzing ${feedback.length} feedback entries...`)

    // Re-analyze each feedback
    const updatePromises = feedback.map(async (f) => {
      const analysis = await analyzeSentiment(f.content)
      
      return prisma.feedback.update({
        where: { id: f.id },
        data: {
          sentimentScore: analysis.score,
          sentimentLabel: analysis.label,
          topics: analysis.topics
        }
      })
    })

    await Promise.all(updatePromises)

    console.log(`Successfully re-analyzed ${feedback.length} feedback entries`)

    return NextResponse.json({ 
      success: true, 
      count: feedback.length,
      message: `Successfully re-analyzed ${feedback.length} feedback entries`
    })

  } catch (error) {
    console.error('Error re-analyzing feedback:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}