import Link from 'next/link'
import type { Match, TeamStats } from '@/lib/types'
import { getExpectedMatchChange } from '@/lib/ratings'

interface MatchSnapshotProps {
  match: Match
  teamStats?: {
    team1: TeamStats
    team2: TeamStats
  }
  matchRatings?: Record<string, number>
}

function FormBadge({ form }: { form: string }) {
  return (
    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
      form === 'W' ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 'bg-red-400/20 text-red-400 border border-red-400/30'
    }`}>
      {form}
    </span>
  )
}

function formatStreak(stats: TeamStats | undefined) {
  if (!stats?.current_streak.type || stats.current_streak.count === 0) return '—'
  return `${stats.current_streak.type}${stats.current_streak.count}`
}

export default function MatchSnapshot({ match, teamStats, matchRatings }: MatchSnapshotProps) {
  const team1Stats = teamStats?.team1
  const team2Stats = teamStats?.team2
  const rating1 = matchRatings?.[match.team1.id ?? ''] ?? 1000
  const rating2 = matchRatings?.[match.team2.id ?? ''] ?? 1000
  const expected = getExpectedMatchChange(rating1, rating2)

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Match Snapshot</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recent Form (computed from match history) */}
        <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <Link href={`/match/${match.id}`} className="absolute inset-0 rounded-lg z-0" aria-label={`Open match ${match.team1.name} vs ${match.team2.name}`} />
          <div className="relative z-10 pointer-events-none">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Recent Form (Last 5)</p>
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-[#00d4ff]">{team1Stats?.wins ?? 0}</span>
              <span className="text-sm text-gray-500">W / {team1Stats?.total_matches ?? 0} matches</span>
            </div>
            <div className="flex gap-1 mb-3">
              {(team1Stats?.last5_form ?? []).map((form, i) => (
                <FormBadge key={i} form={form} />
              ))}
            </div>
            <p className="text-xs text-gray-500">{match.team1.name}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-[#00d4ff]">{team2Stats?.wins ?? 0}</span>
              <span className="text-sm text-gray-500">W / {team2Stats?.total_matches ?? 0} matches</span>
            </div>
            <div className="flex gap-1 mb-3">
              {(team2Stats?.last5_form ?? []).map((form, i) => (
                <FormBadge key={i} form={form} />
              ))}
            </div>
            <p className="text-xs text-gray-500">{match.team2.name}</p>
          </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <Link href={`/match/${match.id}`} className="absolute inset-0 rounded-lg z-0" aria-label={`Open match ${match.team1.name} vs ${match.team2.name}`} />
          <div className="relative z-10 pointer-events-none">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Win Rate</p>
          <div className="mb-4">
            <p className="text-2xl font-bold text-green-400 mb-2">{team1Stats?.win_rate ?? 0}%</p>
            <p className="text-xs text-gray-500">{match.team1.name}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-2xl font-bold text-green-400 mb-2">{team2Stats?.win_rate ?? 0}%</p>
            <p className="text-xs text-gray-500">{match.team2.name}</p>
          </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <Link href={`/match/${match.id}`} className="absolute inset-0 rounded-lg z-0" aria-label={`Open match ${match.team1.name} vs ${match.team2.name}`} />
          <div className="relative z-10 pointer-events-none">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Current Streak</p>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg font-bold ${
                team1Stats?.current_streak.type === 'W' ? 'text-green-400' :
                team1Stats?.current_streak.type === 'L' ? 'text-red-400' : 'text-gray-500'
              }`}>
                {formatStreak(team1Stats)}
              </span>
              <span className="text-sm text-gray-500">{team1Stats?.total_matches ?? 0} matches</span>
            </div>
            <p className="text-xs text-gray-500">{match.team1.name}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg font-bold ${
                team2Stats?.current_streak.type === 'W' ? 'text-green-400' :
                team2Stats?.current_streak.type === 'L' ? 'text-red-400' : 'text-gray-500'
              }`}>
                {formatStreak(team2Stats)}
              </span>
              <span className="text-sm text-gray-500">{team2Stats?.total_matches ?? 0} matches</span>
            </div>
            <p className="text-xs text-gray-500">{match.team2.name}</p>
          </div>
          </div>
        </div>

        {/* Rating */}
        <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <Link href={`/match/${match.id}`} className="absolute inset-0 rounded-lg z-0" aria-label={`Open match ${match.team1.name} vs ${match.team2.name}`} />
          <div className="relative z-10 pointer-events-none">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Rating</p>
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-[#e94560]">{rating1}</span>
            </div>
            <div className="text-[10px] text-gray-400">
              +{expected.aWinsChange} / {expected.aLosesChange}
            </div>
            <p className="text-xs text-gray-500">{match.team1.name}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-[#00d4ff]">{rating2}</span>
            </div>
            <div className="text-[10px] text-gray-400">
              +{expected.bWinsChange} / {expected.bLosesChange}
            </div>
            <p className="text-xs text-gray-500">{match.team2.name}</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}