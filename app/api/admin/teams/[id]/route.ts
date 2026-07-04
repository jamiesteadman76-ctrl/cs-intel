import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api'
import { TeamUpdateInput, parseJsonBody, slugify } from '@/lib/adminSchemas'

/**
 * GET /api/admin/teams/[id]
 *   Returns the single team by id. Admin-only.
 */
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
      .from('teams')
      .select(
        'id, name, slug, logo, country, founded_year, website, description, rating, win_rate, recent_form, total_matches, last_match_time, best_map, worst_map, key_player, created_at, updated_at'
      )
      .eq('id', params.id)
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }
    return NextResponse.json({ team: data })
  } catch (error) {
    console.error('[admin/teams/[id] GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/teams/[id]
 *   Partial update — validate against TeamUpdateInput (a `.partial()` of the
 *   create schema). Unknown keys are silently stripped (Zod default), so
 *   callers can safely POST the full row but only the listed fields will
 *   update.
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

    const parsed = await parseJsonBody(request, TeamUpdateInput)
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
    if (data.name !== undefined) updateRow.name = data.name.trim()
    if (data.slug !== undefined) {
      updateRow.slug = data.slug.trim() || slugify(data.name ?? '') || data.slug
    }
    if (data.logo !== undefined) updateRow.logo = data.logo
    if (data.country !== undefined) updateRow.country = data.country
    if (data.founded_year !== undefined) {
      updateRow.founded_year = data.founded_year
    }
    if (data.website !== undefined) updateRow.website = data.website
    if (data.description !== undefined) updateRow.description = data.description
    if (data.rating !== undefined) updateRow.rating = data.rating
    if (data.win_rate !== undefined) updateRow.win_rate = data.win_rate
    if (data.recent_form !== undefined) updateRow.recent_form = data.recent_form

    const { data: updated, error } = await sb
      .from('teams')
      .update(updateRow)
      .eq('id', params.id)
      .select(
        'id, name, slug, logo, country, founded_year, website, rating, win_rate, recent_form, description, updated_at'
      )
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ team: updated })
  } catch (error) {
    console.error('[admin/teams/[id] PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/teams/[id]
 *   Alias of PATCH — both verbs are accepted per the admin route contract.
 */
export const PUT = PATCH

/**
 * DELETE /api/admin/teams/[id]
 *   Hard delete. RLS + the team's FK dependents (matches.team1_id / .team2_id)
 *   are the only safety nets.
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

    const { error } = await sb.from('teams').delete().eq('id', params.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/teams/[id] DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
