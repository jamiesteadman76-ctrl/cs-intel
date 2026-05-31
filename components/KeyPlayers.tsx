import type { Match } from '@/lib/types'

interface KeyPlayersProps {
  match: Match
}

export default function KeyPlayers({ match }: KeyPlayersProps) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Key Players</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team 1 Players */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-lg">{match.team1.name}</h4>
          <div className="space-y-4">
            {match.team1Players.map((player) => (
              <div
                key={player.id}
                className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 card-hover"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white text-lg font-bold">
                      {player.avatar}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{player.name}</p>
                    <div className="flex gap-4 text-xs text-gray-400 mt-1">
                      <span>Rating: <span className="text-[#00d4ff] font-bold">{player.rating.toFixed(2)}</span></span>
                      <span>K/D: <span className="text-[#00d4ff] font-bold">{player.kd.toFixed(2)}</span></span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {player.recentForm.map((form, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${form === '✓' ? 'bg-green-500' : 'bg-red-500'}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 Players */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-lg">{match.team2.name}</h4>
          <div className="space-y-4">
            {match.team2Players.map((player) => (
              <div
                key={player.id}
                className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 card-hover"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg font-bold">
                      {player.avatar}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{player.name}</p>
                    <div className="flex gap-4 text-xs text-gray-400 mt-1">
                      <span>Rating: <span className="text-[#00d4ff] font-bold">{player.rating.toFixed(2)}</span></span>
                      <span>K/D: <span className="text-[#00d4ff] font-bold">{player.kd.toFixed(2)}</span></span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {player.recentForm.map((form, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${form === '✓' ? 'bg-green-500' : 'bg-red-500'}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
