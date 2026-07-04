import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api'
import { TournamentUpdateInput, parseJsonBody, slugify } from '@/lib/adminSchemas'

/**
 * GET /api/admin/tournaments/[id]
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
      .from('tournaments')
      .select(
        'id, name, slug, description, prize_pool, start_date, end_date, organizer, location, country, status, featured, logo, match_count, team_count, created_at, updated_at'
      )
      .eq('id', params.id)
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ tournament: data })
  } catch (err) {
    console.error('[admin/tournaments/[id] GET]', err)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/tournaments/[id]
 *   Partial update — validate against TournamentUpdateInput (a `.partial()`
 *   of the create schema). Unknown keys are silently dropped.
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

    const parsed = await parseJsonBody(request, TournamentUpdateInput)
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
    if (data.description !== undefined) {
      updateRow.description = data.description
    }
    if (data.prize_pool !== undefined) updateRow.prize_pool = data.prize_pool
    if (data.start_date !== undefined) updateRow.start_date = data.start_date
    if (data.end_date !== undefined) updateRow.end_date = data.end_date
    if (data.organizer !== undefined) updateRow.organizer = data.organizer
    if (data.location !== undefined) updateRow.location = data.location
    if (data.country !== undefined) updateRow.country = data.country
    if (data.status !== undefined) updateRow.status = data.status
    if (data.featured !== undefined) updateRow.featured = data.featured
    if (data.logo !== undefined) updateRow.logo = data.logo
    if (data.match_count !== undefined) updateRow.match_count = data.match_count
    if (data.team_count !== undefined) updateRow.team_count = data.team_count

    const { data: updated, error } = await sb
      .from('tournaments')
      .update(updateRow)
      .eq('id', params.id)
      .select(
        'id, name, slug, description, prize_pool, start_date, end_date, organizer, location, country, status, featured, logo, match_count, team_count, updated_at'
      )
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ tournament: updated })
  } catch (err) {
    console.error('[admin/tournaments/[id] PATCH]', err)
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/tournaments/[id]
 *   Alias of PATCH — both verbs are accepted per the admin route contract.
 */
export const PUT = PATCH

/**
 * DELETE /api/admin/tournaments/[id]
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

    const { error } = await sb.from('tournaments').delete().eq('id', params.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/tournaments/[id] DELETE]', err)
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    )
  }
}

