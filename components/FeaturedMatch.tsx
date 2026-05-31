import type { Match } from '@/lib/types'

interface FeaturedMatchProps {
  match: Match
}

export default function FeaturedMatch({ match }: FeaturedMatchProps) {
  return (
    <div className="relative">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/20 to-[#0f3460]/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/50 rounded-lg p-6 md:p-8 group card-hover">
        {/* Featured badge */}
        <div className="inline-block mb-6">
          <span className="px-3 py-1 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-xs font-bold uppercase rounded-full">
            Featured Match
          </span>
        </div>

        {/* Tournament info */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            {match.tournament}
          </h2>
          <p className="text-sm text-gray-400">{match.time}</p>
        </div>

        {/* Teams container */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            {/* Team 1 */}
            <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
              <div className="text-6xl md:text-7xl mb-3">{match.team1.logo}</div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {match.team1.name}
              </h3>
            </div>

            {/* VS divider */}
            <div className="text-center mb-6 md:mb-0">
              <p className="text-gray-500 font-bold text-lg">VS</p>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center md:items-end">
              <div className="text-6xl md:text-7xl mb-3">{match.team2.logo}</div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {match.team2.name}
              </h3>
            </div>
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
        <button className="w-full py-3 px-6 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105">
          Open Match Hub
        </button>
      </div>
    </div>
  )
}
