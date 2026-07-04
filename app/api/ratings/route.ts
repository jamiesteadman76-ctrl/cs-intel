import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { getTeamRatings } = await import('@/lib/api')

    const result = await getTeamRatings(sb)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const teamId = body.teamId as string | undefined

    if (!teamId) {
      return NextResponse.json({ error: 'teamId required' }, { status: 400 })
    }

    const { getRatingsForTeam } = await import('@/lib/api')
    const rating = await getRatingsForTeam(sb, teamId)

    if (!rating) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json(rating)
  } catch (error) {
    console.error('Error fetching team rating:', error)
    return NextResponse.json({ error: 'Failed to fetch team rating' }, { status: 500 })
  }
}
