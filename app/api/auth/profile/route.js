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

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    if (existingProfile) {
      return NextResponse.json(existingProfile)
    }

    // Create new profile
    const newProfile = await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email
      }
    })

    return NextResponse.json(newProfile)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}