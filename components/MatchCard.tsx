import Link from 'next/link'
import TeamLogo from '@/components/TeamLogo'
import type { Match, TeamStats } from '@/lib/types'
import { getExpectedMatchChange } from '@/lib/ratings'

interface MatchCardProps {
  match: Match
  teamStats?: Record<string, TeamStats>
  matchRatings?: Record<string, number>
}

function formatSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getTeamSlug(team: Match['team1']): string {
  return (team as Match['team1'] & { slug?: string }).slug || formatSlug(team.name)
}

function FormBadges({ form }: { form: string[] }) {
  if (form.length === 0) return <span className="text-[10px] text-gray-500">No matches</span>

  return (
    <div className="flex gap-1">
      {form.map((f, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
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

function formatStreak(stats: TeamStats | undefined) {
  if (!stats?.current_streak.type || stats.current_streak.count === 0) return '—'
  return `${stats.current_streak.type}${stats.current_streak.count}`
}

function getTeamStats(teamStats: Record<string, TeamStats> | undefined, team: Match['team1']) {
  return teamStats?.[(team as any).id] || teamStats?.[team.name]
}

function TeamMiniStats({ name, stats }: { name: string, stats?: TeamStats }) {
  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500">{name}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-[#00d4ff]">{stats?.win_rate ?? 0}% WR</span>
        <FormBadges form={stats?.last5_form ?? []} />
        <span className="font-semibold text-white">{formatStreak(stats)}</span>
      </div>
    </div>
  )
}

export default function MatchCard({ match, teamStats, matchRatings }: MatchCardProps) {
  const rating1 = matchRatings?.[match.team1.id ?? ''] ?? 1000
  const rating2 = matchRatings?.[match.team2.id ?? ''] ?? 1000
  const tournamentName = match.tournamentData?.name || match.tournament
  const expected = getExpectedMatchChange(rating1, rating2)

  return (
    <div className="block relative">
      <Link href={`/match/${match.id}`} className="absolute inset-0 rounded-lg z-0" aria-label={`Open match ${match.team1.name} vs ${match.team2.name}`} />
      <div className="relative z-10 pointer-events-none">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 md:p-6 hover:border-[#e94560]/50 transition-all card-hover group">
          {/* Header with tournament */}
          <div className="mb-4">
            <Link href={`/tournament/${formatSlug(tournamentName)}`} className="pointer-events-auto">
              <span className="text-xs font-semibold text-[#00d4ff] uppercase tracking-wider">
                {tournamentName}
              </span>
            </Link>
            <p className="text-xs text-gray-500 mt-1">{match.time}</p>
          </div>

          {/* Teams */}
           <div className="mb-6">
             <div className="flex items-center justify-between mb-4">
                <Link href={`/team/${getTeamSlug(match.team1)}`} className="flex items-center gap-3 flex-1 pointer-events-auto">
                  <TeamLogo team={match.team1} size="xl" />
                  <div>
                    <p className="font-semibold text-white">{match.team1.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-[#e94560] bg-[#e94560]/10 border border-[#e94560]/20 px-1.5 py-0.5 rounded">
                        {rating1}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        +{expected.aWinsChange} / {expected.aLosesChange}
                      </span>
                    </div>
                    <TeamMiniStats name={match.team1.name} stats={getTeamStats(teamStats, match.team1)} />
                  </div>
                </Link>
                <div className="text-gray-500 text-sm font-medium px-3">VS</div>
                <Link href={`/team/${getTeamSlug(match.team2)}`} className="flex items-center gap-3 flex-1 justify-end pointer-events-auto">
                  <div className="text-right">
                    <p className="font-semibold text-white text-right">{match.team2.name}</p>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-1.5 py-0.5 rounded">
                        {rating2}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        +{expected.bWinsChange} / {expected.bLosesChange}
                      </span>
                    </div>
                    <TeamMiniStats name={match.team2.name} stats={getTeamStats(teamStats, match.team2)} />
                  </div>
                  <TeamLogo team={match.team2} size="xl" />
                </Link>
            </div>
          </div>

          {/* Sentiment bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Community Sentiment</span>
              <span className="text-xs font-semibold text-[#00d4ff]">{match.sentiment}%</span>
            </div>
            <div className="w-full bg-[#0a0d12] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#e94560] to-[#ff6b6b] h-2 rounded-full transition-all"
                style={{ width: `${match.sentiment}%` }}
              ></div>
            </div>
          </div>

          {/* View button */}
          <Link href={`/match/${match.id}/predict`} className="w-full py-2 px-4 bg-[#0f3460] hover:bg-[#0f3460]/80 text-white font-medium rounded text-sm transition-colors pointer-events-auto">
            Predict
          </Link>
        </div>
      </div>
    </div>
  )
}
