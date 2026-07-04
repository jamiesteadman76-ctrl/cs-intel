import type { LeaderboardEntry } from '@/lib/api'

interface RankingItemProps {
  entry: LeaderboardEntry
}

export default function RankingItem({ entry }: RankingItemProps) {
  // We don't have change data, so we set it to 0 for neutral
  const change = 0
  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-800 last:border-b-0 hover:bg-[#1a1f2e]/50 transition-colors">
      {/* Rank */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold text-sm">
          {entry.rank}
        </div>

        {/* Team */}
        <div>
          <p className="font-semibold text-white">{entry.username}</p>
        </div>
      </div>

      {/* Rating and change */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-[#00d4ff]">{entry.intelScore}</p>
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
              ↑{change}
            </span>
          ) : isNeutral ? (
            <span>—</span>
          ) : (
            <span>
              ↓{Math.abs(change)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}