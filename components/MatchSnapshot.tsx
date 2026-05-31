import type { Match } from '@/lib/types'

interface MatchSnapshotProps {
  match: Match
}

export default function MatchSnapshot({ match }: MatchSnapshotProps) {
  const recentFormScore1 = match.recentForm1.filter(f => f === '✓').length
  const recentFormScore2 = match.recentForm2.filter(f => f === '✓').length

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Match Snapshot</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recent Form */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Recent Form</p>
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-[#00d4ff]">{recentFormScore1}</span>
              <span className="text-sm text-gray-500">/ 5</span>
            </div>
            <div className="flex gap-1 mb-3">
              {match.recentForm1.map((form, i) => (
                <div
                  key={i}
                  className={`w-2 h-8 rounded ${form === '✓' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
              ))}
            </div>
            <p className="text-xs text-gray-500">{match.team1.name}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-[#00d4ff]">{recentFormScore2}</span>
              <span className="text-sm text-gray-500">/ 5</span>
            </div>
            <div className="flex gap-1 mb-3">
              {match.recentForm2.map((form, i) => (
                <div
                  key={i}
                  className={`w-2 h-8 rounded ${form === '✓' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
              ))}
            </div>
            <p className="text-xs text-gray-500">{match.team2.name}</p>
          </div>
        </div>

        {/* Map Pool Advantage */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Map Pool</p>
          <p className="text-2xl font-bold text-[#00d4ff] mb-2">{match.mapPoolAdvantage}</p>
          <p className="text-xs text-gray-500">
            {match.team1.name} has a stronger overall pool based on recent performance
          </p>
        </div>

        {/* Player Form */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Player Form</p>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-400 mb-1">Top Performer</p>
              <p className="font-semibold text-white">s1mple (NAVI)</p>
              <p className="text-xs text-[#00d4ff] font-bold">1.31 Rating</p>
            </div>
          </div>
        </div>

        {/* Head to Head */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 card-hover">
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider font-semibold">Head to Head</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">{match.team1.name}</p>
              <p className="text-2xl font-bold text-[#00d4ff]">{match.headToHeadWins1}</p>
            </div>
            <div className="h-px bg-gray-700"></div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{match.team2.name}</p>
              <p className="text-2xl font-bold text-[#00d4ff]">{match.headToHeadWins2}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
