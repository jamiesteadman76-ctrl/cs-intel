import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { getTeams, getTournaments, requireAdmin } from '@/lib/api'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [teams, tournaments] = await Promise.all([getTeams(sb), getTournaments(sb)])
    return NextResponse.json({ teams, tournaments })
  } catch (error) {
    console.error('[admin/options GET]', error)
    return NextResponse.json({ teams: [], tournaments: [] }, { status: 500 })
  }
}
