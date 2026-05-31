import type { MatchTournament } from '@/lib/types'

interface TournamentInfoWidgetProps {
  tournament: MatchTournament
}

export default function TournamentInfoWidget({
  tournament,
}: TournamentInfoWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 mb-6 sticky top-24">
      <h3 className="text-lg font-bold text-white mb-6">Tournament Info</h3>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Name</p>
          <p className="text-sm font-semibold text-white">{tournament.name}</p>
        </div>

        <div className="h-px bg-gray-800"></div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Stage</p>
          <p className="text-sm font-semibold text-white">{tournament.stage}</p>
        </div>

        <div className="h-px bg-gray-800"></div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Prize Pool</p>
          <p className="text-lg font-bold text-[#00d4ff]">{tournament.prizePool}</p>
        </div>

        <div className="h-px bg-gray-800"></div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Teams</p>
          <p className="text-sm font-semibold text-white">{tournament.teamCount} teams</p>
        </div>
      </div>

      <button className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold rounded text-sm hover:shadow-lg hover:shadow-[#e94560]/50 transition-all">
        View Tournament
      </button>
    </div>
  )
}
