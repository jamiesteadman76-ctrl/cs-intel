import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { getAdminDashboardStats, requireAdmin } from '@/lib/api'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized, userId } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getAdminDashboardStats(sb)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[admin/stats GET]', error)
    return NextResponse.json(
      {
        totalUsers: 0,
        totalMatches: 0,
        totalPredictions: 0,
        totalCompletedMatches: 0,
        totalLiveMatches: 0,
        totalUpcomingMatches: 0,
        topPredictor: null,
        latestUsers: [],
      },
      { status: 500 }
    )
  }
}