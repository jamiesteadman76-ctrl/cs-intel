'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'
import TeamLogo from '@/components/TeamLogo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getMatchesWithTeams } from '@/lib/api'
import type { TeamStats, TeamRating } from '@/lib/types'

type NameLike = string | { name?: string } | null | undefined
type MatchWithResolvedNames = {
  team1?: NameLike
  team2?: NameLike
  team1Data?: NameLike
  team2Data?: NameLike
  tournament?: NameLike
  tournamentData?: NameLike
}

function getName(value: NameLike): string {
  return typeof value === 'string' ? value : value?.name || 'TBD'
}

function getTeamName(match: MatchWithResolvedNames, side: 'team1' | 'team2'): string {
  return getName((match[`${side}Data`] || match[side]) as NameLike)
}

function getTournamentName(match: MatchWithResolvedNames): string {
  return getName((match.tournamentData || match.tournament) as NameLike)
}

type UpcomingMatch = {
  id: string
  team1: string
  team2: string
  tournament: string
  time: string
  impact: 'high' | 'medium' | 'low'
}

const tabs = ['Global Rankings', 'This Month', 'Major 2026 Form'] as const
type Tab = typeof tabs[number]

type DisplayTeam = TeamRating & { rank: number }

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Global Rankings')
  const [ratings, setRatings] = useState<TeamRating[]>([])
  const [ratingsLoading, setRatingsLoading] = useState(true)
  const [teamStatsByName, setTeamStatsByName] = useState<Record<string, TeamStats>>({})
  const [statsLoading, setStatsLoading] = useState(true)
  const [hoveredRating, setHoveredRating] = useState<DisplayTeam | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
  const [upcomingLoading, setUpcomingLoading] = useState(true)

  useEffect(() => {
    async function loadRatings() {
      try {
        const res = await fetch('/api/ratings')
        if (!res.ok) throw new Error('Failed to fetch ratings')
        const data = await res.json()
        setRatings(data.ratings || [])
      } catch (err) {
        console.error(err)
      } finally {
        setRatingsLoading(false)
      }
    }

    async function loadTeamStats() {
      try {
        const res = await fetch('/api/teams/stats')
        if (!res.ok) throw new Error('Failed to fetch team stats')
        const data = await res.json()
        setTeamStatsByName(data.statsByName || {})
      } finally {
        setStatsLoading(false)
      }
    }

    loadRatings()
    loadTeamStats()
  }, [])

  useEffect(() => {
    async function loadUpcomingMatches() {
      try {
        const matches = await getMatchesWithTeams()
        const ratingsByName: Record<string, number> = {}
        for (const r of ratings) {
          ratingsByName[r.teamName] = r.rating
        }

        const upcoming = matches
          .filter(m => m.status === 'upcoming' && m.match_time)
          .slice(0, 3)
          .map(m => {
            const r1 = ratingsByName[m.team1.name] ?? 0
            const r2 = ratingsByName[m.team2.name] ?? 0
            const avg = (r1 + r2) / 2
            const impact: UpcomingMatch['impact'] =
              avg >= 2700 ? 'high' : avg >= 2500 ? 'medium' : 'low'
            return {
              id: m.id,
              team1: m.team1.name,
              team2: m.team2.name,
              tournament: getName(m.tournamentData || m.tournament),
              time: m.time,
              impact,
            }
          })

        setUpcomingMatches(upcoming)
      } catch (err) {
        console.error('Failed to load upcoming matches:', err)
      } finally {
        setUpcomingLoading(false)
      }
    }

    if (ratings.length > 0) {
      loadUpcomingMatches()
    }
  }, [ratings])

  const emptyTeamStats: TeamStats = {
    total_matches: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    last5_form: [],
    current_streak: { type: null, count: 0 },
  }

  function getTeamStatsByName(team: DisplayTeam, teamStatsByName: Record<string, TeamStats>) {
    return teamStatsByName[team.teamName] || emptyTeamStats
  }

  function formatTrend(change: number) {
    if (change > 0) return `+${change}`
    if (change < 0) return `${change}`
    return '0'
  }

  function getTrendDirection(change: number): 'up' | 'down' | 'neutral' {
    if (change > 0) return 'up'
    if (change < 0) return 'down'
    return 'neutral'
  }

  const displayTeams: DisplayTeam[] = ratings.length
    ? ratings.map((r, idx) => ({ ...r, rank: idx + 1 }))
    : []

  const movers = displayTeams
    .filter(t => t.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 4)

  const hoveredStats = hoveredRating ? getTeamStatsByName(hoveredRating, teamStatsByName) : emptyTeamStats

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 via-transparent to-[#0f3460]/5"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e94560]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8 md:pb-10">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                Team Rankings
              </h1>
              <p className="text-gray-400 text-base md:text-lg max-w-xl">
                CS2 global team rankings powered by community intelligence and performance data.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white shadow-lg shadow-[#e94560]/30'
                      : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-6">
                  Top Teams
                </h2>
                {ratingsLoading && (
                  <p className="text-xs text-gray-500 -mt-4 mb-4">Computing ratings from match history...</p>
                )}

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {displayTeams.slice(0, 3).map((team) => (
                    <PodiumCard key={team.teamId} team={team} rank={team.rank} stats={getTeamStatsByName(team, teamStatsByName)} />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Full Rankings
                  </h2>
                  <span className="text-xs text-gray-500 font-medium">
                    Top 10 teams
                  </span>
                </div>

                <div className="hidden md:block bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Team</div>
                    <div className="col-span-2 text-center">Rating</div>
                    <div className="col-span-2 text-center">Win %</div>
                    <div className="col-span-2 text-center">Form</div>
                    <div className="col-span-1 text-right">Streak</div>
                  </div>

                  <div className="divide-y divide-gray-800">
                    {displayTeams.map((team) => (
                      <RankingRow
                        key={team.teamId}
                        team={team}
                        stats={getTeamStatsByName(team, teamStatsByName)}
                        onHover={setHoveredRating}
                      />
                    ))}
                  </div>
                </div>

<div className="md:hidden space-y-3">
                   {displayTeams.map((team) => {
                     const stats = getTeamStatsByName(team, teamStatsByName)
                     const teamSlug = formatSlug(team.teamName)
                     return (
                       <Link
                         key={team.teamId}
                         href={`/team/${teamSlug}`}
                         className="block bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/50 transition-all"
                       >
                         <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-3">
                             <span className={`text-lg font-black ${team.rank <= 3 ? 'text-[#e94560]' : 'text-gray-500'}`}>
                               #{team.rank}
                             </span>
                             <TeamLogo logo={team.logo ?? undefined} name={team.teamName} size="md" />
                             <div>
                               <p className="text-sm font-bold text-white">{team.teamName}</p>
                               {team.country && <span className="text-xs">{team.country}</span>}
                             </div>
                           </div>
                           <TrendBadge change={team.change} />
                         </div>
                         <div className="grid grid-cols-3 gap-2 text-center">
                           <div className="bg-[#0f1419] rounded px-2 py-1.5">
                             <p className="text-xs text-gray-500">Win %</p>
                             <p className="text-sm font-bold text-[#00d4ff]">{stats.win_rate}%</p>
                           </div>
                           <div className="bg-[#0f1419] rounded px-2 py-1.5">
                             <p className="text-xs text-gray-500">Form</p>
                             <FormBadges form={stats.last5_form} />
                           </div>
                           <div className="bg-[#0f1419] rounded px-2 py-1.5">
                             <p className="text-xs text-gray-500">Streak</p>
                             <p className="text-sm font-bold text-white">{formatStreak(stats)}</p>
                           </div>
                         </div>
                       </Link>
                     )
                   })}
                 </div>
              </section>
            </div>

            <div className="space-y-6">
              {hoveredRating && (
                <div className="hidden lg:block">
                  <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/40 rounded-lg p-5 md:p-6 sticky top-24">
                    <div className="flex items-center gap-3 mb-4">
                      <TeamLogo logo={hoveredRating.logo ?? undefined} name={hoveredRating.teamName} size="md" />
                      <div>
                        <p className="text-base font-bold text-white">{hoveredRating.teamName}</p>
                        <p className="text-xs text-gray-500">#{hoveredRating.rank} • {hoveredRating.rating} rating</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Recent Form</p>
                        <FormBadges form={hoveredStats.last5_form} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Matches</p>
                          <p className="text-sm font-semibold text-white">{hoveredRating.matchesPlayed}</p>
                        </div>
                        <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Win/Loss</p>
                          <p className="text-sm font-semibold text-white">{hoveredRating.wins}W / {hoveredRating.losses}L</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Streak</p>
                          <p className="text-sm font-bold text-white">{formatStreak(hoveredStats)}</p>
                        </div>
                        <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Matches</p>
                          <p className="text-sm font-bold text-white">{hoveredStats.total_matches}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Win Rate</span>
                          <span className="text-[#00d4ff] font-bold">{hoveredStats.win_rate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#e94560] to-[#00d4ff] rounded-full"
                            style={{ width: `${hoveredStats.win_rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Biggest Movers
                </h3>
                <div className="space-y-3">
                  {movers.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400 rounded-lg border border-gray-700 bg-[#0f1419]">
                      No recent rating changes yet
                    </div>
                  ) : movers.map(mover => (
                    <div key={mover.teamId} className="flex items-center gap-3">
                      <TeamLogo logo={mover.logo ?? undefined} name={mover.teamName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{mover.teamName}</p>
                        <p className="text-xs text-gray-500 truncate">Rank #{mover.rank} • {mover.rating} rating</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        mover.change > 0
                          ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                          : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      }`}>
                        {mover.change > 0 ? '↑' : '↓'}{Math.abs(mover.change)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Top Performers
                </h3>
                <div className="space-y-3">
                  {displayTeams.slice(0, 5).map((team) => {
                    const stats = getTeamStatsByName(team, teamStatsByName)
                    return (
                      <div key={team.teamId} className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg border border-gray-800">
                        <span className={`text-sm font-black w-5 ${team.rank <= 3 ? 'text-[#e94560]' : 'text-gray-500'}`}>
                          #{team.rank}
                        </span>
                        <TeamLogo logo={team.logo ?? undefined} name={team.teamName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{team.teamName}</p>
                          <p className="text-xs text-gray-500">Streak {formatStreak(stats)} • {stats.total_matches} matches</p>
                        </div>
                        <span className="text-sm font-bold text-[#00d4ff]">{stats.win_rate}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002 2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Upcoming Impact
                </h3>
                <div className="space-y-3">
                  {upcomingLoading ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400 rounded-lg border border-gray-700 bg-[#0f1419]">
                      Loading upcoming matches...
                    </div>
                  ) : upcomingMatches.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400 rounded-lg border border-gray-700 bg-[#0f1419]">
                      No upcoming matches scheduled
                    </div>
                  ) : upcomingMatches.map(match => (
                    <div key={match.id} className="p-3 bg-[#0f1419] rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{match.team1}</span>
                          <span className="text-xs text-gray-600 font-medium">vs</span>
                          <span className="text-sm font-semibold text-white">{match.team2}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          match.impact === 'high'
                            ? 'bg-[#e94560]/10 text-[#e94560] border border-[#e94560]/20'
                            : match.impact === 'medium'
                              ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                              : 'bg-gray-400/10 text-gray-400 border border-gray-400/20'
                        }`}>
                          {match.impact}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate">{match.tournament}</span>
                        <span className="text-[#00d4ff]">
                          {match.time ? new Date(match.time).toLocaleString() : 'TBD'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

const emptyTeamStats: TeamStats = {
  total_matches: 0,
  wins: 0,
  losses: 0,
  win_rate: 0,
  last5_form: [],
  current_streak: { type: null, count: 0 },
}

function formatSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getTeamStatsByName(team: DisplayTeam, teamStatsByName: Record<string, TeamStats>) {
  return teamStatsByName[team.teamName] || emptyTeamStats
}

function formatStreak(stats: TeamStats) {
  if (!stats.current_streak.type || stats.current_streak.count === 0) return '—'
  return `${stats.current_streak.type}${stats.current_streak.count}`
}

function FormBadges({ form }: { form: string[] }) {
  if (form.length === 0) {
    return <span className="text-xs text-gray-500">No matches</span>
  }

  return (
    <div className="flex items-center gap-1">
      {form.map((f, i) => (
        <span
          key={i}
          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
            f === 'W'
              ? 'bg-green-400/10 text-green-400 border border-green-400/20'
              : 'bg-red-400/10 text-red-400 border border-red-400/20'
          }`}
        >
          {f}
        </span>
      ))}
    </div>
  )
}

function PodiumCard({ team, rank, stats }: { team: DisplayTeam, rank: number, stats: TeamStats }) {
  const isTop = rank === 1
  const teamSlug = formatSlug(team.teamName)
  return (
    <Link href={`/team/${teamSlug}`} className="block">
      <div className={`relative rounded-lg p-5 md:p-6 text-center border ${
        isTop
          ? 'bg-gradient-to-br from-[#e94560]/15 via-[#1a1f2e] to-[#0f1419] border-[#e94560]/50 shadow-lg shadow-[#e94560]/10'
          : 'bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-gray-700'
      }`}>
        {isTop && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
            🥇 #1
          </div>
        )}
        <TeamLogo logo={team.logo ?? undefined} name={team.teamName} size={isTop ? 'lg' : undefined} />
        <p className={`font-bold text-white mb-1 ${isTop ? 'text-base' : 'text-sm'}`}>{team.teamName}</p>
        <p className={`font-black ${isTop ? 'text-2xl text-[#00d4ff]' : 'text-lg text-gray-400'}`}>
          {team.rating}
        </p>
        <p className="text-xs text-gray-500 mt-1">Rating</p>
        <div className="mt-3 flex items-center justify-center gap-1">
          <FormBadges form={stats.last5_form} />
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <span className="text-gray-500">Streak</span>
          <span className="font-bold text-white">{formatStreak(stats)}</span>
        </div>
        <div className="mt-2">
          <TrendBadge change={team.change} size="small" />
        </div>
      </div>
    </Link>
  )
}

function RankingRow({ team, stats, onHover }: { team: DisplayTeam, stats: TeamStats, onHover: (t: DisplayTeam | null) => void }) {
  const teamSlug = formatSlug(team.teamName)
  return (
    <Link href={`/team/${teamSlug}`} className="block">
      <div
        className="px-5 py-4 hover:bg-[#1a1f2e]/60 transition-colors cursor-pointer group"
        onMouseEnter={() => onHover(team)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-1">
            <span className={`text-sm font-black ${team.rank <= 3 ? 'text-[#e94560]' : 'text-gray-500'}`}>
              {team.rank}
            </span>
          </div>

          <div className="col-span-4 flex items-center gap-3">
            <TeamLogo logo={team.logo ?? undefined} name={team.teamName} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors truncate">
                {team.teamName}
              </p>
              {team.country && <span className="text-[10px] text-gray-500">{team.country}</span>}
            </div>
          </div>

          <div className="col-span-2 text-center">
            <span className="text-sm font-bold text-white">{team.rating}</span>
          </div>

          <div className="col-span-2 text-center">
            <span className="text-sm font-semibold text-[#00d4ff]">{stats.win_rate}%</span>
          </div>

          <div className="col-span-2 flex items-center justify-center">
            <FormBadges form={stats.last5_form} />
          </div>

          <div className="col-span-1 flex justify-end">
            <span className="text-xs font-bold text-white">{formatStreak(stats)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function TrendBadge({ change, size = 'normal' }: { change: number, size?: string }) {
  const isUp = change > 0
  const isDown = change < 0
  const isNeutral = change === 0

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center justify-center font-bold ${
        size === 'small' ? 'text-xs w-7 h-7 rounded-full bg-gray-700 text-gray-500' : 'text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-500'
      }`}>
        —
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-0.5 font-bold ${
      isUp ? 'text-green-400' : 'text-red-400'
    } ${size === 'small' ? 'text-xs' : 'text-xs px-2 py-1 rounded-full'}`}>
      {isUp ? '↑' : '↓'}{Math.abs(change)}
    </span>
  )
}
