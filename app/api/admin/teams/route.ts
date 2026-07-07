import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api'
import { TeamCreateInput, parseJsonBody, slugify } from '@/lib/adminSchemas'

/**
 * GET /api/admin/teams
 *   Returns the full team list. Admin-only.
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
      .from('teams')
      .select(
        'id, name, slug, logo, country, founded_year, website, description, rating, win_rate, recent_form, total_matches, last_match_time, best_map, worst_map, key_player, created_at, updated_at'
      )
      .order('name', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ teams: data ?? [] })
  } catch (error) {
    console.error('[admin/teams GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/teams
 *   Validate body against TeamCreateInput, then insert via the cookie-bound
 *   service-role-respecting client (admin RLS allows the write). Slug is
 *   derived from `name` if the caller omits it.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseJsonBody(request, TeamCreateInput)
    if (!parsed.ok) return parsed.response
    const data = parsed.data

    const now = new Date().toISOString()
    const insertRow = {
      name: data.name.trim(),
      slug: (data.slug?.trim()) || slugify(data.name),
      logo: data.logo ?? null,
      country: data.country ?? null,
      founded_year: data.founded_year ?? null,
      website: data.website ?? null,
      description: data.description ?? null,
      rating: data.rating ?? 2000,
      win_rate: data.win_rate ?? 50,
      recent_form: data.recent_form ?? 'LLLLL',
      last_match_time: null,
      total_matches: 0,
      created_at: now,
      updated_at: now,
    }
    const { data: created, error } = await sb
      .from('teams')
      .insert(insertRow)
      .select(
        'id, name, slug, logo, country, founded_year, website, rating, win_rate, recent_form, description, created_at'
      )
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ team: created }, { status: 201 })
  } catch (error) {
    console.error('[admin/teams POST]', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
