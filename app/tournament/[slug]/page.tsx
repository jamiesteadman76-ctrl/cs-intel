import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MatchCardUnified from '@/components/MatchCardUnified'
import { getTournamentBySlug, getMatchesByTournament, getAllTeamStats } from '@/lib/api'
import type { TeamStats } from '@/lib/types'
import Link from 'next/link'

interface TournamentPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TournamentPageProps) {
  const { slug } = await params
  return {
    title: `Tournament - CS Intel`,
    description: `Tournament details and matches.`,
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { slug } = await params
  const tournament = await getTournamentBySlug(undefined, slug)

  if (!tournament) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h1>
            <Link href="/matches" className="text-[#e94560] hover:text-[#ff6b6b]">Back to Matches</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const tournamentId = tournament.id || ''
  const matches = await getMatchesByTournament(undefined, tournamentId)
  const teamStats = await getAllTeamStats()

  const liveMatches = matches.filter(m => m.status === 'live')
  const upcomingMatches = matches.filter(m => m.status === 'upcoming')
  const completedMatches = matches.filter(m => m.status === 'completed')

  const statusColors: Record<string, { bg: string; text: string }> = {
    live: { bg: 'bg-red-500/20', text: 'text-red-300' },
    upcoming: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
    completed: { bg: 'bg-gray-500/20', text: 'text-gray-300' },
  }

  const status = statusColors[tournament.status || 'upcoming'] || statusColors.upcoming

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/matches" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
          ← Back to Matches
        </Link>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{tournament.name}</h1>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
              {tournament.status || 'upcoming'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tournament.prize_pool && (
              <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Prize Pool</p>
                <p className="text-xl font-bold text-[#e94560]">{tournament.prize_pool}</p>
              </div>
            )}

            {tournament.location && (
              <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Location</p>
                <p className="text-xl font-bold text-white">{tournament.location}</p>
              </div>
            )}

            {tournament.start_date && (
              <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Start Date</p>
                <p className="text-xl font-bold text-white">{formatDate(tournament.start_date)}</p>
              </div>
            )}

            {tournament.end_date && (
              <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">End Date</p>
                <p className="text-xl font-bold text-white">{formatDate(tournament.end_date)}</p>
              </div>
            )}
          </div>
        </div>

        {liveMatches.length > 0 && (
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              Live Matches
            </h2>
            <div className="space-y-4">
              {liveMatches.map(match => (
                <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/50 transition-all">
                  <MatchCardUnified
                    key={match.id}
                    match={{
                      id: match.id,
                      team1: match.team1,
                      team2: match.team2,
                      tournament: match.tournament,
                      time: match.time,
                      status: match.status,
                      result: match.result,
                      score1: match.score1,
                      score2: match.score2,
                    }}
                    teamStats={{
                      team1: teamStats[match.team1.id],
                      team2: teamStats[match.team2.id],
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingMatches.length > 0 && (
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 text-blue-300">Upcoming Matches</h2>
            <div className="space-y-4">
              {upcomingMatches.map(match => (
                <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/50 transition-all">
                  <MatchCardUnified
                    key={match.id}
                    match={{
                      id: match.id,
                      team1: match.team1,
                      team2: match.team2,
                      tournament: match.tournament,
                      time: match.time,
                      status: match.status,
                      result: match.result,
                      score1: match.score1,
                      score2: match.score2,
                    }}
                    teamStats={{
                      team1: teamStats[match.team1.id],
                      team2: teamStats[match.team2.id],
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {completedMatches.length > 0 && (
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-gray-300">Completed Matches</h2>
            <div className="space-y-4">
              {completedMatches.map(match => (
                <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/50 transition-all">
                  <MatchCardUnified
                    key={match.id}
                    match={{
                      id: match.id,
                      team1: match.team1,
                      team2: match.team2,
                      tournament: match.tournament,
                      time: match.time,
                      status: match.status,
                      result: match.result,
                      score1: match.score1,
                      score2: match.score2,
                    }}
                    teamStats={{
                      team1: teamStats[match.team1.id],
                      team2: teamStats[match.team2.id],
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No matches found for this tournament.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}