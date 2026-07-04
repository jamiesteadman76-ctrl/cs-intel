import type {
  CompletedMatch,
  TeamRating,
  RatingHistoryEntry,
  DbTeam,
} from '@/lib/types'

export const DEFAULT_RATING = 1000
export const MIN_RATING = 100
export const MAX_RATING = 3000
export const K_FACTOR_BASE = 32
export const K_FACTOR_MAX = 64
export const K_FACTOR_MIN = 16

export interface VRSLiteConfig {
  defaultRating?: number
  kFactorBase?: number
  kFactorMax?: number
  minRating?: number
  maxRating?: number
  upsetBoost?: number
}

export function computeExpectedScore(ratingA: number, ratingB: number): number {
  const clampedA = clampRating(ratingA)
  const clampedB = clampRating(ratingB)
  const diff = clampedB - clampedA
  return 1 / (1 + Math.pow(10, diff / 400))
}

export function computeKFactor(
  rating: number,
  matchesPlayed: number,
  isUpsetScenario: boolean
): number {
  const recencyFactor = matchesPlayed < 5 ? 1.2 : 1
  const upsetAdjustment = isUpsetScenario ? 1.5 : 1

  if ( rating < 1100 ) {
    return clampKFactor(K_FACTOR_BASE * 1.1 * recencyFactor * upsetAdjustment)
  }
  if ( rating > 1400 ) {
    return clampKFactor(K_FACTOR_BASE * 0.9 * recencyFactor * upsetAdjustment)
  }
  return clampKFactor(K_FACTOR_BASE * recencyFactor * upsetAdjustment)
}

export function clampRating(value: number): number {
  if ( Number.isNaN(value) ) return DEFAULT_RATING
  return Math.max(MIN_RATING, Math.min(MAX_RATING, value))
}

function clampKFactor(value: number): number {
  return Math.max(K_FACTOR_MIN, Math.min(K_FACTOR_MAX, value))
}

export function computeRatingChange(
  ratingWinner: number,
  ratingLoser: number,
  expectedWinner: number,
  matchesPlayedWinner: number,
  matchesPlayedLoser: number,
  upsetBoost: number = 1.0
): { winnerChange: number; loserChange: number } {
  const isUpset = ratingWinner < ratingLoser
  const effectiveUpsetBoost = isUpset ? upsetBoost : 1.0

  const kWinner = computeKFactor(ratingWinner, matchesPlayedWinner, isUpset)
  const kLoser = computeKFactor(ratingLoser, matchesPlayedLoser, false)

  const winnerChange = Math.round(
    effectiveUpsetBoost * kWinner * (1 - expectedWinner)
  )
  const loserChange = -Math.round(kLoser * (0 - (1 - expectedWinner)))

  return { winnerChange, loserChange }
}

export function computeTeamRatings(
  matches: CompletedMatch[],
  teams: DbTeam[] = [],
  config: VRSLiteConfig = {}
): { ratings: TeamRating[]; history: RatingHistoryEntry[] } {
  const defaultRating = config.defaultRating ?? DEFAULT_RATING
  const upsetBoost = config.upsetBoost ?? 1.15

  const teamMeta = new Map<string, { name: string; logo?: string | null; country?: string | null }>()
  for ( const team of teams ) {
    teamMeta.set(team.id, { name: team.name, logo: team.logo, country: team.country })
  }

  const ratings = new Map<string, number>()
  const matchCounts = new Map<string, number>()
  const wins = new Map<string, number>()
  const losses = new Map<string, number>()

  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime()
  )

  for ( const match of sortedMatches ) {
    const { team1_id, team2_id, result } = match

    if ( !ratings.has(team1_id) ) ratings.set(team1_id, defaultRating)
    if ( !ratings.has(team2_id) ) ratings.set(team2_id, defaultRating)
    if ( !matchCounts.has(team1_id) ) matchCounts.set(team1_id, 0)
    if ( !matchCounts.has(team2_id) ) matchCounts.set(team2_id, 0)
    if ( !wins.has(team1_id) ) wins.set(team1_id, 0)
    if ( !wins.has(team2_id) ) wins.set(team2_id, 0)
    if ( !losses.has(team1_id) ) losses.set(team1_id, 0)
    if ( !losses.has(team2_id) ) losses.set(team2_id, 0)

    const rating1 = ratings.get(team1_id) ?? defaultRating
    const rating2 = ratings.get(team2_id) ?? defaultRating
    const matches1 = matchCounts.get(team1_id) ?? 0
    const matches2 = matchCounts.get(team2_id) ?? 0
    const expected1 = computeExpectedScore(rating1, rating2)

    const isTeam1Win = result === 'team1_win'
    const winnerId = isTeam1Win ? team1_id : team2_id
    const loserId = isTeam1Win ? team2_id : team1_id
    const winnerRating = isTeam1Win ? rating1 : rating2
    const loserRating = isTeam1Win ? rating2 : rating1
    const winnerMatches = isTeam1Win ? matches1 : matches2
    const loserMatches = isTeam1Win ? matches2 : matches1

    const { winnerChange, loserChange } = computeRatingChange(
      winnerRating,
      loserRating,
      expected1,
      winnerMatches,
      loserMatches,
      upsetBoost
    )

    const rating1Before = rating1
    const rating2Before = rating2
    const rating1After = isTeam1Win
      ? clampRating(rating1 + winnerChange)
      : clampRating(rating1 + loserChange)
    const rating2After = isTeam1Win
      ? clampRating(rating2 + loserChange)
      : clampRating(rating2 + winnerChange)

    ratings.set(team1_id, rating1After)
    ratings.set(team2_id, rating2After)
    matchCounts.set(team1_id, matches1 + 1)
    matchCounts.set(team2_id, matches2 + 1)

    if ( isTeam1Win ) {
      wins.set(team1_id, (wins.get(team1_id) ?? 0) + 1)
      losses.set(team2_id, (losses.get(team2_id) ?? 0) + 1)
    } else {
      wins.set(team2_id, (wins.get(team2_id) ?? 0) + 1)
      losses.set(team1_id, (losses.get(team1_id) ?? 0) + 1)
    }
  }

  const teamIds = Array.from(ratings.keys())
  const resultRatings: TeamRating[] = teamIds.map(teamId => {
    const meta = teamMeta.get(teamId)
    return {
      teamId,
      teamName: meta?.name ?? teamId,
      rating: ratings.get(teamId) ?? defaultRating,
      matchesPlayed: matchCounts.get(teamId) ?? 0,
      wins: wins.get(teamId) ?? 0,
      losses: losses.get(teamId) ?? 0,
      change: 0,
      logo: meta?.logo ?? null,
      country: meta?.country ?? null,
    }
  })

  resultRatings.sort((a, b) => b.rating - a.rating)
  for ( let i = 0; i < resultRatings.length; i++ ) {
    const current = resultRatings[i]
    const previous = i > 0 ? resultRatings[i - 1].rating : current.rating
    const reference = i < resultRatings.length - 1 ? resultRatings[i + 1].rating : current.rating
    const avg = (previous + reference) / 2
    const idx = resultRatings.length > 1 ? i / (resultRatings.length - 1) : 0.5
    current.change = Math.round((current.rating - avg) * 0.05)
  }

  return { ratings: resultRatings, history: [] }
}

export function getRatingForTeam(
  ratings: TeamRating[],
  teamId: string
): number {
  const found = ratings.find(r => r.teamId === teamId)
  return found?.rating ?? DEFAULT_RATING
}

export function getExpectedMatchChange(ratingA: number, ratingB: number) {
  const expectedA = computeExpectedScore(ratingA, ratingB)
  const expectedB = 1 - expectedA

  const kA = computeKFactor(ratingA, 5, false)
  const kB = computeKFactor(ratingB, 5, false)

  const aWinsChange = Math.round(kA * (1 - expectedA))
  const bWinsChange = Math.round(kB * (1 - expectedB))

  if ( aWinsChange >= bWinsChange ) {
    const aLosesChange = -Math.round(kA * expectedA)
    const bLosesChange = -Math.round(kB * expectedB)
    return {
      aWinsChange,
      aLosesChange,
      bWinsChange,
      bLosesChange,
      favoredTeam: 'a' as const,
      gap: Math.abs(ratingA - ratingB),
    }
  }
  const aLosesChange = -Math.round(kA * expectedA)
  const bLosesChange = -Math.round(kB * expectedB)
  return {
    aWinsChange,
    aLosesChange,
    bWinsChange,
    bLosesChange,
    favoredTeam: 'b' as const,
    gap: Math.abs(ratingA - ratingB),
  }
}

export function seedRatingForTeam(teamId: string): number {
  return DEFAULT_RATING
}
