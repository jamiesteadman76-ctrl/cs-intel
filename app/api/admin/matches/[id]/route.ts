import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api'
import { MatchUpdateInput, parseJsonBody } from '@/lib/adminSchemas'

/**
 * GET /api/admin/matches/[id]
 *   Returns a single match (with team + tournament pre-joined).
 */
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        'id, team1_id, team2_id, tournament_id, match_time, status, result, score1, score2, created_at, updated_at, team1:teams!matches_team1_id_fkey(id, name, slug, logo), team2:teams!matches_team2_id_fkey(id, name, slug, logo), tournament:tournaments!matches_tournament_id_fkey(id, name, slug)'
      )
      .eq('id', params.id)
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return NextResponse.json({ match: data })
  } catch (err) {
    console.error('[admin/matches/[id] GET]', err)
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/matches/[id]
 *   Partial update for scheduling fields only. MatchUpdateInput is
 *   `z.strictObject()` so unknown keys (`status`, `result`, `score1`,
 *   `score2`) are REJECTED with HTTP 400 — they MUST go through the
 *   service-role `/api/admin/matches/[id]/resolve` route, which is the
 *   only flow that may write `status='completed'` and the result/score
 *   columns.
 *
 *   `trg_block_unauthorized_match_updates` from migration
 *   20260702000000_critical_fixes_and_cron.sql provides database-level
 *   defence-in-depth: even if a future code change dropped validation,
 *   the trigger would still abort the write + write to `audit_log` AND
 *   raise an exception (HTTP 500).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseJsonBody(request, MatchUpdateInput)
    if (!parsed.ok) return parsed.response
    const data = parsed.data

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updateRow: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (data.team1_id !== undefined) updateRow.team1_id = data.team1_id
    if (data.team2_id !== undefined) updateRow.team2_id = data.team2_id
    if (data.tournament_id !== undefined) {
      updateRow.tournament_id = data.tournament_id
    }
    if (data.match_time !== undefined) updateRow.match_time = data.match_time

    const { data: updated, error } = await sb
      .from('matches')
      .update(updateRow)
      .eq('id', params.id)
      .select(
        'id, team1_id, team2_id, tournament_id, match_time, status, created_at, updated_at, team1:teams!matches_team1_id_fkey(id, name, slug, logo), team2:teams!matches_team2_id_fkey(id, name, slug, logo), tournament:tournaments!matches_tournament_id_fkey(id, name, slug)'
      )
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ match: updated })
  } catch (err) {
    console.error('[admin/matches/[id] PATCH]', err)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/matches/[id]
 *   Hard delete. Predictions FK uses ON DELETE CASCADE so they're cleaned up
 *   automatically; scoring_events rows are also deleted via cascade.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await sb.from('matches').delete().eq('id', params.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/matches/[id] DELETE]', err)
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    )
  }
}
