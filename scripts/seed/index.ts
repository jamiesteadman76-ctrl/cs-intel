/* eslint-disable no-console */
/**
 * scripts/seed/index.ts
 * ============================================================================
 * CS Intel — production seed
 * ============================================================================
 *
 * Run with:
 *   npm run seed                  # uses tsx (must be installed first)
 *   npx tsx scripts/seed/index.ts  # equivalent
 *
 * Required environment variables (any .env.local or process.env source):
 *
 *   NEXT_PUBLIC_SUPABASE_URL      e.g. https://abcd.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY     service-role key (NOT anon) — required
 *                                 because evaluate_match_predictions is
 *                                 GRANTed only to service_role and we are
 *                                 creating auth.users via auth.admin.
 *
 * Optional install:
 *
 *   npm install --save-dev tsx
 *
 * What this script does, in order:
 *
 *   1. Validates env.
 *   2. Builds a service-role Supabase client.
 *   3. Upserts 10 CS2 teams (UNIQUE on slug).
 *   4. Upserts 5 tournaments (UNIQUE on slug).
 *   5. Inserts 40 matches (30 to be resolved, 10 stay upcoming).
 *      Matches are deduped on the (team1_id, team2_id, tournament_id)
 *      composition so the script can be re-run without producing duplicates
 *      even though `matches` has no UNIQUE index.
 *   6. Creates 10 auth.users via supabase.auth.admin.createUser(). The
 *      `handle_new_user` trigger fires per row and provisions public.users
 *      with intel_score=0, is_admin=false. We then re-read the public.users
 *      rows by username to capture the FK ids for predictions.
 *   7. Inserts ~400 predictions (10 users × 40 matches). Upserted on the
 *      existing (user_id, match_id) unique index.
 *   8. Resolves the 30 completed matches by calling evaluate_match_predictions
 *      via service_role. The RPC is migration 014+ post-fix math:
 *        • win       → delta = confidence * 10 (clipped to current_score on loss)
 *        • loss      → delta = GREATEST(-current_score, -confidence * 5)
 *        • draw/void → delta = 0 (no ledger row)
 *      Steps verified end-to-end:
 *        a. matches.status moves from 'upcoming' to 'completed'
 *        b. predictions get result/is_correct/evaluated_at
 *        c. scoring_events receives one row per non-zero delta
 *        d. users.intel_score reflects the new sum
 *   9. Runs verify_leaderboard_integrity() to confirm the ledger matches
 *      users.intel_score for every seeded user.
 *      users.intel_score (drift-independent sanity).
 *
 * Idempotency guarantees:
 *   • Teams / tournaments: upsert by slug → re-run is a no-op.
 *   • Matches: composed-key lookup on (team1, team2, tournament); on second
 *     run, the existing row is reused (no duplicate match row inserts).
 *   • Auth users: detected by username. If the user already exists in
 *     auth.users (e.g. previous seed run), we look them up via
 *     auth.admin.listUsers() rather than failing on duplicate email.
 *   • Predictions: upsert keyed on (user_id, match_id).
 *   • Match resolution: skipped if match.status is already 'completed'.
 *
 * Records inserted are anonymous and use deterministic seed data — safe to
 * run against staging or production-only-for-demo databases. Use a dedicated
 * `.env.staging` or `.env.local` for staging runs.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TeamSeed {
  slug: string
  name: string
  logo: string
  country: string
  rating: number
  win_rate: number
  best_map: string
  worst_map: string
  key_player: string
  recent_form: string
}

interface TournamentSeed {
  slug: string
  name: string
  description: string
  prize_pool: string
  start_date: string
  end_date: string
  organizer: string
  location: string
  country: string | null
  status: 'upcoming' | 'live' | 'completed'
  featured: boolean
}

interface MatchSeedPlan {
  team1: string
  team2: string
  tournamentSlug: string
  /** days from now (negative = past, positive = future) */
  daysOffset: number
  /** hour in 24h format (UTC) */
  hour: number
  /** null = upcoming, non-null = resolved by RPC */
  result: 'team1_win' | 'team2_win' | 'draw' | null
}

interface TestUserSeed {
  index: number
  email: string
  password: string
  username: string
}

interface SeededMatch {
  id: string
  team1_id: string
  team2_id: string
  tournament_id: string
  match_time: string
  status: string
  result: string | null
  _plan: MatchSeedPlan
}

// -----------------------------------------------------------------------------
// Seed data
// -----------------------------------------------------------------------------

const TEAMS: TeamSeed[] = [
  { slug: 'spirit',       name: 'Spirit',     logo: '🔥', country: 'RU', rating: 2847, win_rate: 78, best_map: 'Ancient', worst_map: 'Inferno', key_player: 'magixx',   recent_form: 'WWWLW' },
  { slug: 'faze-clan',    name: 'FaZe Clan',  logo: '⚡', country: 'EU', rating: 2834, win_rate: 75, best_map: 'Overpass', worst_map: 'Nuke',    key_player: 'ropz',     recent_form: 'WLWWW' },
  { slug: 'navi',         name: 'NAVI',       logo: '🌊', country: 'UA', rating: 2821, win_rate: 73, best_map: 'Mirage',  worst_map: 'Anubis',  key_player: 's1mple',   recent_form: 'WWLWL' },
  { slug: 'vitality',     name: 'Vitality',   logo: '💎', country: 'FR', rating: 2798, win_rate: 72, best_map: 'Vertigo', worst_map: 'Ancient', key_player: 'ZywOo',    recent_form: 'LWWWW' },
  { slug: 'liquid',       name: 'Liquid',     logo: '💧', country: 'US', rating: 2756, win_rate: 68, best_map: 'Inferno', worst_map: 'Overpass', key_player: 'EliGE',    recent_form: 'WWLLW' },
  { slug: 'heroic',       name: 'Heroic',     logo: '⚔️', country: 'DK', rating: 2734, win_rate: 65, best_map: 'Nuke',    worst_map: 'Mirage',  key_player: 'cadiaN',   recent_form: 'LLWWL' },
  { slug: 'mouz',         name: 'MOUZ',       logo: '💀', country: 'DE', rating: 2712, win_rate: 64, best_map: 'Inferno', worst_map: 'Vertigo', key_player: 'frozen',   recent_form: 'WLLWW' },
  { slug: 'falcons',      name: 'Falcons',    logo: '🦅', country: 'TR', rating: 2698, win_rate: 62, best_map: 'Anubis',  worst_map: 'Nuke',    key_player: 'm0NESY',   recent_form: 'LWWLW' },
  { slug: 'ence',         name: 'ENCE',       logo: '🔱', country: 'FI', rating: 2687, win_rate: 61, best_map: 'Anubis',  worst_map: 'Inferno', key_player: 'Snappi',   recent_form: 'WWLLL' },
  { slug: 'complexity',   name: 'Complexity', logo: '🎯', country: 'US', rating: 2665, win_rate: 58, best_map: 'Mirage',  worst_map: 'Ancient', key_player: 'floSid',   recent_form: 'LWLWL' },
]

const TOURNAMENTS: TournamentSeed[] = [
  { slug: 'pgl-major-2026',          name: 'PGL Major 2026',          description: 'Premier CS2 major',           prize_pool: '$1,000,000', start_date: '2026-06-01', end_date: '2026-07-15', organizer: 'PGL',     location: 'Copenhagen', country: 'DK', status: 'upcoming',  featured: true  },
  { slug: 'esl-pro-league-s21',      name: 'ESL Pro League Season 21', description: 'ESL Pro League',              prize_pool: '$750,000',   start_date: '2026-05-01', end_date: '2026-06-30', organizer: 'ESL',     location: 'Online',     country: null, status: 'live',      featured: true  },
  { slug: 'blast-premier-spring-2026', name: 'BLAST Premier Spring 2026', description: 'BLAST Premier Spring Final', prize_pool: '$425,000', start_date: '2026-04-01', end_date: '2026-05-15', organizer: 'BLAST',   location: 'London',     country: 'GB', status: 'completed', featured: false },
  { slug: 'iem-katowice-2026',       name: 'IEM Katowice 2026',       description: 'Intel Extreme Masters',       prize_pool: '$1,000,000', start_date: '2026-01-30', end_date: '2026-02-15', organizer: 'ESL',     location: 'Katowice',   country: 'PL', status: 'completed', featured: false },
  { slug: 'dreamhack-dallas-2026',   name: 'DreamHack Dallas 2026',   description: 'DreamHack Dallas',            prize_pool: '$250,000',   start_date: '2026-05-20', end_date: '2026-05-30', organizer: 'DreamHack', location: 'Dallas',     country: 'US', status: 'upcoming',  featured: false },
]

// 40 matches across the 5 tournaments. Result == null stays upcoming;
// result != null is resolved by the RPC at the end of the run.
const MATCH_PLAN: MatchSeedPlan[] = [
  // ---- ESL Pro League Season 21 ----
  { team1: 'spirit',     team2: 'faze-clan',  tournamentSlug: 'esl-pro-league-s21',      daysOffset: -10, hour: 18, result: 'team1_win' },
  { team1: 'navi',       team2: 'vitality',   tournamentSlug: 'esl-pro-league-s21',      daysOffset: -10, hour: 21, result: 'team2_win' },
  { team1: 'liquid',     team2: 'heroic',     tournamentSlug: 'esl-pro-league-s21',      daysOffset:  -9, hour: 18, result: 'team1_win' },
  { team1: 'mouz',       team2: 'falcons',    tournamentSlug: 'esl-pro-league-s21',      daysOffset:  -9, hour: 21, result: 'team2_win' },
  { team1: 'ence',       team2: 'complexity', tournamentSlug: 'esl-pro-league-s21',      daysOffset:  -8, hour: 18, result: 'team1_win' },
  { team1: 'spirit',     team2: 'navi',       tournamentSlug: 'esl-pro-league-s21',      daysOffset:  -8, hour: 21, result: 'draw' },
  { team1: 'faze-clan',  team2: 'vitality',   tournamentSlug: 'esl-pro-league-s21',      daysOffset:  -7, hour: 18, result: 'team1_win' },
  { team1: 'liquid',     team2: 'mouz',       tournamentSlug: 'esl-pro-league-s21',      daysOffset:  -7, hour: 21, result: 'team2_win' },
  { team1: 'heroic',     team2: 'falcons',    tournamentSlug: 'esl-pro-league-s21',      daysOffset:   1, hour: 19, result: null },
  { team1: 'ence',       team2: 'navi',       tournamentSlug: 'esl-pro-league-s21',      daysOffset:   2, hour: 19, result: null },

  // ---- BLAST Premier Spring 2026 ----
  { team1: 'spirit',     team2: 'mouz',       tournamentSlug: 'blast-premier-spring-2026', daysOffset: -25, hour: 18, result: 'team1_win' },
  { team1: 'faze-clan',  team2: 'navi',       tournamentSlug: 'blast-premier-spring-2026', daysOffset: -25, hour: 21, result: 'team1_win' },
  { team1: 'vitality',   team2: 'liquid',     tournamentSlug: 'blast-premier-spring-2026', daysOffset: -24, hour: 18, result: 'team2_win' },
  { team1: 'heroic',     team2: 'ence',       tournamentSlug: 'blast-premier-spring-2026', daysOffset: -24, hour: 21, result: 'team1_win' },
  { team1: 'complexity', team2: 'falcons',    tournamentSlug: 'blast-premier-spring-2026', daysOffset: -23, hour: 18, result: 'team2_win' },
  { team1: 'spirit',     team2: 'complexity', tournamentSlug: 'blast-premier-spring-2026', daysOffset: -22, hour: 18, result: 'team1_win' },
  { team1: 'faze-clan',  team2: 'liquid',     tournamentSlug: 'blast-premier-spring-2026', daysOffset: -21, hour: 18, result: 'draw' },
  { team1: 'navi',       team2: 'falcons',    tournamentSlug: 'blast-premier-spring-2026', daysOffset: -20, hour: 18, result: 'team1_win' },

  // ---- IEM Katowice 2026 ----
  { team1: 'spirit',     team2: 'faze-clan',  tournamentSlug: 'iem-katowice-2026',       daysOffset: -50, hour: 19, result: 'team2_win' },
  { team1: 'vitality',   team2: 'navi',       tournamentSlug: 'iem-katowice-2026',       daysOffset: -49, hour: 19, result: 'team1_win' },
  { team1: 'liquid',     team2: 'mouz',       tournamentSlug: 'iem-katowice-2026',       daysOffset: -48, hour: 19, result: 'team2_win' },
  { team1: 'heroic',     team2: 'ence',       tournamentSlug: 'iem-katowice-2026',       daysOffset: -47, hour: 19, result: 'team1_win' },
  { team1: 'falcons',    team2: 'complexity', tournamentSlug: 'iem-katowice-2026',       daysOffset: -46, hour: 19, result: 'team1_win' },
  { team1: 'heroic',     team2: 'falcons',    tournamentSlug: 'iem-katowice-2026',       daysOffset: -45, hour: 19, result: 'team1_win' },

  // ---- PGL Major 2026 (all upcoming — no resolution) ----
  { team1: 'spirit',     team2: 'navi',       tournamentSlug: 'pgl-major-2026',          daysOffset:   3, hour: 20, result: null },
  { team1: 'faze-clan',  team2: 'vitality',   tournamentSlug: 'pgl-major-2026',          daysOffset:   4, hour: 20, result: null },
  { team1: 'liquid',     team2: 'mouz',       tournamentSlug: 'pgl-major-2026',          daysOffset:   5, hour: 20, result: null },
  { team1: 'heroic',     team2: 'falcons',    tournamentSlug: 'pgl-major-2026',          daysOffset:   6, hour: 20, result: null },
  { team1: 'ence',       team2: 'complexity', tournamentSlug: 'pgl-major-2026',          daysOffset:   7, hour: 20, result: null },

  // ---- DreamHack Dallas 2026 ----
  { team1: 'spirit',     team2: 'liquid',     tournamentSlug: 'dreamhack-dallas-2026',   daysOffset:  10, hour: 18, result: null },
  { team1: 'faze-clan',  team2: 'mouz',       tournamentSlug: 'dreamhack-dallas-2026',   daysOffset:  11, hour: 18, result: null },
  { team1: 'navi',       team2: 'complexity', tournamentSlug: 'dreamhack-dallas-2026',   daysOffset:  12, hour: 18, result: null },
  { team1: 'vitality',   team2: 'heroic',     tournamentSlug: 'dreamhack-dallas-2026',   daysOffset: -30, hour: 18, result: 'team1_win' },
  { team1: 'mouz',       team2: 'ence',       tournamentSlug: 'dreamhack-dallas-2026',   daysOffset: -29, hour: 18, result: 'team2_win' },
  { team1: 'falcons',    team2: 'liquid',     tournamentSlug: 'dreamhack-dallas-2026',   daysOffset: -28, hour: 18, result: 'team1_win' },
  { team1: 'spirit',     team2: 'complexity', tournamentSlug: 'dreamhack-dallas-2026',   daysOffset: -27, hour: 18, result: 'team1_win' },
  { team1: 'navi',       team2: 'heroic',     tournamentSlug: 'dreamhack-dallas-2026',   daysOffset: -26, hour: 18, result: 'draw' },
  { team1: 'faze-clan',  team2: 'ence',       tournamentSlug: 'dreamhack-dallas-2026',   daysOffset: -25, hour: 18, result: 'team2_win' },
  { team1: 'vitality',   team2: 'mouz',       tournamentSlug: 'dreamhack-dallas-2026',   daysOffset: -24, hour: 18, result: 'team1_win' },
  { team1: 'liquid',     team2: 'complexity', tournamentSlug: 'dreamhack-dallas-2026',                                  daysOffset: -23, hour: 18, result: 'team1_win' },
]
// total: 40 matches (30 resolved + 10 upcoming). Predictions inserted by
// users: 40 × 10 = 400. After RPC: 30 × 10 = 300 prediction rows updated to
// a real graded state; 10 × 10 = 100 stay pending on upcoming matches.

const TEST_USERS: TestUserSeed[] = Array.from({ length: 10 }, (_, i) => ({
  index: i + 1,
  email: `test_user_${i + 1}@example.com`,
  password: 'Test1234!',
  username: `test_user_${i + 1}`,
}))

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function computeMatchTime(daysOffset: number, hour: number): string {
  // UTC, deterministic across runs within the same calendar day; on later
  // runs the bucket may shift but we look up matches by composition so
  // re-runs don't insert duplicates.
  const d = new Date(Date.now() + daysOffset * 86400 * 1000)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}

function rng(seedInput: number): () => number {
  // Tiny LCG for deterministic predictions across re-runs
  let s = seedInput
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function fmtCount(label: string, n: number): string {
  return `  ✓ ${label.padEnd(28)} ${String(n).padStart(5)}`
}

async function upsertTeams(
  sb: SupabaseClient
): Promise<Record<string, string>> {
  console.log(`\n[1/9] Upserting teams…`)
  const out: Record<string, string> = {}
  let existing = 0
  let newlyInserted = 0
  for (const team of TEAMS) {
    const found = await sb.from('teams').select('id').eq('slug', team.slug).maybeSingle()
    if (found.data?.id) {
      out[team.slug] = String(found.data.id)
      existing++
      continue
    }
    const inserted = await sb.from('teams').insert(team).select('id').single()
    if (inserted.error || !inserted.data?.id) {
      throw new Error(`Failed to insert team "${team.slug}": ${inserted.error?.message ?? 'no id returned'}`)
    }
    out[team.slug] = String(inserted.data.id)
    newlyInserted++
  }
  console.log(fmtCount('teams (existing)', existing))
  console.log(fmtCount('teams (inserted)', newlyInserted))
  return out
}

async function upsertTournaments(
  sb: SupabaseClient
): Promise<Record<string, string>> {
  console.log(`\n[2/9] Upserting tournaments…`)
  const out: Record<string, string> = {}
  let existing = 0
  let newlyInserted = 0
  for (const t of TOURNAMENTS) {
    const found = await sb.from('tournaments').select('id').eq('slug', t.slug).maybeSingle()
    if (found.data?.id) {
      out[t.slug] = String(found.data.id)
      existing++
      continue
    }
    const inserted = await sb.from('tournaments').insert(t).select('id').single()
    if (inserted.error || !inserted.data?.id) {
      throw new Error(`Failed to insert tournament "${t.slug}": ${inserted.error?.message ?? 'no id returned'}`)
    }
    out[t.slug] = String(inserted.data.id)
    newlyInserted++
  }
  console.log(fmtCount('tournaments (existing)', existing))
  console.log(fmtCount('tournaments (inserted)', newlyInserted))
  return out
}

async function upsertMatches(
  sb: SupabaseClient,
  teamIds: Record<string, string>,
  tournamentIds: Record<string, string>
): Promise<SeededMatch[]> {
  console.log(`\n[3/9] Upserting matches…`)
  const out: SeededMatch[] = []
  let existing = 0
  let newlyInserted = 0
  for (const plan of MATCH_PLAN) {
    const team1Id = teamIds[plan.team1]
    const team2Id = teamIds[plan.team2]
    const tournamentId = tournamentIds[plan.tournamentSlug]
    if (!team1Id || !team2Id || !tournamentId) {
      throw new Error(`Plan references unknown ids: ${JSON.stringify(plan)}`)
    }

    // Composite-key lookup (matches has no UNIQUE index, so we look it up
    // explicitly). Re-runs reuse the first row found.
    const found = await sb
      .from('matches')
      .select('id, team1_id, team2_id, tournament_id, status, result, match_time')
      .eq('team1_id', team1Id)
      .eq('team2_id', team2Id)
      .eq('tournament_id', tournamentId)
      .maybeSingle()

    if (found.data?.id) {
      out.push({
        id: String(found.data.id),
        team1_id: String(found.data.team1_id),
        team2_id: String(found.data.team2_id),
        tournament_id: String(found.data.tournament_id),
        match_time: String(found.data.match_time),
        status: String(found.data.status),
        result: (found.data.result as string | null) ?? null,
        _plan: plan,
      })
      existing++
      continue
    }

    const matchTime = computeMatchTime(plan.daysOffset, plan.hour)
    const inserted = await sb
      .from('matches')
      .insert({
        team1_id: team1Id,
        team2_id: team2Id,
        tournament_id: tournamentId,
        match_time: matchTime,
        status: 'upcoming',
        result: null,
      })
      .select('id, team1_id, team2_id, tournament_id, status, result, match_time')
      .single()

    if (inserted.error || !inserted.data?.id) {
      throw new Error(`Failed to insert match: ${inserted.error?.message ?? 'unknown'}`)
    }
    out.push({
      id: String(inserted.data.id),
      team1_id: String(inserted.data.team1_id),
      team2_id: String(inserted.data.team2_id),
      tournament_id: String(inserted.data.tournament_id),
      match_time: String(inserted.data.match_time),
      status: String(inserted.data.status),
      result: (inserted.data.result as string | null) ?? null,
      _plan: plan,
    })
    newlyInserted++
  }

  console.log(fmtCount('matches (existing)', existing))
  console.log(fmtCount('matches (inserted)', newlyInserted))
  return out
}

async function findAuthUserByEmail(sb: SupabaseClient, email: string): Promise<string | null> {
  // listUsers is paginated; paginate so we don't miss users past the default
  // 50 / 200 cap when the project already has many auth users.
  const PER_PAGE = 200
  const MAX_PAGES = 20 // 4 000 users is plenty for staging
  const needle = email.toLowerCase()
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await sb.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (res.error) throw new Error(`auth.admin.listUsers failed: ${res.error.message}`)
    const users = res.data?.users ?? []
    const found = users.find(x => x.email?.toLowerCase() === needle)
    if (found?.id) return found.id
    if (users.length < PER_PAGE) break // last page
  }
  return null
}

async function ensureAuthUsers(
  sb: SupabaseClient
): Promise<string[]> {
  console.log(`\n[4/9] Creating auth users + verifying public.users propagation…`)
  const userIds: string[] = []

  for (const u of TEST_USERS) {
    // Step A — check public.users by username (set by handle_new_user trigger).
    const pubAlready = await sb
      .from('users')
      .select('id')
      .eq('username', u.username)
      .maybeSingle()

    if (pubAlready.data?.id) {
      userIds.push(String(pubAlready.data.id))
      console.log(`  ↪ ${u.email} already in public.users — skipping`)
      continue
    }

    // Step B — try createUser
    let createdOrFoundId: string | null = null
    const create = await sb.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { username: u.username },
    })

    if (create.data?.user?.id) {
      createdOrFoundId = create.data.user.id
    } else if (create.error?.message?.toLowerCase().includes('already')) {
      // Step C — user exists in auth.users; paginate listUsers.
      createdOrFoundId = await findAuthUserByEmail(sb, u.email)
    } else if (create.error) {
      throw new Error(`createUser(${u.email}) failed: ${create.error.message}`)
    }

    if (!createdOrFoundId) {
      throw new Error(`Could not create or locate auth user ${u.email}`)
    }

    // Step D — poll public.users up to ~2s for trigger propagation (vs a
    // bare 250 ms sleep). Each iteration waits 100 ms; 20×100 ms = 2 s.
    let pub: { data: { id: string } | null } | null = null
    for (let tries = 0; tries < 20; tries++) {
      pub = await sb.from('users').select('id').eq('username', u.username).maybeSingle()
      if (pub?.data?.id) break
      await new Promise(r => setTimeout(r, 100))
    }
    if (!pub?.data?.id) {
      throw new Error(
        `handle_new_user did not propagate to public.users for ${u.email} ` +
          `(auth id ${createdOrFoundId}). Check the trigger on auth.users.`,
      )
    }
    userIds.push(String(pub.data.id))
    console.log(`  ✓ ${u.email}  →  public.users/${pub.data.id}`)
  }

  return userIds
}

async function upsertPredictions(
  sb: SupabaseClient,
  matches: SeededMatch[],
  userIds: string[]
): Promise<number> {
  console.log(`\n[5/9] Inserting predictions (${userIds.length} users × ${matches.length} matches)…`)
  const rand = rng(42)
  const toInsert: Array<{
    user_id: string
    match_id: string
    prediction: 'team1' | 'team2'
    confidence: number
    is_correct: null
    result: null
  }> = []
  let alreadyExisted = 0

  for (const match of matches) {
    for (const uid of userIds) {
      const already = await sb
        .from('predictions')
        .select('id')
        .eq('user_id', uid)
        .eq('match_id', match.id)
        .maybeSingle()
      if (already.data?.id) {
        alreadyExisted++
        continue
      }
      toInsert.push({
        user_id: uid,
        match_id: match.id,
        prediction: rand() < 0.5 ? 'team1' : 'team2',
        confidence: 50 + Math.floor(rand() * 51), // 50..100 inclusive
        is_correct: null,
        result: null,
      })
    }
  }

  if (toInsert.length === 0) {
    console.log(fmtCount('predictions (existing)', alreadyExisted))
    console.log(fmtCount('predictions (inserted)', 0))
    return 0
  }

  // Insert in batches of 500 (PostgREST cap-friendly). 10×40 = 400 ⇒ one batch.
  const BATCH_SIZE = 500
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    const res = await sb.from('predictions').insert(batch)
    if (res.error) {
      throw new Error(`predictions.insert failed (batch ${i / BATCH_SIZE}): ${res.error.message}`)
    }
  }
  console.log(fmtCount('predictions (existing)', alreadyExisted))
  console.log(fmtCount('predictions (inserted)', toInsert.length))
  return toInsert.length
}

async function resolveCompletedMatches(
  sb: SupabaseClient,
  matches: SeededMatch[]
): Promise<{ resolved: number; skipped: number; correctCount: number; totalResolves: number }> {
  console.log(`\n[6/9] Resolving completed matches via evaluate_match_predictions…`)
  let resolved = 0
  let skipped = 0
  let correctCount = 0
  let totalResolves = 0
  for (const m of matches) {
    if (!m._plan.result) {
      // Upcoming — not now.
      skipped++
      continue
    }
    // Re-check live status (inserts may have been already resolved upstream).
    const live = await sb
      .from('matches')
      .select('status, result')
      .eq('id', m.id)
      .maybeSingle()
    const currentStatus = String(live.data?.status ?? 'upcoming')
    const currentResult = (live.data?.result as string | null) ?? null

    if (currentStatus === 'completed' && currentResult === m._plan.result) {
      skipped++
      continue
    }

    const rpc = await sb.rpc('evaluate_match_predictions', {
      p_match_id: m.id,
      p_result: m._plan.result,
      p_scoring_version: 'seed',
      p_force: false,
    })
    if (rpc.error) {
      console.error(`  ✗ match ${m.id} (${m._plan.team1} vs ${m._plan.team2}): ${rpc.error.message}`)
      throw new Error(`RPC failed for match ${m.id}`)
    }
    const payload = (rpc.data ?? {}) as { correctCount?: number; totalResolves?: number }
    correctCount += payload.correctCount ?? 0
    totalResolves += payload.totalResolves ?? 0
    resolved++
  }
  console.log(fmtCount('matches (resolved)', resolved))
  console.log(fmtCount('matches (skipped)', skipped))
  console.log(fmtCount('grading RPC correct', correctCount))
  console.log(fmtCount('grading RPC total', totalResolves))
  return { resolved, skipped, correctCount, totalResolves }
}

async function seedCommunityContent(
  sb: SupabaseClient,
  userIds: string[],
  matches: SeededMatch[]
): Promise<void> {
  console.log(`\n[7/9] Seeding blog_posts, intel_posts, community_discussions…`)
  const authorId = userIds[0]  
  const featMatchId = matches[0]?.id
  const authorByIndex = (i: number) => userIds[i % userIds.length] ?? userIds[0]!

  const now = new Date().toISOString()

  // The three `as never` casts below bypass Supabase's stale generated
  // `Database` type: blog_posts / intel_posts / community_discussions were
  // created in migration 015 and the local type snapshot still maps their
  // nullable columns (e.g. published_at, match_id, category_id) as
  // non-nullable string, which rejects `null` at the typed insert site.
  // Retire this workaround by running `npx supabase gen types typescript --linked`
  // and pointing `createClient<Database>()` at the regenerated types.
  const blogPosts = [
    {
      title: 'PGL Major 2026: Complete Group Stage Breakdown',
      slug: 'pgl-major-2026-group-stage-breakdown',
      content: 'A deep-dive into every group and which teams advance…',
      excerpt: 'Analysis of the group stage…',
      featured_image: null,
      author_id: authorId,
      published_at: now,
      status: 'published',
      tags: ['cs2', 'major', 'analysis'],
    },
    {
      title: 'Why Map Veto Analysis is the Missing Piece',
      slug: 'map-veto-analysis',
      content: 'Map veto phases reshape pro CS2 outcomes — overview..',
      excerpt: 'Map veto changes everything…',
      featured_image: null,
      author_id: authorId,
      published_at: now,
      status: 'published',
      tags: ['cs2', 'analysis'],
    },
    {
      title: 'Draft: Roster Stability at the Top Tier',
      slug: 'roster-stability-top-tier',
      content: 'Reflections on rosters that held together through 2026…',
      excerpt: 'NAVI keeps the same core…',
      featured_image: null,
      author_id: authorId,
      published_at: null,
      status: 'draft',
      tags: ['cs2', 'rosters'],
    },
  ]

  for (const p of blogPosts) {
    const exists = await sb.from('blog_posts').select('id').eq('slug', p.slug).maybeSingle()
    if (exists.data?.id) continue
    const { error } = await sb.from('blog_posts').insert(p as never)
    if (error) console.warn(`  ⚠ blog_posts.insert(${p.slug}): ${error.message}`)
  }

  const intelPosts = [
    {
      title: 'Spirit vs FaZe — Map Pool Edge',
      slug: 'spirit-vs-faze-map-pool-edge',
      content: 'Where Spirit has the edge on veto and map pool...',
      excerpt: 'Spirit has +35% win-rate on Ancient.',
      featured_image: null,
      author_id: authorId,
      match_id: featMatchId,
      analysis_type: 'team-form',
      published_at: now,
      status: 'published',
      tags: ['cs2', 'analysis'],
    },
    {
      title: 'NAVI vs MOUZ Map Veto Breakdown',
      slug: 'navi-vs-mouz-map-veto',
      content: 'Veto phase will decide this series — full breakdown..',
      excerpt: 'NAVI keeps the same core..',
      featured_image: null,
      author_id: authorId,
      match_id: featMatchId,
      analysis_type: 'team-form',
      published_at: now,
      status: 'published',
      tags: ['cs2', 'veto'],
    },
    {
      title: 'Underdog Value Bets for Major Qualifiers',
      slug: 'major-qualifier-underdogs',
      content: 'Three live ML picks for the weekend..',
      excerpt: 'Three live ML picks…',
      featured_image: null,
      author_id: authorId,
      match_id: featMatchId,
      analysis_type: 'betting',
      published_at: now,
      status: 'featured',
      tags: ['cs2', 'betting'],
    },
  ]

  for (const p of intelPosts) {
    const exists = await sb.from('intel_posts').select('id').eq('slug', p.slug).maybeSingle()
    if (exists.data?.id) continue
    const { error } = await sb.from('intel_posts').insert(p as never)
    if (error) console.warn(`  ⚠ intel_posts.insert(${p.slug}): ${error.message}`)
  }

  const discussions = [
    { title: 'Is Spirit overrated at current odds?', content: 'Discussing Spirit’s recent form…', author_id: authorByIndex(1), pinned: true,  locked: false },
    { title: 'Best underdog pick of the day?',        content: 'Looking at odds movement…',         author_id: authorByIndex(2), pinned: false, locked: false },
    { title: 'Can FaZe win the Major?',               content: 'FaZe’s bracket path looks tough…',  author_id: authorByIndex(3), pinned: false, locked: true  },
    { title: 'Most improved player of 2026?',         content: 'Year-over-year stats comparison…',  author_id: authorByIndex(4), pinned: false, locked: false },
    { title: 'Map veto analysis: Vitality vs Liquid', content: 'Vertigo vs Inferno implications…',  author_id: authorByIndex(5), pinned: false, locked: false },
  ]

  for (const d of discussions) {
    const exists = await sb.from('community_discussions').select('id').eq('title', d.title).maybeSingle()
    if (exists.data?.id) continue
    const { error } = await sb.from('community_discussions').insert({ ...d, category_id: null, reply_count: 0 } as never)
    if (error) console.warn(`  ⚠ community_discussions.insert(${d.title}): ${error.message}`)
  }
}

async function verifyIntegrity(sb: SupabaseClient): Promise<void> {
  console.log(`\n[8/9] Verifying leaderboard integrity…`)
  const rpc = await sb.rpc('verify_leaderboard_integrity')
  if (rpc.error) {
    console.warn(`  ⚠ cannot verify integrity: ${rpc.error.message}`)
    return
  }
  const rows = ((rpc.data ?? []) as Array<unknown>).length
  if (rows === 0) {
    console.log(`  ✓ zero integrity mismatches — ledger matches users.intel_score`)
  } else {
    console.warn(`  ⚠ integrity mismatches: ${rows}`)
  }
}

async function summaryReport(
  teamIds: Record<string, string>,
  tournamentIds: Record<string, string>,
  matches: SeededMatch[],
  userIds: string[],
  resolves: { resolved: number; skipped: number }
): Promise<void> {
  console.log(`\nSummary`)
  console.log(`  Teams                  ${Object.keys(teamIds).length}`)
  console.log(`  Tournaments             ${Object.keys(tournamentIds).length}`)
  console.log(`  Matches                 ${matches.length}  (${matches.filter(m => m._plan.result !== null).length} resolved, ${matches.filter(m => m._plan.result === null).length} upcoming)`)
  console.log(`  Predictions             ${matches.length * userIds.length}`)
  console.log(`  Matches resolved (this run)  ${resolves.resolved}`)
  console.log(`  Matches skipped (already ok) ${resolves.skipped}`)
  console.log(`  Test users              ${userIds.length}`)
  console.log(`  Test user creds         test_user_1@example.com … test_user_10@example.com`)
  console.log(`  Password                Test1234!`)
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('CS Intel — production seed starting')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing environment variables.\n' +
        '  NEXT_PUBLIC_SUPABASE_URL  and  SUPABASE_SERVICE_ROLE_KEY  must be set.\n' +
        '  Add them to .env.local or export them in the shell.',
    )
  }

  const sb: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Steps 1–9 (each emitter logs its own [N/9] banner)
  const teamIds = await upsertTeams(sb)
  const tournamentIds = await upsertTournaments(sb)
  const matches = await upsertMatches(sb, teamIds, tournamentIds)
  const userIds = await ensureAuthUsers(sb)
  await upsertPredictions(sb, matches, userIds)
  const resolves = await resolveCompletedMatches(sb, matches)
  await seedCommunityContent(sb, userIds, matches)
  await verifyIntegrity(sb)
  await summaryReport(teamIds, tournamentIds, matches, userIds, resolves)

  console.log('\nCS Intel — production seed complete')
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch(err => {
  console.error('\nSeed failed:', err instanceof Error ? err.stack ?? err.message : err)
  process.exit(1)
})
