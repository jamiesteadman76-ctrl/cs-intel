import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api'
import { MatchCreateInput, parseJsonBody } from '@/lib/adminSchemas'

/**
 * GET /api/admin/matches
 *   Full match list with team + tournament pre-joined for the admin Manage
 *   Matches table.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await sb
      .from('matches')
      .select(
        'id, team1_id, team2_id, tournament_id, match_time, status, result, score1, score2, team1:teams!matches_team1_id_fkey(id, name, slug, logo), team2:teams!matches_team2_id_fkey(id, name, slug, logo), tournament:tournaments!matches_tournament_id_fkey(id, name, slug)'
      )
      .order('match_time', { ascending: false, nullsFirst: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ matches: data ?? [] })
  } catch (err) {
    console.error('[admin/matches GET]', err)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/matches
 *   Validate body against MatchCreateInput (status must be 'upcoming' | 'live').
 *   'completed' is reserved for the resolve RPC; result / score1 / score2
 *   are intentionally not in the schema and stay NULL until resolved.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseJsonBody(request, MatchCreateInput)
    if (!parsed.ok) return parsed.response
    const data = parsed.data

    const insertRow = {
      team1_id: data.team1_id,
      team2_id: data.team2_id,
      tournament_id: data.tournament_id ?? null,
      match_time: data.match_time ?? null,
      status: data.status ?? 'upcoming',
    }
    const { data: created, error } = await sb
      .from('matches')
      .insert(insertRow)
      .select(
        'id, team1_id, team2_id, tournament_id, match_time, status, team1:teams!matches_team1_id_fkey(id, name, slug, logo), team2:teams!matches_team2_id_fkey(id, name, slug, logo), tournament:tournaments!matches_tournament_id_fkey(id, name, slug)'
      )
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ match: created }, { status: 201 })
  } catch (err) {
    console.error('[admin/matches POST]', err)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}
