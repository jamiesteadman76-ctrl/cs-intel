import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { getMatchPredictionStats, requireAdmin } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getMatchPredictionStats(params.id)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[admin/matches/[id]/prediction-stats GET]', error)
    return NextResponse.json(
      {
        totalPredictions: 0,
        resolvedPredictions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
      },
      { status: 500 }
    )
  }
}