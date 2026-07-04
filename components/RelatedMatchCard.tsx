import Link from 'next/link'
import TeamLogo from '@/components/TeamLogo'
import type { Match } from '@/lib/types'

interface RelatedMatchCardProps {
  match: Match
}

const resultColors: Record<string, string> = {
  team1_win: 'text-green-400',
  team2_win: 'text-green-400',
  draw: 'text-yellow-400',
}

export default function RelatedMatchCard({ match }: RelatedMatchCardProps) {
  const showResult = match.status === 'completed' && match.result
  const tournamentName = match.tournamentData?.name || match.tournament

  return (
    <Link href={`/match/${match.id}`} className="block">
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/50 transition-all card-hover">
        {/* Tournament badge */}
        <p className="text-xs font-semibold text-[#00d4ff] uppercase tracking-wider mb-3">
          {tournamentName}
        </p>

{/* Teams */}
       <div className="mb-4">
         <div className="flex items-center justify-between gap-2 mb-3">
           <div className="flex items-center gap-2 flex-1 min-w-0">
             <TeamLogo team={match.team1} size="sm" />
             <span className="text-xs font-medium text-white truncate">{match.team1.name}</span>
           </div>
           {showResult && (
             <span className={`text-xs font-bold ${resultColors[match.result!]}`}>
               {match.result === 'team1_win' ? 'WIN' : match.result === 'team2_win' ? 'WIN' : 'DRAW'}
             </span>
           )}
         </div>
         <div className="flex items-center justify-between gap-2">
           <div className="flex items-center gap-2 flex-1 min-w-0">
             <TeamLogo team={match.team2} size="sm" />
             <span className="text-xs font-medium text-white truncate">{match.team2.name}</span>
           </div>
         </div>
       </div>

        {/* Time */}
        <p className="text-xs text-gray-500 text-center border-t border-gray-800 pt-3">
          {match.time}
        </p>
      </div>
    </Link>
  )
}
