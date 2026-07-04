import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Zod v4 input-validation schemas for the admin CRUD routes.
 *
 * Conventions:
 *  - UUIDs, URLs and ISO datetimes use Zod v4's TOP-LEVEL validators
 *    (`z.uuid()`, `z.url()`, `z.iso.datetime()`). The chained
 *    `.datetime()` / `.email()` methods are deprecated in v4.
 *  - `MatchUpdateInput` uses `z.strictObject()` so unknown keys
 *    (`status`, `result`) produce a clear HTTP 400 instead of being
 *    silently stripped. This complements the SQL-level
 *    `trg_block_unauthorized_match_updates` trigger from migration
 *    20260702000000. Direct edits to status/result MUST go through
 *    `/api/admin/matches/[id]/resolve`.
 *  - `MatchCreateInput` only allows `status` of `'upcoming' | 'live'`.
 *    `'completed'` is reserved for the resolve RPC, which runs as
 *    service_role and is the only authorised writer.
 */

// ---------------------------------------------------------------------------
// Top-level Zod v4 primitives (helpers)
// ---------------------------------------------------------------------------

const uuid = () => z.uuid()
const optUuid = () => uuid().nullable().optional()
// Accept BOTH the offset-bearing form (`2026-07-03T15:00:00Z` or
// `2026-07-03T15:00:00+01:00`) AND the local form (`2026-07-03T15:00`)
// emitted by HTML `<input type="datetime-local">`. Empirical Zod 4.4.3
// behaviour: `z.iso.datetime({ offset: true })` alone REJECTS local form.
const isoDatetime = () =>
  z.union([
    z.iso.datetime({ offset: true }),
    z.iso.datetime({ local: true }),
  ])
const optIsoDatetime = () => isoDatetime().nullable().optional()
const optUrl = () => z.url().nullable().optional()

// ---------------------------------------------------------------------------
// JSON parsing helper shared by every admin route
// ---------------------------------------------------------------------------

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Validation failed', issues },
        { status: 400 }
      ),
    }
  }
  return { ok: true, data: result.data }
}

// ---------------------------------------------------------------------------
// Slug helper (mirrors the formatSlug in lib/api/index.ts — duplicated here
// so the route files don't have to import an internal helper from index.ts).
// ---------------------------------------------------------------------------

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export const TeamCreateInput = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(160).optional(),
  logo: optUrl(),
  country: z.string().min(2).max(80).nullable().optional(),
  founded_year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .nullable()
    .optional(),
  website: optUrl(),
  rating: z.number().int().min(0).max(5000).nullable().optional(),
  win_rate: z.number().min(0).max(100).nullable().optional(),
  recent_form: z
    .union([z.array(z.string()), z.string()])
    .nullable()
    .optional(),
  description: z.string().max(2000).nullable().optional(),
})

export const TeamUpdateInput = TeamCreateInput.partial()

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------

export const TournamentCreateInput = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  prize_pool: z.string().max(80).nullable().optional(),
  start_date: optIsoDatetime(),
  end_date: optIsoDatetime(),
  organizer: z.string().max(120).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  status: z.enum(['upcoming', 'live', 'completed']).default('upcoming'),
  featured: z.boolean().default(false),
  logo: optUrl(),
  match_count: z.number().int().min(0).nullable().optional(),
  team_count: z.number().int().min(0).nullable().optional(),
})

export const TournamentUpdateInput = TournamentCreateInput.partial()

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

/**
 * Create: status is enum(['upcoming', 'live']) ONLY — `completed` is reserved
 * for the resolve RPC. team1_id and team2_id must differ.
 */
export const MatchCreateInput = z
  .object({
    team1_id: uuid(),
    team2_id: uuid(),
    tournament_id: optUuid(),
    match_time: optIsoDatetime(),
    status: z.enum(['upcoming', 'live']).default('upcoming'),
  })
  .refine(d => d.team1_id !== d.team2_id, {
    message: 'team1_id and team2_id must be different teams',
    path: ['team2_id'],
  })

/**
 * Update: z.strictObject() — UNKNOWN KEYS (including 'status' and 'result')
 * are REJECTED with a 400. This makes silent abuse impossible and produces
 * a clear error message pointing developers at the resolve flow.
 *
 * Defence-in-depth: the SQL `trg_block_unauthorized_match_updates` trigger
 * from migration 20260702000000_critical_fixes_and_cron.sql ALSO blocks
 * direct status/result writes outside the RPC, so even if validation is
 * bypassed, the database rejects the write.
 */
export const MatchUpdateInput = z
  .strictObject({
    team1_id: uuid().optional(),
    team2_id: uuid().optional(),
    tournament_id: optUuid(),
    match_time: optIsoDatetime(),
  })
  .refine(
    d => !d.team1_id || !d.team2_id || d.team1_id !== d.team2_id,
    {
      message: 'team1_id and team2_id must be different teams',
      path: ['team2_id'],
    }
  )

// ---------------------------------------------------------------------------
// Inferred TS types — single source of truth for client + server
// ---------------------------------------------------------------------------

export type TeamCreate = z.infer<typeof TeamCreateInput>
export type TeamUpdate = z.infer<typeof TeamUpdateInput>
export type TournamentCreate = z.infer<typeof TournamentCreateInput>
export type TournamentUpdate = z.infer<typeof TournamentUpdateInput>
export type MatchCreate = z.infer<typeof MatchCreateInput>
export type MatchUpdate = z.infer<typeof MatchUpdateInput>
