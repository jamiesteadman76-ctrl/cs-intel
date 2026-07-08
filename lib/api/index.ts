
import { supabase, getUserProfile as fetchUserProfile, createSupabaseServer } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PredictionMatch, Player, TeamStats } from '@/lib/types'

export type PredictionResult = 'team1' | 'team2'
export type MatchResult = 'team1_win' | 'team2_win' | 'draw'
export type DbTeam = { id: string; name: string; logo: string; slug: string; country?: string; founded?: number | null; founded_year?: number | null; description?: string | null; rating?: number | null }
export type DbTournament = { id: string; name: string; slug: string; description?: string | null; start_date?: string | null; end_date?: string | null; status?: string | null; prize_pool?: string | null; location?: string | null; featured?: boolean | null }
export type DbMatch = { id: string; match_time: string; status: 'upcoming' | 'live' | 'completed'; result?: 'team1_win' | 'team2_win' | 'draw'; score1?: number; score2?: number; team1_id: string; team2_id: string; tournament_id: string | null; team1: DbTeam; team2: DbTeam; tournament: string; team1Data?: DbTeam; team2Data?: DbTeam; tournamentData?: DbTournament; team1Players: Player[]; team2Players: Player[]; time: string; sentiment: number; prediction1: number; prediction2: number; evidenceScore: number; recentForm1: string[]; recentForm2: string[]; mapPoolAdvantage: string; headToHeadWins1: number; headToHeadWins2: number; reasons: string[]; tournamentId: string | null }
export type Match = DbMatch
export type AdminUser = { id: string; email: string | null; username: string | null; avatar: string | null; intel_score: number; is_admin: boolean; suspended: boolean | null }
export type AdminDashboardStats = { totalUsers: number; totalTeams: number; totalTournaments: number; totalMatches: number; totalPredictions: number; totalPosts: number }
export type MatchPredictionSummary = { totalPredictions: number; correctPredictions: number; accuracy: number; averageConfidence: number }
export type Prediction = {
  id: string
  match_id: string
  user_id: string
  prediction: PredictionResult
  confidence: number
  is_correct: boolean | null
  result: 'correct' | 'incorrect' | 'pending' | 'void' | null
  created_at: string
  evaluated_at?: string | null
  match?: DbMatch
  user?: User | null
  username?: string
  avatar?: string
}
export type User = { id: string; username: string; avatar: string; intel_score: number }
export type Comment = { id: string; match_id: string; user_id: string; text: string; created_at: string; user: User | null }
export type ResolveMatchResult = {
  success: boolean
  updatedPredictions: number
  correctPredictions: number
  incorrectPredictions: number
  previouslyResolved?: boolean
  evaluationId?: string | null
  error?: string
  data?: {
    predictionsResolved: number
    usersUpdated: number
    correctPredictions: number
    incorrectPredictions: number
    evaluationId?: string | null
  }
}
export type LeaderboardEntry = { id: string; username: string; avatar: string; intel_score: number; intelScore: number; accuracy: number; predictions: number; correct: number; streak: number; rank: number }
export type TeamRow = { id: string; name: string; slug: string; logo: string; country: string | null; founded?: number | null; founded_year?: number | null; description?: string | null; rating?: number | null; win_rate?: number | null; recent_form?: string[] | null }
export type TournamentRow = { id: string; name: string; slug: string; description?: string | null; start_date?: string | null; end_date?: string | null; status?: string | null; prize_pool?: string | null; location?: string | null; featured?: boolean | null }
export type BlogPost = { id: string; title: string; content: string; category: string; author_id: string; preview?: string | null; slug?: string | null; read_time?: string | null; published: boolean; featured?: boolean | null; created_at: string; views?: number | null }
export type IntelPost = { id: string; title: string; content: string; category: string; author_id: string; published?: boolean | null; featured?: boolean | null; created_at: string; slug?: string | null; featured_image?: string | null; excerpt?: string | null }
export type TeamRating = {
  teamId: string
  teamName: string
  rating: number
  matchesPlayed: number
  wins: number
  losses: number
  change: number
  logo: string | null
  country: string | null
}
export type RatingHistoryEntry = { match_id: string; team_id: string; rating_before: number; rating_after: number; created_at: string }
export const TEAM_LOGOS: Record<string, string> = {}
type ApiResult<T = any> = { success: true; data: T; id: string; error?: undefined } | { success: false; data?: undefined; id?: undefined; error: string }
type TeamInput = { name: string; slug: string; logo?: string | null; country?: string | null; rating?: number | null; win_rate?: number | null; recent_form?: string[] | string | null }
type TeamUpdate = Partial<Omit<TeamRow, 'recent_form'>> & { recent_form?: string[] | string | null }
function formatSlug(value: string): string { return value.toString().toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') }
function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) }
function handleSupabaseError(error: unknown): string { if (error instanceof Error) return error.message; if (typeof error === 'object' && error !== null) { const maybe = error as { message?: string; details?: string; hint?: string }; return maybe.details || maybe.hint || maybe.message || 'Unknown Supabase error' } return 'Unknown error' }
function isClient(value: unknown): value is SupabaseClient { return Boolean(value && typeof value === 'object' && 'from' in value && 'auth' in value) }
function dbResultToPredictionResult(result: MatchResult | null | undefined): PredictionResult | null {
  if (result === 'team1_win') return 'team1'
  if (result === 'team2_win') return 'team2'
  return null
}
function emptyTeam(id = 'unknown', name = 'TBD', logo = '?'): DbTeam { return { id, name, logo, slug: formatSlug(name), country: undefined, founded: null, founded_year: null, description: null } }
function emptyTournament(id = 'unknown', name = 'Unknown Tournament', slug = 'unknown-tournament'): DbTournament { return { id, name, slug, description: null, start_date: null, end_date: null, status: null, prize_pool: null, location: null, featured: null } }
function toTeam(row: any): DbTeam {
  if (!row) return emptyTeam()
  return { id: String(row.id), name: row.name || 'Unknown Team', logo: row.logo || '?', slug: row.slug || formatSlug(row.name || 'unknown-team'), country: row.country ?? undefined, founded: row.founded ?? row.founded_year ?? null, founded_year: row.founded_year ?? row.founded ?? null, description: row.description ?? null }
}
function getTeamName(value: unknown, fallback = 'Unknown Team'): string {
  if (typeof value === 'string') return isUuid(value) ? fallback : value
  if (value && typeof value === 'object' && typeof (value as { name?: unknown }).name === 'string') return (value as { name: string }).name
  return fallback
}
function toTournament(row: any): DbTournament | undefined {
  if (!row || typeof row === 'string') return undefined
  return { id: String(row.id), name: row.name || 'Unknown Tournament', slug: row.slug || formatSlug(row.name || 'unknown-tournament'), description: row.description ?? null, start_date: row.start_date ?? null, end_date: row.end_date ?? null, status: row.status ?? null, prize_pool: row.prize_pool ?? null, location: row.location ?? null, featured: row.featured ?? null }
}
async function loadTeams(sb: SupabaseClient, ids: string[]): Promise<Record<string, DbTeam>> {
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const teamsById: Record<string, DbTeam> = {}
  if (unique.length === 0) return teamsById
  const { data } = await sb.from('teams').select('*').in('id', unique)
  for (const row of data ?? []) teamsById[String(row.id)] = toTeam(row)
  for (const id of unique) teamsById[id] ??= emptyTeam(id)
  return teamsById
}
async function loadTournaments(sb: SupabaseClient, ids: string[]): Promise<Record<string, DbTournament>> {
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const tournamentsById: Record<string, DbTournament> = {}
  if (unique.length === 0) return tournamentsById
  const { data } = await sb.from('tournaments').select('*').in('id', unique)
  for (const row of data ?? []) tournamentsById[String(row.id)] = toTournament(row) ?? emptyTournament(String(row.id))
  for (const id of unique) tournamentsById[id] ??= emptyTournament(id)
  return tournamentsById
}
function toMatch(row: any, teamsById: Record<string, DbTeam>, tournamentsById: Record<string, DbTournament>): DbMatch {
  const team1Id = row.team1_id || (isUuid(row.team1) ? row.team1 : undefined)
  const team2Id = row.team2_id || (isUuid(row.team2) ? row.team2 : undefined)
  const tournamentId = row.tournament_id || (isUuid(row.tournament) ? row.tournament : undefined)
  const team1 = teamsById[team1Id || ''] ?? emptyTeam(team1Id || 'unknown', getTeamName(row.team1))
  const team2 = teamsById[team2Id || ''] ?? emptyTeam(team2Id || 'unknown', getTeamName(row.team2))
  const tournamentData = tournamentId ? tournamentsById[tournamentId] : toTournament(row.tournament)
  const tournamentName = tournamentData?.name || (typeof row.tournament === 'string' && !isUuid(row.tournament) ? row.tournament : '')
  return {
    id: String(row.id), match_time: row.match_time, status: (row.status as 'upcoming' | 'live' | 'completed') || 'upcoming',
    result: row.result || undefined, score1: row.score1 ?? undefined, score2: row.score2 ?? undefined,
    team1_id: team1Id ?? '', team2_id: team2Id ?? '', tournament_id: tournamentId ?? null,
    team1, team2, team1Data: team1, team2Data: team2,
    tournament: tournamentName || 'Unknown Tournament', tournamentData,
    team1Players: [] as Player[], team2Players: [] as Player[], time: row.match_time, sentiment: 50,
    prediction1: 50, prediction2: 50, evidenceScore: 0, recentForm1: [], recentForm2: [],
    mapPoolAdvantage: '', headToHeadWins1: 0, headToHeadWins2: 0, reasons: [], tournamentId: tournamentId ?? null
  }
}
async function fetchMatchesWithTeams(sb: SupabaseClient, query: any): Promise<DbMatch[]> {
  const { data, error } = await query
  if (error) throw new Error(handleSupabaseError(error))
  const rows = Array.isArray(data) ? data : data ? [data] : []
  const teamIds = rows.flatMap((row: any) => [
    row.team1_id,
    row.team2_id,
    isUuid(row.team1) ? row.team1 : null,
    isUuid(row.team2) ? row.team2 : null,
  ])
  const tournamentIds = rows.flatMap((row: any) => [
    row.tournament_id,
    isUuid(row.tournament) ? row.tournament : null,
  ])
  const [teamsById, tournamentsById] = await Promise.all([
    loadTeams(sb, teamIds),
    loadTournaments(sb, tournamentIds),
  ])
  return rows.map((row: any) => toMatch(row, teamsById, tournamentsById))
}
export async function requireAdmin(sb: SupabaseClient = supabase): Promise<{ authorized: boolean; userId?: string }> {
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { authorized: false }
  // Use the cookie-bound server client so the read of `is_admin` runs under
  // the request's authenticated context (matches the route's RLS expectations
  // and avoids the global browser client, which has no auth cookies attached).
  const profile = await fetchUserProfile(sb, user.id)
  return { authorized: profile?.is_admin ?? false, userId: user.id }
}
export async function getMatchesWithTeams(sb: SupabaseClient = supabase): Promise<DbMatch[]> {
  return fetchMatchesWithTeams(sb, sb.from('matches').select('*, tournament:tournaments!tournament_id(id, name, slug)').order('match_time', { ascending: true }))
}
export async function getCompletedMatches(sb: SupabaseClient = supabase): Promise<DbMatch[]> {
  return fetchMatchesWithTeams(sb, sb.from('matches').select('*, tournament:tournaments!tournament_id(id, name, slug)').eq('status', 'completed').order('match_time', { ascending: false }))
}
export async function getTeamMatches(sbOrId: SupabaseClient | string = supabase, maybeId = ''): Promise<DbMatch[]> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const id = isClient(sbOrId) ? maybeId : sbOrId
  return fetchMatchesWithTeams(sb, sb.from('matches').select('*, tournament:tournaments!tournament_id(id, name, slug)').or('team1_id.eq.' + id + ',team2_id.eq.' + id).order('match_time', { ascending: true }))
}
export async function getMatches(sb: SupabaseClient = supabase): Promise<PredictionMatch[]> {
  const matches = await getMatchesWithTeams(sb)
  return matches.map(match => ({
    id: match.id, team1: match.team1.name, team2: match.team2.name,
    logo1: match.team1.logo, logo2: match.team2.logo, time: match.match_time,
    tournament: match.tournament ?? '', prediction1: match.prediction1 ?? 0, prediction2: match.prediction2 ?? 0,
    score1: match.score1 ?? undefined, score2: match.score2 ?? undefined, status: match.status, result: match.result ?? undefined
  }))
}
async function usersById(sb: SupabaseClient, ids: string[]): Promise<Record<string, User>> {
  const unique = Array.from(new Set(ids.filter(Boolean))); const map: Record<string, User> = {}
  if (unique.length === 0) return map
  const { data } = await sb.from('users').select('id, username, avatar, intel_score').in('id', unique)
  for (const row of data ?? []) map[String(row.id)] = { id: String(row.id), username: row.username || 'Anonymous', avatar: row.avatar || '', intel_score: row.intel_score ?? 0 }
  return map
}
export async function getPredictions(sb: SupabaseClient = supabase): Promise<Prediction[]> {
  const { data, error } = await sb.from('predictions').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(handleSupabaseError(error))
  const users = await usersById(sb, (data ?? []).map(row => row.user_id))
  return (data ?? []).map(row => ({ ...row, user: users[row.user_id] ?? null }))
}
export async function getAllPredictions(sb: SupabaseClient = supabase, filters: Record<string, any> = {}): Promise<Prediction[]> {
  let query = sb.from('predictions').select('*')
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(handleSupabaseError(error))
  const users = await usersById(sb, (data ?? []).map(row => row.user_id))
  return (data ?? []).map(row => ({ ...row, user: users[row.user_id] ?? null }))
}
export async function getMatchPredictions(sbOrId: SupabaseClient | string = supabase, maybeId = ''): Promise<Prediction[]> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const id = isClient(sbOrId) ? maybeId : sbOrId
  return id ? getAllPredictions(sb, { match_id: id }) : getPredictions(sb)
}
export async function getMatchPredictionStats(sbOrId: SupabaseClient | string = supabase, maybeId = ''): Promise<MatchPredictionSummary> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const id = isClient(sbOrId) ? maybeId : sbOrId
  const predictions = await getMatchPredictions(sb, id)
  const total = predictions.length
  const correct = predictions.filter(p => p.is_correct === true).length
  const confidence = predictions.reduce((sum, p) => sum + (Number(p.confidence)), 0)
  return {
    totalPredictions: total,
    correctPredictions: correct,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    averageConfidence: total ? Math.round(confidence / total) : 0,
  }
}
export async function submitPrediction(matchId: string, team1Win: boolean, confidence: number = 50): Promise<{ success: boolean; error?: string }> {
  const safeConfidence = Math.min(100, Math.max(50, Math.round(confidence)))
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be signed in to submit a prediction' }
  const match = await getMatchById(matchId)
  if (!match) return { success: false, error: 'Match not found' }
  if (match.status !== 'upcoming') return { success: false, error: 'Predictions are closed for this match' }
  const predicted_pick: PredictionResult = team1Win ? 'team1' : 'team2'
  // upsert on (user_id, match_id); prediction/confidence can change while match is upcoming/live.
  // result/is_correct/evaluated_at are owned by the RPC and will be reset to null on rebroadcast.
  const { error } = await supabase.from('predictions').upsert(
    {
      user_id: user.id,
      match_id: matchId,
      prediction: predicted_pick,
      confidence: safeConfidence,
      is_correct: null,
      result: null,
    },
    { onConflict: 'user_id,match_id' }
  )
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true }
}export async function evaluatePredictions(sb: SupabaseClient, matchId: string, result: MatchResult, scoringVersion: string = 'v1'): Promise<ResolveMatchResult> {
  const logTag = '[evaluatePredictions]'
  console.error(`${logTag} === START matchId=${matchId}, result=${result}, scoringVersion=${scoringVersion}`)

  // --- Validate environment variables ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    const msg = `Missing env vars: url=${!!supabaseUrl}, key=${!!serviceRoleKey}`
    console.error(`${logTag} ${msg}`)
    return { success: false, updatedPredictions: 0, correctPredictions: 0, incorrectPredictions: 0, error: msg }
  }

  // --- Build the request (matches the working curl exactly) ---
  const rpcArgs = {
    p_match_id: matchId,
    p_result: result,
    p_scoring_version: scoringVersion,
    p_force: false,
  }
  const url = `${supabaseUrl}/rest/v1/rpc/evaluate_match_predictions`
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  console.error(`${logTag} POST ${url}`)
  console.error(`${logTag} headers: apikey=${serviceRoleKey.slice(0, 8)}..., Authorization=Bearer ${serviceRoleKey.slice(0, 8)}...`)
  console.error(`${logTag} body: ${JSON.stringify(rpcArgs)}`)

  // --- Send the fetch ---
  try {
    console.error(`${logTag} sending fetch...`)
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(rpcArgs),
    })

    // Read raw text first for debugging, then parse
    const rawBody = await response.text()
    console.error(`${logTag} response status: ${response.status} ${response.statusText}`)
    console.error(`${logTag} raw response body (first 2000 chars): ${rawBody.slice(0, 2000)}`)

    if (!response.ok) {
      const errMsg = `RPC returned ${response.status}: ${rawBody.slice(0, 1000)}`
      console.error(`${logTag} ERROR: ${errMsg}`)
      return { success: false, updatedPredictions: 0, correctPredictions: 0, incorrectPredictions: 0, error: errMsg }
    }

    // Parse the JSON response
    let data: unknown
    try {
      data = JSON.parse(rawBody)
    } catch {
      const errMsg = `RPC returned non-JSON response: ${rawBody.slice(0, 500)}`
      console.error(`${logTag} ${errMsg}`)
      return { success: false, updatedPredictions: 0, correctPredictions: 0, incorrectPredictions: 0, error: errMsg }
    }

    console.error(`${logTag} parsed data: ${JSON.stringify(data).slice(0, 1000)}`)

    // The RPC returns an object (or single-element array) with score results
    const payload = (Array.isArray(data) ? data[0] : data ?? {}) as Record<string, unknown>

    const correctPredictions = Number(payload.correctCount ?? 0)
    const totalResolves = Number(payload.totalResolves ?? 0)
    const predictorCount = Number(payload.predictorCount ?? 0)

    console.error(`${logTag} returning: success=${String(payload.success ?? true)}, updated=${predictorCount}, correct=${correctPredictions}, total=${totalResolves}`)
    console.error(`${logTag} === END`)

    return {
      success: payload.success !== false,
      updatedPredictions: predictorCount,
      correctPredictions,
      incorrectPredictions: Math.max(0, totalResolves - correctPredictions),
      previouslyResolved: payload.previouslyResolved === true,
      data: {
        predictionsResolved: predictorCount,
        usersUpdated: predictorCount,
        correctPredictions,
        incorrectPredictions: Math.max(0, totalResolves - correctPredictions),
        evaluationId: (payload.evaluationId as string | null) ?? null,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error(`${logTag} UNCAUGHT THROW: ${msg}`)
    return { success: false, updatedPredictions: 0, correctPredictions: 0, incorrectPredictions: 0, error: `RPC threw: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function resolveMatchAndUpdateScores(sbOrId: SupabaseClient | string = supabase, maybeIdOrResult?: string | MatchResult, maybeResult?: MatchResult): Promise<ResolveMatchResult> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const matchId = isClient(sbOrId) ? String(maybeIdOrResult) : String(sbOrId)
  const result = (isClient(sbOrId) ? maybeResult : String(maybeIdOrResult)) as MatchResult | undefined
  if (!result || !['team1_win', 'team2_win', 'draw'].includes(result)) {
    return { success: false, updatedPredictions: 0, correctPredictions: 0, incorrectPredictions: 0, error: 'Invalid match result' }
  }
  // The RPC is purely transactional and includes the authorization check
  // against auth.uid() inside the database triggers + grants. Defence-in-depth
  // is preserved by the requireAdmin() call inside evaluatePredictions.
  return evaluatePredictions(sb, matchId, result)
}
export async function setMatchResult(matchId: string, result: MatchResult): Promise<ResolveMatchResult> { return resolveMatchAndUpdateScores(matchId, result) }
export async function getMatchById(sbOrId: SupabaseClient | string = supabase, maybeId?: string): Promise<DbMatch | null> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const id = isClient(sbOrId) ? maybeId : sbOrId
  const { data } = await sb.from('matches').select('*, tournament:tournaments!tournament_id(id, name, slug)').eq('id', String(id)).maybeSingle()
  if (!data) return null
  const teamIds = [data.team1_id, data.team2_id, isUuid(data.team1) ? data.team1 : null, isUuid(data.team2) ? data.team2 : null]
  const tournamentIds = [data.tournament_id, isUuid(data.tournament) ? data.tournament : null]
  const [teamsById, tournamentsById] = await Promise.all([
    loadTeams(sb, teamIds),
    loadTournaments(sb, tournamentIds),
  ])
  return toMatch(data, teamsById, tournamentsById)
}
export async function getTeamBySlug(sbOrId: SupabaseClient | string = supabase, maybeSlug?: string): Promise<DbTeam | null> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const slug = isClient(sbOrId) ? maybeSlug : sbOrId
  const { data } = await sb.from('teams').select('*').eq('slug', String(slug)).maybeSingle()
  if (!data) return null
  return toTeam(data)
}
export async function getTournamentBySlug(sbOrId: SupabaseClient | string = supabase, maybeSlug?: string): Promise<DbTournament | null> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const slug = isClient(sbOrId) ? maybeSlug : sbOrId
  const { data } = await sb.from('tournaments').select('*').eq('slug', String(slug)).maybeSingle()
  if (!data) return null
  return { id: String(data.id), name: data.name, slug: data.slug, description: data.description ?? null, start_date: data.start_date ?? null, end_date: data.end_date ?? null, status: data.status ?? null, prize_pool: data.prize_pool ?? null, location: data.location ?? null, featured: data.featured ?? null }
}
export async function getMatchesByTournament(sbOrId: SupabaseClient | string = supabase, maybeId?: string): Promise<DbMatch[]> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const id = isClient(sbOrId) ? maybeId : sbOrId
  return fetchMatchesWithTeams(sb, sb.from('matches').select('*, tournament:tournaments!tournament_id(id, name, slug)').eq('tournament_id', String(id)).order('match_time', { ascending: true }))
}
export async function createBlogPost(sb: SupabaseClient, input: Partial<BlogPost> & { title: string; content: string; category: string; author_id: string }): Promise<ApiResult<string>> {
  const post: Record<string, any> = {
    title: input.title,
    content: input.content,
    slug: input.slug ?? formatSlug(input.title),
    author_id: input.author_id,
    status: input.published ? 'published' : 'draft',
  }
  if ((input as any).tags !== undefined) post.tags = (input as any).tags
  if (input.preview) post.excerpt = input.preview
  const { data, error } = await sb.from('blog_posts').insert(post).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function updateBlogPost(sb: SupabaseClient, id: string, input: Partial<BlogPost>): Promise<ApiResult<string>> {
  const updates: Record<string, any> = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.content !== undefined) updates.content = input.content
  if (input.slug !== undefined) updates.slug = input.slug
  if (input.author_id !== undefined) updates.author_id = input.author_id
  if (input.preview !== undefined) updates.excerpt = input.preview
  if (input.published !== undefined) updates.status = input.published ? 'published' : 'draft'
  if ((input as any).tags !== undefined) updates.tags = (input as any).tags
  if (!input.slug && input.title) updates.slug = formatSlug(input.title)
  const { data, error } = await sb.from('blog_posts').update(updates).eq('id', id).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function deleteBlogPost(sb: SupabaseClient, id: string): Promise<ApiResult<void>> {
  const { error } = await sb.from('blog_posts').delete().eq('id', id)
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: undefined, id: '' }
}
export async function createIntelPost(sb: SupabaseClient, input: Partial<IntelPost> & { title: string; content: string; category: string; author_id: string }): Promise<ApiResult<string>> {
  const status = input.featured ? 'featured' : (input.published ? 'published' : 'draft')
  const post: Record<string, any> = {
    title: input.title,
    content: input.content,
    slug: formatSlug(input.title),
    author_id: input.author_id,
    analysis_type: (input as any).analysis_type || 'meta',
    status,
  }
  if (input.featured_image) post.featured_image = input.featured_image
  if (input.excerpt) post.excerpt = input.excerpt
  const { data, error } = await sb.from('intel_posts').insert(post).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function updateIntelPost(sb: SupabaseClient, id: string, input: Partial<IntelPost>): Promise<ApiResult<string>> {
  const updates: Record<string, any> = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.content !== undefined) updates.content = input.content
  if (input.slug !== undefined) updates.slug = input.slug
  if (input.author_id !== undefined) updates.author_id = input.author_id
  if ((input as any).analysis_type !== undefined) updates.analysis_type = (input as any).analysis_type
  if (input.published !== undefined || input.featured !== undefined) {
    updates.status = input.featured ? 'featured' : (input.published ? 'published' : 'draft')
  }
  if (input.featured_image !== undefined) updates.featured_image = input.featured_image
  if (input.excerpt !== undefined) updates.excerpt = input.excerpt
  if (input.title && !input.slug) updates.slug = formatSlug(input.title)
  const { data, error } = await sb.from('intel_posts').update(updates).eq('id', id).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function deleteIntelPost(sb: SupabaseClient, id: string): Promise<ApiResult<void>> {
  const { error } = await sb.from('intel_posts').delete().eq('id', id)
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: undefined, id: '' }
}
export async function getTeams(sb: SupabaseClient = supabase): Promise<TeamRow[]> { const { data } = await sb.from('teams').select('id, name, slug, logo, country, rating, win_rate, recent_form'); return (data ?? []).map(row => ({ id: String(row.id), name: row.name, slug: row.slug, logo: row.logo || '?', country: row.country ?? null, rating: row.rating ?? null, win_rate: row.win_rate ?? null, recent_form: row.recent_form ?? null })) }
export async function getTournaments(sb: SupabaseClient = supabase): Promise<TournamentRow[]> { const { data } = await sb.from('tournaments').select('id, name, slug, status, start_date, end_date, featured'); return (data ?? []).map(row => ({ id: String(row.id), name: row.name, slug: row.slug, status: row.status ?? null, start_date: row.start_date ?? null, end_date: row.end_date ?? null, featured: row.featured ?? null })) }
export async function getIntelPosts(sb: SupabaseClient = supabase, published?: boolean | null): Promise<IntelPost[]> {
  let query = sb.from('intel_posts').select('id, title, slug, content, excerpt, featured_image, author_id, analysis_type, status, created_at')
  if (published !== undefined) {
    if (published) query = query.in('status', ['published', 'featured'])
    else query = query.eq('status', 'draft')
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(handleSupabaseError(error))
  return (data ?? []).map(row => ({
    id: String(row.id), title: row.title, content: row.content, category: row.analysis_type ?? '', author_id: row.author_id ?? '', published: row.status === 'published' || row.status === 'featured', featured: row.status === 'featured' || null, created_at: row.created_at ?? '', slug: row.slug ?? null, featured_image: row.featured_image ?? null, excerpt: row.excerpt ?? null
  }))
}
export async function getBlogPosts(sb: SupabaseClient = supabase, published?: boolean | null): Promise<BlogPost[]> {
  let query = sb.from('blog_posts').select('id, title, slug, content, excerpt, tags, author_id, status, created_at')
  if (published !== undefined) {
    if (published) query = query.eq('status', 'published')
    else query = query.in('status', ['draft', 'archived'])
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(handleSupabaseError(error))
  return (data ?? []).map(row => ({
    id: String(row.id), title: row.title, content: row.content, category: (row.tags && row.tags.length > 0) ? String(row.tags[0]) : '', author_id: row.author_id ?? '', preview: row.excerpt ?? null, slug: row.slug ?? null, read_time: null, published: row.status === 'published', featured: null, created_at: row.created_at ?? '', views: null
  }))
}
export async function getLeaderboard(sb: SupabaseClient = supabase): Promise<LeaderboardEntry[]> {
  const { data } = await sb.from('users').select('id, username, avatar, intel_score, created_at').order('intel_score', { ascending: false }).limit(50)
  return (data ?? []).map((user, index) => ({
    id: String(user.id), username: user.username ?? 'Unknown User', avatar: user.avatar ?? null,
    intel_score: user.intel_score ?? 0, intelScore: user.intel_score ?? 0, accuracy: 0, predictions: 0, correct: 0, streak: 0, rank: index + 1
  }))
}
export async function getUsers(sb: SupabaseClient = supabase): Promise<User[]> { const { data } = await sb.from('users').select('id, username, avatar, intel_score, created_at').order('created_at', { ascending: false }).limit(100); return (data ?? []).map((u: any) => ({ id: String(u.id), username: u.username ?? 'Anonymous', avatar: u.avatar ?? '', intel_score: u.intel_score ?? 0 })) }
export async function createMatch(sb: SupabaseClient, input: { team1_id: string; team2_id: string; tournament_id?: string | null; match_time?: string | null; status?: string; result?: string }): Promise<ApiResult<string>> {
  const post = { ...input }
  const { data, error } = await sb.from('matches').insert(post).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function updateMatch(sb: SupabaseClient, id: string, input: Record<string, any>): Promise<ApiResult<string>> {
  const { data, error } = await sb.from('matches').update(input).eq('id', id).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function deleteMatch(sb: SupabaseClient, id: string): Promise<ApiResult<void>> {
  const { error } = await sb.from('matches').delete().eq('id', id)
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: undefined, id: '' }
}
export async function getTeamsFull(sb: SupabaseClient = supabase): Promise<TeamRow[]> { const { data } = await sb.from('teams').select('id, name, slug, logo, country, founded_year, rating, win_rate, recent_form'); return (data ?? []).map(row => ({ id: String(row.id), name: row.name, slug: row.slug, logo: row.logo || '?', country: row.country ?? null, founded: row.founded_year ?? null, founded_year: row.founded_year ?? null, description: null, rating: row.rating ?? null, win_rate: row.win_rate ?? null, recent_form: row.recent_form ?? null })) }
export async function updateTeam(sb: SupabaseClient, id: string, input: TeamUpdate): Promise<ApiResult<string>> {
  const { data, error } = await sb.from('teams').update(input).eq('id', id).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function deleteTeam(sb: SupabaseClient, id: string): Promise<ApiResult<void>> {
  const { error } = await sb.from('teams').delete().eq('id', id)
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: undefined, id: '' }
}
export async function getAdminDashboardStats(sb: SupabaseClient = supabase): Promise<AdminDashboardStats> {
  const [u, t, tou, m, p, ip, bp] = await Promise.all([
    sb.from('users').select('id', { count: 'exact', head: true }),
    sb.from('teams').select('id', { count: 'exact', head: true }),
    sb.from('tournaments').select('id', { count: 'exact', head: true }),
    sb.from('matches').select('id', { count: 'exact', head: true }),
    sb.from('predictions').select('id', { count: 'exact', head: true }),
    sb.from('intel_posts').select('id', { count: 'exact', head: true }),
    sb.from('blog_posts').select('id', { count: 'exact', head: true }),
  ])
  return { totalUsers: u.count ?? 0, totalTeams: t.count ?? 0, totalTournaments: tou.count ?? 0, totalMatches: m.count ?? 0, totalPredictions: p.count ?? 0, totalPosts: (ip.count ?? 0) + (bp.count ?? 0) }
}
export async function createTeam(sb: SupabaseClient, input: TeamInput): Promise<ApiResult<string>> {
  const post = { ...input, slug: input.slug || formatSlug(input.name), created_at: new Date().toISOString() }
  const { data, error } = await sb.from('teams').insert(post).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function getTournamentsFull(sb: SupabaseClient = supabase): Promise<TournamentRow[]> { const { data } = await sb.from('tournaments').select('id, name, slug, description, start_date, end_date, status, prize_pool, location, featured'); return (data ?? []).map(row => ({ id: String(row.id), name: row.name, slug: row.slug, description: row.description ?? null, start_date: row.start_date ?? null, end_date: row.end_date ?? null, status: row.status ?? null, prize_pool: row.prize_pool ?? null, location: row.location ?? null, featured: row.featured ?? null })) }
export async function createTournament(sb: SupabaseClient, input: Partial<TournamentRow> & { name: string; slug: string }): Promise<ApiResult<string>> {
  const post = { ...input, slug: input.slug || formatSlug(input.name), created_at: new Date().toISOString() }
  const { data, error } = await sb.from('tournaments').insert(post).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function updateTournament(sb: SupabaseClient, id: string, input: Partial<TournamentRow>): Promise<ApiResult<string>> {
  const updates: any = { ...input }
  if (input.name && !input.slug) updates.slug = formatSlug(input.name)
  const { data, error } = await sb.from('tournaments').update(updates).eq('id', id).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function deleteTournament(sb: SupabaseClient, id: string): Promise<ApiResult<void>> {
  const { error } = await sb.from('tournaments').delete().eq('id', id)
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: undefined, id: '' }
}
export async function searchUsers(opts: { query: string; sort?: string; filter?: string; limit?: number; offset?: number }): Promise<{ users: User[]; total: number }> {
  const { query, sort = 'intel_score', filter = 'all', limit = 25, offset = 0 } = opts
  let q = supabase.from('users').select('id, username, avatar, intel_score', { count: 'exact' }).range(offset, offset + limit - 1)
  if (query) q = q.ilike('username', '%25' + query + '%25')
  if (filter === 'admins') q = q.eq('is_admin', true)
  const { data, count, error } = await q.order(sort, { ascending: false })
  if (error) throw new Error(handleSupabaseError(error))
  const users = (data ?? []).map((u: any) => ({ id: String(u.id), username: u.username ?? 'Anonymous', avatar: u.avatar ?? '', intel_score: u.intel_score ?? 0 }))
  return { users, total: count ?? users.length }
}
export async function getUsersWithStats(sb: SupabaseClient = supabase): Promise<any[]> {
  const { data } = await sb.from('users').select('id, username, avatar, intel_score, created_at').order('intel_score', { ascending: false })
  return (data ?? []).map((u: any) => ({ id: String(u.id), username: u.username, avatar: u.avatar, intelScore: u.intel_score ?? 0, predictions: 0, correct: 0, streak: 0 }))
}
export async function updateUserAdminStatus(sb: SupabaseClient, userId: string, isAdmin: boolean): Promise<ApiResult<void>> {
  const { error } = await sb.from('users').update({ is_admin: isAdmin }).eq('id', userId)
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: undefined, id: '' }
}
export async function updateUserProfile(sb: SupabaseClient, userId: string, input: Partial<{ username: string; avatar: string; email: string }>): Promise<ApiResult<string>> {
  const { data, error } = await sb.from('users').update(input).eq('id', userId).select('id').single()
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: String(data.id), id: String(data.id) }
}
export async function suspendUser(sb: SupabaseClient, userId: string): Promise<ApiResult<void>> {
  const { error } = await sb.from('users').update({ suspended: true }).eq('id', userId)
  if (error) return { success: false, error: handleSupabaseError(error) }
  return { success: true, data: undefined, id: '' }
}
export async function toggleAdminRole(sb: SupabaseClient, userId: string, isAdmin: boolean): Promise<ApiResult<void>> { return updateUserAdminStatus(sb, userId, isAdmin) }
async function computeStatsForTeam(matches: DbMatch[], teamId: string): Promise<TeamStats> {
  const completed = matches.filter(match => match.status === 'completed')
  let wins = 0
  let losses = 0
  let draws = 0
  let goalsFor = 0
  let goalsAgainst = 0
  const last5: string[] = []

  for (const match of completed) {
    const isTeam1 = match.team1_id === teamId
    const teamGoals = isTeam1 ? match.score1 ?? 0 : match.score2 ?? 0
    const opponentGoals = isTeam1 ? match.score2 ?? 0 : match.score1 ?? 0
    goalsFor += teamGoals
    goalsAgainst += opponentGoals

    const form = match.result === 'draw'
      ? 'D'
      : ((isTeam1 && match.result === 'team1_win') || (!isTeam1 && match.result === 'team2_win'))
        ? 'W'
        : 'L'

    if (form === 'W') wins += 1
    else if (form === 'D') draws += 1
    else losses += 1
    last5.unshift(form)
  }

  const played = completed.length
  const points = wins * 3 + draws
  const winRate = played ? Math.round((wins / played) * 100) : 0
  const streakType = last5[0] === 'W' ? 'W' : last5[0] === 'L' ? 'L' : null
  let streakCount = 0
  for (const form of last5) {
    if (form === streakType) streakCount += 1
    else break
  }

  return {
    total_matches: played,
    wins,
    losses,
    win_rate: winRate,
    last5_form: last5.slice(0, 5),
    current_streak: { type: streakType, count: streakCount },
  }
}

export async function computeTeamStats(sbOrId: SupabaseClient | string = supabase, maybeId = ''): Promise<TeamStats> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const id = isClient(sbOrId) ? maybeId : sbOrId
  return computeStatsForTeam(await getTeamMatches(sb, id), id)
}

export async function getTeamStats(sbOrId: SupabaseClient | string = supabase, maybeId = ''): Promise<TeamStats> {
  return computeTeamStats(sbOrId, maybeId)
}

export async function getAllTeamStats(sb: SupabaseClient = supabase): Promise<Record<string, TeamStats>> {
  const teams = await getTeamsFull(sb)
  const stats: Record<string, TeamStats> = {}
  for (const team of teams) {
    stats[team.id] = await computeStatsForTeam(await getTeamMatches(sb, team.id), team.id)
  }
  return stats
}
export async function getComments(sbOrMatchId: SupabaseClient | string = supabase, maybeMatchId?: string): Promise<Comment[]> {
  const sb = isClient(sbOrMatchId) ? sbOrMatchId : supabase
  const matchId = isClient(sbOrMatchId) ? maybeMatchId : sbOrMatchId
  let query = sb.from('comments').select('*, user:users!user_id(id, username, avatar)').order('created_at', { ascending: true })
  if (matchId) query = query.eq('match_id', String(matchId))
  const { data } = await query
  return (data ?? []).map((row: any) => ({
    id: String(row.id), match_id: String(row.match_id), user_id: String(row.user_id),
    text: row.text, created_at: row.created_at,
    user: row.user ? { id: String(row.user.id), username: row.user.username ?? 'Anonymous', avatar: row.user.avatar ?? '', intel_score: row.user.intel_score ?? 0 } : null
  }))
}
export async function getTeamRatings(sb: SupabaseClient = supabase): Promise<{ ratings: TeamRating[] }> {
  const { data } = await sb.from('teams').select('id, name, rating, logo, country, win_rate').order('rating', { ascending: false })
  const ratings = (data ?? []).map((row: any, i) => ({ teamId: String(row.id), teamName: row.name, rating: row.rating ?? 1000, matchesPlayed: 0, wins: 0, losses: 0, change: 0, logo: row.logo ?? null, country: row.country ?? null }))
  return { ratings }
}
export async function getRatingsForTeam(sbOrId: SupabaseClient | string = supabase, maybeId?: string): Promise<{ rating?: number }> {
  const sb = isClient(sbOrId) ? sbOrId : supabase
  const id = isClient(sbOrId) ? maybeId : sbOrId
  const { data } = await sb.from('teams').select('rating').eq('id', String(id)).single()
  return { rating: data?.rating ?? 1000 }
}
export function calculateIntelScore(predictions: Prediction[]): number {
  return predictions.reduce((sum, p) => {
    if (p.result === 'void' || p.is_correct == null) return sum
    const safeConfidence = Math.min(100, Math.max(50, Number(p.confidence)))
    if (p.is_correct) return sum + Math.round(safeConfidence * 10)
    return sum - Math.round(safeConfidence * 5)
  }, 0)
}






