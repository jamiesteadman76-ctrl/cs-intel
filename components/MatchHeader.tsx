import type { Match } from '@/lib/types'

interface MatchHeaderProps {
  match: Match
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  upcoming: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Upcoming' },
  live: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Live' },
  finished: { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Finished' },
}

export default function MatchHeader({ match }: MatchHeaderProps) {
  const status = statusColors[match.status]

  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 md:p-8 mb-8">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-6">
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
          {status.label}
        </div>
        <div className="text-xs text-gray-500 font-medium">{match.time}</div>
      </div>

      {/* Match display */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-8">
        {/* Team 1 */}
        <div className="text-center flex-1">
          <div className="text-6xl md:text-7xl mb-3">{match.team1.logo}</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{match.team1.name}</h2>
        </div>

        {/* VS divider */}
        <div className="text-center">
          <p className="text-gray-500 font-bold text-lg mb-2">VS</p>
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-[#e94560] to-transparent hidden md:block"></div>
        </div>

        {/* Team 2 */}
        <div className="text-center flex-1">
          <div className="text-6xl md:text-7xl mb-3">{match.team2.logo}</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{match.team2.name}</h2>
        </div>
      </div>

      {/* Tournament info */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-gray-700">
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tournament</p>
          <p className="font-semibold text-white">{match.tournament}</p>
        </div>
        <div className="hidden sm:block w-px h-6 bg-gray-700"></div>
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Evidence Score</p>
          <p className="font-bold text-[#00d4ff] text-lg">{match.evidenceScore}/10</p>
        </div>
      </div>
    </div>
  )
}
