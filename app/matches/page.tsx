import Link from 'next/link'
import Header from '@/components/Header'
import MatchHeader from '@/components/MatchHeader'
import CommunityConfidence from '@/components/CommunityConfidence'
import MatchSnapshot from '@/components/MatchSnapshot'
import KeyPlayers from '@/components/KeyPlayers'
import CommunityDiscussionFeed from '@/components/CommunityDiscussionFeed'
import CommunityPredictionsWidget from '@/components/CommunityPredictionsWidget'
import IntelFeed from '@/components/IntelFeed'
import MatchCardUnified from '@/components/MatchCardUnified'
import TournamentInfoWidget from '@/components/TournamentInfoWidget'
import Footer from '@/components/Footer'
import { getMatchesWithTeams, getMatchPredictions, getComments, getAllTeamStats, getTeamRatings } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { TeamStats } from '@/lib/types'

export const metadata = {
  title: 'Match Hub - CS Intel',
  description: 'In-depth match analysis, community predictions, and betting intelligence.',
}

export default async function MatchPage() {
  const matches = await getMatchesWithTeams()
  const teamStats = await getAllTeamStats()
  const ratingsResult = await getTeamRatings()
  const ratingMap: Record<string, number> = {}
  for ( const rating of ratingsResult.ratings ) {
    ratingMap[rating.teamId] = rating.rating
  }

  const featuredMatch = matches.find(m => m.status === 'upcoming' || m.status === 'live') || matches[0]

  let matchPredictions: any[] = []
  let matchComments: any[] = []
  let intelUpdates: any[] = []

  if (featuredMatch) {
    const [predictions, comments, intelData] = await Promise.all([
      getMatchPredictions(featuredMatch.id).catch(() => [] as any[]),
      getComments().then(all => all.filter((c: any) => c.match_id === featuredMatch.id)).catch(() => [] as any[]),
      Promise.resolve(
        supabase
          .from('intel_posts')
          .select('id, title, category, created_at, views')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(5)
      ).then(({ data }) => (data || [])).catch(() => [] as any[]),
    ])
    matchPredictions = predictions.slice(0, 5)
    matchComments = comments.slice(0, 5)
    intelUpdates = (intelData || []).map((post: any) => ({
      id: post.id,
      content: post.title,
      timestamp: new Date(post.created_at).toLocaleString(),
      icon: post.category === 'roster-change' ? '🔄' : post.category === 'tournament' ? '🏆' : post.category === 'betting' ? '💰' : '📊',
    }))
  }

  const relatedMatches = featuredMatch
    ? matches.filter(m => m.id !== featuredMatch.id).slice(0, 4)
    : matches.slice(0, 4)

  const safeFeatured = featuredMatch || {
    id: '',
    match_time: '',
    status: 'upcoming' as const,
    result: undefined,
    team1: { id: '', name: 'TBD', logo: '🎮', country: undefined },
    team2: { id: '', name: 'TBD', logo: '🎮', country: undefined },
    tournament: 'No upcoming matches',
    tournamentId: null,
    team1Players: [],
    team2Players: [],
    time: '',
    sentiment: 50,
    prediction1: 50,
    prediction2: 50,
    evidenceScore: 0,
    score1: undefined,
    score2: undefined,
    recentForm1: [],
    recentForm2: [],
    mapPoolAdvantage: '',
    headToHeadWins1: 0,
    headToHeadWins2: 0,
    reasons: [],
  }

  const featuredTeam1Stats: TeamStats = featuredMatch ? teamStats[featuredMatch.team1.id] || {
    total_matches: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    last5_form: [],
    current_streak: { type: null, count: 0 },
  } : { total_matches: 0, wins: 0, losses: 0, win_rate: 0, last5_form: [], current_streak: { type: null, count: 0 } }

  const featuredTeam2Stats: TeamStats = featuredMatch ? teamStats[featuredMatch.team2.id] || {
    total_matches: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    last5_form: [],
    current_streak: { type: null, count: 0 },
  } : { total_matches: 0, wins: 0, losses: 0, win_rate: 0, last5_form: [], current_streak: { type: null, count: 0 } }

  const getMatchRatings = (match: typeof safeFeatured) => ({
    [match.team1.id]: ratingMap[match.team1.id] ?? 1000,
    [match.team2.id]: ratingMap[match.team2.id] ?? 1000,
  })

  return (
    <div className="bg-[#0f1419] text-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!featuredMatch ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No matches available yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Match Header */}
            <MatchHeader match={safeFeatured} />

            {/* Community Confidence */}
            <CommunityConfidence match={safeFeatured} />

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - main content */}
              <div className="lg:col-span-2">
                {/* Match Snapshot */}
                <MatchSnapshot match={safeFeatured} teamStats={{ team1: featuredTeam1Stats, team2: featuredTeam2Stats }} />

                {/* Key Players */}
                <KeyPlayers match={safeFeatured} />

                {/* Community Discussion */}
                <CommunityDiscussionFeed comments={matchComments} />

                {/* Community Predictions */}
                <CommunityPredictionsWidget predictions={matchPredictions} />

                {/* Intel Feed */}
                <IntelFeed updates={intelUpdates} />

{/* Related Matches */}
                 {relatedMatches.length > 0 && (
                   <div className="mb-8">
                     <h3 className="text-xl font-bold text-white mb-6">Upcoming Matches</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                       {relatedMatches.map((match) => (
                         <MatchCardUnified
                           key={match.id}
                           match={match}
                           teamStats={{
                             team1: teamStats[match.team1.id],
                             team2: teamStats[match.team2.id],
                           }}
                         />
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              {/* Right column - sidebar */}
              <div>
                {safeFeatured.tournamentId && (
                  <TournamentInfoWidget tournament={{
                    name: safeFeatured.tournamentData?.name || safeFeatured.tournament,
                    stage: 'Upcoming',
                    prizePool: 'TBD',
                    teamCount: 0,
                  }} />
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
