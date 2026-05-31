import type { Match } from '@/lib/types'

interface MatchCardProps {
  match: Match
}

export default function MatchCard({ match }: MatchCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 md:p-6 hover:border-[#e94560]/50 transition-all card-hover group">
      {/* Header with tournament */}
      <div className="mb-4">
        <span className="text-xs font-semibold text-[#00d4ff] uppercase tracking-wider">
          {match.tournament}
        </span>
        <p className="text-xs text-gray-500 mt-1">{match.time}</p>
      </div>

      {/* Teams */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-3xl">{match.team1.logo}</div>
            <div>
              <p className="font-semibold text-white">{match.team1.name}</p>
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">VS</div>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div>
              <p className="font-semibold text-white text-right">{match.team2.name}</p>
            </div>
            <div className="text-3xl">{match.team2.logo}</div>
          </div>
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
      <button className="w-full py-2 px-4 bg-[#0f3460] hover:bg-[#0f3460]/80 text-white font-medium rounded text-sm transition-colors">
        View Match
      </button>
    </div>
  )
}
