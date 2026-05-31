import type { Match } from '@/lib/types'

interface CommunityConfidenceProps {
  match: Match
}

export default function CommunityConfidence({ match }: CommunityConfidenceProps) {
  const total = match.prediction1 + match.prediction2

  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 md:p-8 mb-8">
      <h3 className="text-xl font-bold text-white mb-8">Community Confidence</h3>

      {/* Confidence bars */}
      <div className="mb-8">
        {/* Team 1 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">{match.team1.name}</h4>
            <span className="text-2xl font-bold text-[#00d4ff]">{match.prediction1}%</span>
          </div>
          <div className="w-full bg-[#0a0d12] rounded-full h-4">
            <div
              className="bg-gradient-to-r from-[#e94560] to-[#ff6b6b] h-4 rounded-full transition-all"
              style={{ width: `${match.prediction1}%` }}
            ></div>
          </div>
        </div>

        {/* Team 2 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">{match.team2.name}</h4>
            <span className="text-2xl font-bold text-[#00d4ff]">{match.prediction2}%</span>
          </div>
          <div className="w-full bg-[#0a0d12] rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all"
              style={{ width: `${match.prediction2}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Reasons */}
      <div className="bg-[#0a0d12]/50 rounded-lg p-4 border border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">
          Why the community favours {match.team1.name}
        </p>
        <ul className="space-y-2">
          {match.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-[#00d4ff] font-bold mt-0.5">✓</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
