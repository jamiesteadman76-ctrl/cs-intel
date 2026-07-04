import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * Vercel Cron endpoint — integrity verifier.
 *
 * Schedule is configured in `vercel.json` at the project root:
 *   crons[0].path    = /api/cron/verify-integrity
 *   crons[0].schedule = every 6 hours on the hour (cron expression listed in vercel.json)
 *
 * Required Vercel environment variables:
 *   CRON_SECRET                 arbitrary long string (Vercel cron sends `Authorization: Bearer ${CRON_SECRET}`)
 *   SUPABASE_SERVICE_ROLE_KEY   service-role key (NEVER prefix with NEXT_PUBLIC_)
 *   NEXT_PUBLIC_SUPABASE_URL    already wired into @/lib/supabase
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  already wired
 *
 * Behavior:
 *   - 401 if `Authorization` header is missing or does not match CRON_SECRET.
 *   - Calls verify_leaderboard_integrity() RPC via service_role client.
 *   - If the RPC returns one or more divergent rows, inserts a system_alerts
 *     row with severity='critical' capturing the worst mismatch.
 *   - Always returns JSON with `mismatch_count`, `alerts_inserted`, and a
 *     short sample of mismatched users.
 *
 * Server-only module: createSupabaseAdmin throws if the service-role key is
 * missing or accidentally NEXT_PUBLIC_-prefixed.
 */

// Force this route to be evaluated dynamically — never prerendered at build
// time (it must reach the live Supabase on every cron invocation).
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface IntegrityRow {
  user_id: string
  username: string
  stored_intel_score: number
  derived_intel_score: number
  delta_mismatch: number
  event_count: number
  last_event_at: string | null
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false // fail closed if env var is missing

  const header = req.headers.get('Authorization') ?? req.headers.get('authorization')
  if (!header) return false

  // Vercel cron sends `Authorization: Bearer <secret>`
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  return token === expected
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  // Outer try/catch: each step below already returns a structured 500, but
  // any unexpected throw (TypeError on a malformed row, JSON-parse error,
  // surprise network failure, etc.) lands here so the cron run produces a
  // JSON envelope instead of an HTML error page.
  try {
  let supabase
  try {
    supabase = createSupabaseAdmin()
  } catch (err) {
    return NextResponse.json(
      { error: 'service_role_unconfigured', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }

  // Run the integrity RPC.
  const { data, error } = await supabase.rpc('verify_leaderboard_integrity')
  if (error) {
    return NextResponse.json(
      { error: 'rpc_failed', detail: error.message },
      { status: 500 }
    )
  }

  const mismatches = (data ?? []) as IntegrityRow[]
  const mismatchCount = mismatches.length

  let alertsInserted = 0
  if (mismatchCount > 0) {
    // Capture the largest mismatch for the alert payload.
    const top = mismatches.slice().sort((a, b) => Math.abs(b.delta_mismatch) - Math.abs(a.delta_mismatch))[0]
    const { error: insertError } = await supabase.from('system_alerts').insert({
      severity: 'critical',
      message: `Leaderboard integrity violation: ${mismatchCount} user(s) drifted; top user '${top.username}' mismatch=${top.delta_mismatch}`,
      resolved: false,
    })
    if (!insertError) {
      alertsInserted = 1
    } else {
      // Don't fail the cron over a slipped alert write — surface it.
      return NextResponse.json(
        {
          error: 'alert_insert_failed',
          detail: insertError.message,
          mismatch_count: mismatchCount,
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    {
      success: true,
      checked_at: new Date().toISOString(),
      mismatch_count: mismatchCount,
      alerts_inserted: alertsInserted,
      sample: mismatches.slice(0, 5).map(m => ({
        user_id: m.user_id,
        username: m.username,
        delta_mismatch: m.delta_mismatch,
      })),
    },
    { status: 200 }
  )
  } catch (err) {
    return NextResponse.json(
      {
        error: 'unexpected_error',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

// POST is a no-op alias so manual invocations from `curl -X POST` (or future
// non-Vercel cron adapters) behave the same way.
export async function POST(request: NextRequest) {
  return GET(request)
}
