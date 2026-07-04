import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TeamLogo from '@/components/TeamLogo'
import MatchCardUnified from '@/components/MatchCardUnified'
import { getMatchById, getTeamRatings, getAllTeamStats } from '@/lib/api'
import type { TeamStats } from '@/lib/types'
import Link from 'next/link'

function formatMatchTime(isoTime: string): string {
  if (!isoTime) return ''
  const date = new Date(isoTime)
  const now = new Date()

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const matchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'

  if (matchDate.getTime() === today.getTime()) {
    return `Today ${timeStr}`
  } else if (matchDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${timeStr}`
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).replace(',', ` ${timeStr.split(' ')[1]}`)
  }
 }

interface MatchDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MatchDetailPageProps) {
  const { id } = await params
  return {
    title: `Match ${id} - CS Intel`,
    description: `Match details, teams, and ratings for CS2 match.`,
  }
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params
  const match = await getMatchById(undefined, id)

  if (!match) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Match Not Found</h1>
            <Link href="/matches" className="text-[#e94560] hover:text-[#ff6b6b]">Back to Matches</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const teamStats = await getAllTeamStats()
  const ratingsResult = await getTeamRatings()
  const ratingMap: Record<string, number> = {}
  for (const rating of ratingsResult.ratings) {
    ratingMap[rating.teamId] = rating.rating
  }

  const team1Rating = ratingMap[match.team1.id] ?? 1000
  const team2Rating = ratingMap[match.team2.id] ?? 1000

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    upcoming: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Upcoming' },
    live: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Live' },
    completed: { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Completed' },
  }

  const status = statusColors[match.status] || statusColors.upcoming

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/matches" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
          ← Back to Matches
        </Link>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
              {status.label}
            </div>
            <div className="text-xs text-gray-500 font-medium">{formatMatchTime(match.match_time)}</div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="text-center flex-1">
              <TeamLogo team={match.team1} size="xxl" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-4">{match.team1.name}</h2>
              <p className="text-[#00d4ff] text-sm font-semibold mt-1">{team1Rating} Rating</p>
            </div>

            <div className="text-center">
              <span className="text-gray-500 font-bold text-lg mb-2">VS</span>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-[#e94560] to-transparent hidden md:block"></div>
            </div>

            <div className="text-center flex-1">
              <TeamLogo team={match.team2} size="xxl" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-4">{match.team2.name}</h2>
              <p className="text-[#00d4ff] text-sm font-semibold mt-1">{team2Rating} Rating</p>
            </div>
          </div>

          {match.status === 'completed' && match.score1 !== undefined && match.score2 !== undefined && (
            <div className="text-center mb-6">
              <div className="inline-block bg-[#0f3460] rounded-lg px-6 py-3">
                <span className="text-3xl font-bold text-white">{match.score1} - {match.score2}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tournament</p>
              <p className="font-semibold text-white">{match.tournamentData?.name || match.tournament}</p>
            </div>
          </div>

          <Link
            href={`/match/${id}/predict`}
            className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105"
          >
            Predict Match
          </Link>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Win Rate</p>
              <p className="font-bold text-[#00d4ff] text-lg">
                {teamStats[match.team1.id]?.win_rate ?? 0}%
              </p>
              <p className="text-gray-400 text-xs mt-2">Last 5 Form</p>
              <div className="flex justify-center gap-1 mt-1">
                {(teamStats[match.team1.id]?.last5_form ?? []).map((f, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      f === 'W' ? 'bg-green-400/20 text-green-400 border border-green-400/30' :
                      'bg-red-400/20 text-red-400 border border-red-400/30'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Win Rate</p>
              <p className="font-bold text-[#00d4ff] text-lg">
                {teamStats[match.team2.id]?.win_rate ?? 0}%
              </p>
              <p className="text-gray-400 text-xs mt-2">Last 5 Form</p>
              <div className="flex justify-center gap-1 mt-1">
                {(teamStats[match.team2.id]?.last5_form ?? []).map((f, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      f === 'W' ? 'bg-green-400/20 text-green-400 border border-green-400/30' :
                      'bg-red-400/20 text-red-400 border border-red-400/30'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}