import type { Ranking } from '@/lib/types'

interface RankingItemProps {
  ranking: Ranking
}

export default function RankingItem({ ranking }: RankingItemProps) {
  const isPositive = ranking.change > 0
  const isNeutral = ranking.change === 0

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-800 last:border-b-0 hover:bg-[#1a1f2e]/50 transition-colors">
      {/* Rank */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold text-sm">
          {ranking.rank}
        </div>

        {/* Team */}
        <div>
          <p className="font-semibold text-white">{ranking.team}</p>
        </div>
      </div>

      {/* Rating and change */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-[#00d4ff]">{ranking.rating}</p>
        </div>
        <div
          className={`w-12 text-center font-semibold text-sm flex items-center justify-center ${
            isPositive
              ? 'text-green-400'
              : isNeutral
                ? 'text-gray-500'
                : 'text-red-400'
          }`}
        >
          {isPositive ? (
            <span>
              ↑{ranking.change}
            </span>
          ) : isNeutral ? (
            <span>—</span>
          ) : (
            <span>
              ↓{Math.abs(ranking.change)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
