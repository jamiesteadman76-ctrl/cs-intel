import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase'
import { resolveMatchAndUpdateScores, getMatchPredictionStats, requireAdmin } from '@/lib/api'

/**
 * Resolve (or correct the resolution of) a match.
 *
 * Path:
 *   1. Verify the caller is an authenticated admin (cookie-bound client).
 *   2. Switch to the service_role client for the actual RPC call — the
 *      evaluate_match_predictions EXECUTE permission is restricted to
 *      service_role by migration 20260702000000. The cookie-bound client's
 *      JWT carries the authenticated role, which would 401 the RPC.
 *   3. Hand back the response summary to the admin UI.
 */
export const dynamic = 'force-dynamic'

export async function POST(
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

    let admin
    try {
      admin = createSupabaseAdmin()
    } catch (err) {
      console.error('[admin/matches/[id]/resolve POST] missing service_role key', err)
      return NextResponse.json(
        {
          error:
            'service_role_unconfigured',
          detail:
            'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to Vercel environment variables.',
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const result = await resolveMatchAndUpdateScores(admin, params.id, body.result)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const stats = await getMatchPredictionStats(admin, params.id)

    return NextResponse.json({
      summary: {
        predictionsResolved: result.updatedPredictions || 0,

        correctPredictions: result.correctPredictions || 0,
        incorrectPredictions: result.incorrectPredictions || 0,
      },
      predictionStats: stats,
    })
  } catch (error) {
    console.error('[admin/matches/[id]/resolve POST]', error)
    return NextResponse.json(
      { error: 'Failed to resolve match' },
      { status: 500 }
    )
  }
}

