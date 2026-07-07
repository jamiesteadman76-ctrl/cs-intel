import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api'
import {
  TournamentCreateInput,
  parseJsonBody,
  slugify,
} from '@/lib/adminSchemas'

/**
 * GET /api/admin/tournaments
 *   Returns full tournament list. Admin-only.
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
      .from('tournaments')
      .select(
        'id, name, slug, description, prize_pool, start_date, end_date, organizer, location, country, status, featured, logo, match_count, team_count, created_at, updated_at'
      )
      .order('start_date', { ascending: false, nullsFirst: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ tournaments: data ?? [] })
  } catch (err) {
    console.error('[admin/tournaments GET]', err)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/tournaments
 *   Validate body against TournamentCreateInput, then insert.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseJsonBody(request, TournamentCreateInput)
    if (!parsed.ok) return parsed.response
    const data = parsed.data

    const now = new Date().toISOString()
    const insertRow = {
      name: data.name.trim(),
      slug: (data.slug?.trim()) || slugify(data.name),
      description: data.description ?? null,
      prize_pool: data.prize_pool ?? null,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      organizer: data.organizer ?? null,
      location: data.location ?? null,
      country: data.country ?? null,
      status: data.status ?? 'upcoming',
      featured: data.featured ?? false,
      logo: data.logo ?? null,
      match_count: data.match_count ?? 0,
      team_count: data.team_count ?? 0,
      created_at: now,
      updated_at: now,
    }
    const { data: created, error } = await sb
      .from('tournaments')
      .insert(insertRow)
      .select(
        'id, name, slug, description, prize_pool, start_date, end_date, organizer, location, country, status, featured, logo, match_count, team_count, created_at'
      )
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ tournament: created }, { status: 201 })
  } catch (err) {
    console.error('[admin/tournaments POST]', err)
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}
