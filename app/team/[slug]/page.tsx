export const dynamic = 'force-dynamic'
export const revalidate = 0

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TeamLogo from '@/components/TeamLogo'
import MatchCardUnified from '@/components/MatchCardUnified'
import { getTeamBySlug, getTeamMatches, getRatingsForTeam, getAllTeamStats } from '@/lib/api'
import type { TeamStats } from '@/lib/types'
import Link from 'next/link'

interface TeamPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TeamPageProps) {
  const { slug } = await params
  return {
    title: `Team - CS Intel`,
    description: `Team profile, recent matches, and statistics.`,
  }
}

function FormBadges({ form }: { form: string[] }) {
  if (form.length === 0) {
    return <span className="text-[10px] text-gray-500">No matches</span>
  }

  return (
    <div className="flex items-center gap-1">
      {form.map((f, i) => (
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
  )
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params
  const team = await getTeamBySlug(undefined, slug)

  if (!team) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
            <Link href="/matches" className="text-[#e94560] hover:text-[#ff6b6b]">Back to Matches</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const teamId = team.id || ''
  const recentMatches = await getTeamMatches(undefined, teamId)
  const ratings = await getRatingsForTeam(undefined, teamId)
  const teamStats = await getAllTeamStats()

  const currentStats = teamStats[teamId] || {
    total_matches: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    last5_form: [],
    current_streak: { type: null, count: 0 },
  }
  const winRate = currentStats.win_rate
  const last5Form = currentStats.last5_form

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/matches" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
          ← Back to Matches
        </Link>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <TeamLogo team={{ name: team.name, logo: team.logo || '🎮' }} size="xxl" />
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{team.name}</h1>
              {team.country && (
                <p className="text-gray-400 mt-2">{team.country}</p>
              )}
              {team.founded_year && (
                <p className="text-gray-500 text-sm mt-1">Founded: {team.founded_year}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rating</p>
              <p className="text-3xl font-bold text-[#00d4ff]">{ratings?.rating ?? team.rating ?? 1000}</p>
            </div>

            <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Win Rate</p>
              <p className="text-3xl font-bold text-white">{winRate}%</p>
            </div>

            <div className="bg-[#0a0d12] border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Last 5 Form</p>
              <div className="flex justify-center mt-2">
                <FormBadges form={last5Form.map(f => f.toString())} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>
          {recentMatches.length > 0 ? (
            <div className="space-y-4">
              {recentMatches.slice(0, 5).map(match => (
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
          ) : (
            <p className="text-gray-400 text-center py-8">No matches found for this team.</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}