import Link from 'next/link'
import TeamLogo from '@/components/TeamLogo'
import type { Match, TeamStats } from '@/lib/types'
import { getExpectedMatchChange } from '@/lib/ratings'

interface FeaturedMatchProps {
  match: Match
  teamStats?: {
    team1?: TeamStats
    team2?: TeamStats
  }
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
  if (form.length === 0) return <span className="text-xs text-gray-500">No matches</span>

  return (
    <div className="flex gap-1">
      {form.map((f, i) => (
        <span
          key={i}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
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

function TeamSummary({ name, stats }: { name: string, stats?: TeamStats }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Win Rate</p>
        <p className="text-sm font-bold text-[#00d4ff]">{stats?.win_rate ?? 0}%</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Form</p>
        <div className="flex justify-center">
          <FormBadges form={stats?.last5_form ?? []} />
        </div>
      </div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Streak</p>
        <p className="text-sm font-bold text-white">{formatStreak(stats)}</p>
      </div>
      <div className="col-span-3 text-xs text-gray-500">{name} • {stats?.wins ?? 0}W / {stats?.losses ?? 0}L / {stats?.total_matches ?? 0} matches</div>
    </div>
  )
}

export default function FeaturedMatch({ match, teamStats, matchRatings }: FeaturedMatchProps) {
  const rating1 = matchRatings?.[match.team1.id ?? ''] ?? 1000
  const rating2 = matchRatings?.[match.team2.id ?? ''] ?? 1000
  const tournamentName = match.tournamentData?.name || match.tournament
  const expected = getExpectedMatchChange(rating1, rating2)

  return (
    <div className="block relative">
      <Link href={`/match/${match.id}`} className="absolute inset-0 rounded-lg z-0" aria-label={`Open match ${match.team1.name} vs ${match.team2.name}`} />
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/20 to-[#0f3460]/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div className="relative z-10 bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/50 rounded-lg p-6 md:p-8 group card-hover pointer-events-none">
          {/* Featured badge */}
          <div className="inline-block mb-6">
            <span className="px-3 py-1 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-xs font-bold uppercase rounded-full">
              Featured Match
            </span>
          </div>

          {/* Tournament info */}
          <div className="mb-8">
            <Link href={`/tournament/${formatSlug(tournamentName)}`} className="pointer-events-auto">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                {tournamentName}
              </h2>
            </Link>
            <p className="text-sm text-gray-400">{match.time}</p>
          </div>

{/* Teams container */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
              {/* Team 1 */}
              <Link href={`/team/${getTeamSlug(match.team1)}`} className="flex flex-col items-center md:items-start mb-6 md:mb-0 pointer-events-auto">
                <TeamLogo team={match.team1} size="xxl" />
                <h3 className="text-2xl md:text-3xl font-bold text-white mt-3">
                  {match.team1.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-[#e94560] bg-[#e94560]/10 border border-[#e94560]/20 px-2 py-0.5 rounded">
                    {rating1} Rating
                  </span>
                  <span className="text-[10px] text-gray-400">
                    +{expected.aWinsChange} / {expected.aLosesChange}
                  </span>
                </div>
              </Link>

              {/* VS divider */}
              <div className="text-center mb-6 md:mb-0">
                <p className="text-gray-500 font-bold text-lg">VS</p>
              </div>

              {/* Team 2 */}
              <Link href={`/team/${getTeamSlug(match.team2)}`} className="flex flex-col items-center md:items-end pointer-events-auto">
                <TeamLogo team={match.team2} size="xxl" />
                <h3 className="text-2xl md:text-3xl font-bold text-white mt-3">
                  {match.team2.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400">
                    +{expected.bWinsChange} / {expected.bLosesChange}
                  </span>
                  <span className="text-xs font-bold text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2 py-0.5 rounded">
                    {rating2} Rating
                  </span>
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <TeamSummary name={match.team1.name} stats={teamStats?.team1} />
              <TeamSummary name={match.team2.name} stats={teamStats?.team2} />
            </div>

            {/* Evidence score */}
            <div className="bg-[#0a0d12]/50 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Evidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-[#00d4ff]">
                    {match.evidenceScore}
                  </div>
                  <span className="text-gray-500">/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Predictions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#0a0d12]/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">{match.team1.name}</p>
              <p className="text-2xl font-bold text-[#00d4ff]">{match.prediction1}%</p>
            </div>
            <div className="bg-[#0a0d12]/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">{match.team2.name}</p>
              <p className="text-2xl font-bold text-[#00d4ff]">{match.prediction2}%</p>
            </div>
          </div>

          {/* CTA Button */}
          <Link href={`/match/${match.id}/predict`} className="w-full py-3 px-6 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105 pointer-events-auto">
            Predict
          </Link>
        </div>
      </div>
    </div>
  )
}
