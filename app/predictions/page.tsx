'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TeamLogo from '@/components/TeamLogo'
import { getMatchesWithTeams, getPredictions, getUsers, submitPrediction } from '@/lib/api'
import { useUser } from '@/lib/auth/useUser'
import type { CommunityConsensus, TopPredictor, MyPrediction, RecentCommunityPick } from '@/lib/types'
import type { DbMatch, Prediction, User } from '@/lib/api'

const tabs = ['Today\'s Picks', 'Upcoming Matches', 'Community Consensus', 'My Predictions'] as const
type Tab = typeof tabs[number]
type MatchWithResolvedTeams = DbMatch & {
  team1Data?: DbMatch['team1']
  team2Data?: DbMatch['team2']
  tournamentData?: { name?: string }
}

function getTeam(match: MatchWithResolvedTeams, side: 'team1' | 'team2') {
  return side === 'team1' ? (match.team1Data || match.team1) : (match.team2Data || match.team2)
}

function getTeamName(match: MatchWithResolvedTeams, side: 'team1' | 'team2'): string {
  return getTeam(match, side).name
}

function getTournamentName(match: MatchWithResolvedTeams): string {
  return match.tournamentData?.name || match.tournament
}

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Today\'s Picks')
  const [predictionMatches, setPredictionMatches] = useState<MatchWithResolvedTeams[]>([])
  const [communityConsensus, setCommunityConsensus] = useState<CommunityConsensus[]>([])
  const [topPredictors, setTopPredictors] = useState<TopPredictor[]>([])
  const [myPredictions, setMyPredictions] = useState<MyPrediction[]>([])
  const [recentCommunityPicks, setRecentCommunityPicks] = useState<RecentCommunityPick[]>([])
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const { user, loading: authLoading } = useUser()

  const [communityAccuracy, setCommunityAccuracy] = useState(0)
  const [activePredictorsCount, setActivePredictorsCount] = useState(0)
  const [completedPredsCount, setCompletedPredsCount] = useState(0)
  const [predictionStats, setPredictionStats] = useState({
    predictionsToday: 0,
    correct: 0,
    incorrect: 0,
    pending: 0,
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const matchesData = await getMatchesWithTeams()
      const predictionsData = await getPredictions()
      const usersData = await getUsers()

      setAllPredictions(predictionsData)
      setPredictionMatches(matchesData)
      setActivePredictorsCount(usersData.length)

      const completedPreds = predictionsData.filter((p) => p.result !== 'pending')
      const correctPreds = completedPreds.filter((p) => p.result === 'correct')
      const incorrectPreds = completedPreds.filter((p) => p.result === 'incorrect')
      const pendingPreds = predictionsData.filter((p) => p.result === 'pending')
      const overallAccuracy = completedPreds.length > 0
        ? Math.round((correctPreds.length / completedPreds.length) * 100)
        : 0

      setCommunityAccuracy(overallAccuracy)
      setActivePredictorsCount(usersData.length)
      setCompletedPredsCount(completedPreds.length)
      setPredictionStats({
        predictionsToday: predictionsData.length,
        correct: correctPreds.length,
        incorrect: incorrectPreds.length,
        pending: pendingPreds.length,
      })

      const transformedConsensus: CommunityConsensus[] = []
      const seenMatches = new Set<string>()
      predictionsData.forEach((p: Prediction) => {
        const match = matchesData.find((m) => m.id === p.match_id)
        if (match && !seenMatches.has(match.id)) {
          seenMatches.add(match.id)
          const matchPredictions = predictionsData.filter((pred) => pred.match_id === match.id)
          const prediction1Count = matchPredictions.filter((pred) => pred.prediction === 'team1').length
          const total = matchPredictions.length
          const percentage = total > 0 ? Math.round((prediction1Count / total) * 100) : 50
          const totalPredictions = matchPredictions.length
          const confidence = totalPredictions > 100 ? 'high' : totalPredictions > 50 ? 'medium' : 'low'
          transformedConsensus.push({
            id: match.id,
            team1: getTeamName(match, 'team1'),
            team2: getTeamName(match, 'team2'),
            logo1: getTeam(match, 'team1').logo,
            logo2: getTeam(match, 'team2').logo,
            percentage,
            confidence,
            totalPredictions,
          })
        }
      })

      setCommunityConsensus(transformedConsensus.slice(0, 6))

      const transformedTopPredictors: TopPredictor[] = usersData.map((u: User, i: number) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar || '👤',
        accuracy: overallAccuracy,
        intelScore: u.intel_score,
        streak: 0,
      }))

      setTopPredictors(transformedTopPredictors)

      const transformedMyPredictions: MyPrediction[] = predictionsData
        .filter((p: Prediction) => p.user_id === user?.id)
        .slice(0, 6)
        .map((p: Prediction) => {
          const match = matchesData.find((m) => m.id === p.match_id)
          return {
            id: p.id,
            match: match ? `${getTeamName(match, 'team1')} vs ${getTeamName(match, 'team2')}` : 'Unknown match',
            prediction: match ? (p.prediction === 'team1' ? `${getTeamName(match, 'team1')} wins` : `${getTeamName(match, 'team2')} wins`) : 'Unknown prediction',
            result: (p.result || 'pending') as 'correct' | 'incorrect' | 'pending',
            date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          }
        })

      setMyPredictions(transformedMyPredictions)

      const transformedCommunityPicks: RecentCommunityPick[] = predictionsData.slice(0, 6).map((p: Prediction) => {
        const match = matchesData.find((m) => m.id === p.match_id)
        return {
          id: p.id,
          username: p.username || 'Anonymous',
          avatar: p.avatar || '👤',
          match: match ? `${getTeamName(match, 'team1')} vs ${getTeamName(match, 'team2')}` : 'Unknown match',
          prediction: match ? (p.prediction ? `${getTeamName(match, 'team1')} wins` : `${getTeamName(match, 'team2')} wins`) : 'Unknown prediction',
          timestamp: new Date(p.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' ago',
        }
      })

      setRecentCommunityPicks(transformedCommunityPicks)
    } catch (err: any) {
      setError(err.message || 'Failed to load predictions data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && user?.id && !authLoading) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchData, user?.id, authLoading])  // Rules mirror the actual scoring math implemented by
  // public.evaluate_match_predictions(...) — the previous "+10 / -3" copy
  // was a hold-over from before the confidence-weighted formula shipped.
  // See supabase/migrations/20260623000000_add_predictions_confidence.sql
  // and docs/POST_REMEDIATION_VALIDATION.md for the contract.
  const predictionRules = [
    {
      title: 'One prediction per match',
      description: 'You may only submit one prediction per match. Edit allowed until match resolves.',
    },
    {
      title: 'Scoring system (confidence-weighted)',
      description:
        'Correct = +confidence×10 (≈ +500 at the default 50, up to +1000 at 100). ' +
        'Wrong = −confidence×5 (≈ −250 at 50, up to −500 at 100). ' +
        'Confidence defaults to 50 until a slider is exposed.',
    },
    {
      title: 'Draws (voids) do not move your score',
      description:
        'If a match is ruled void, all predictions on it stay at 0 delta — neither winners nor losers swap points.',
    },
    {
      title: 'Scores never go negative',
      description:
        'If a loss would push your Intel Score below 0, only the available balance is deducted. Reversals (admin corrections) restore exactly what was recorded.',
    },
    {
      title: 'Season resets',
      description: 'Predictions reset each season. Carry-over bonuses awarded to top 100.',
    },
  ] 

  const seasonStats = [
    { label: 'Current Season', value: 'Q2 2026' },
    { label: 'Time Remaining', value: '28 days' },
    { label: 'Prize Pool', value: '$5,000' },
    { label: 'Top 10 Bonus', value: '+20% Score' },
    { label: 'Your Rank', value: '#3,847' },
    { label: 'Your Accuracy', value: '71%' },
  ]

  if (loading) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">Loading predictions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Error loading predictions</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 via-transparent to-[#0f3460]/5"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e94560]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8 md:pb-10">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                Predictions <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">Centre</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl">Track community predictions, make your picks and monitor your accuracy.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Predictions Today', value: String(predictionStats.predictionsToday), accent: false },
                { label: 'Community Accuracy', value: `${communityAccuracy}%`, accent: true },
                { label: 'Active Predictors', value: String(activePredictorsCount), accent: false },
                { label: 'Matches Available', value: String(predictionMatches.length), accent: false },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg p-4 md:p-5 border ${stat.accent ? 'bg-gradient-to-br from-[#e94560]/10 to-[#0f3460]/10 border-[#e94560]/30' : 'bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-gray-700'}`}>
                  <p className={`text-2xl md:text-3xl font-bold mb-1 ${stat.accent ? 'text-[#00d4ff]' : 'text-white'}`}>{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-8">

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Predictions</h2>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
                  {tabs.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white shadow-lg shadow-[#e94560]/30' : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>{tab}</button>
                  ))}
                </div>

{activeTab === 'Today\'s Picks' && (
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {predictionMatches.filter(m => m.status === 'upcoming').map((match) => (
                        <MatchCard key={match.id} match={match} onPredict={setMatchId} userId={user?.id} hasPredicted={!!allPredictions.find(p => p.match_id === match.id && p.user_id === user?.id)} />
                      ))}
                    </div>
                 )}

                 {activeTab === 'Upcoming Matches' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {predictionMatches.filter(m => m.status === 'upcoming').map((match) => (
                       <MatchCard key={match.id} match={match} onPredict={setMatchId} userId={user?.id} hasPredicted={!!allPredictions.find(p => p.match_id === match.id && p.user_id === user?.id)} />
                     ))}
                   </div>
                 )}

                {activeTab === 'Community Consensus' && (
                  <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-800">
                      {communityConsensus.map((consensus) => (
                        <ConsensusRow key={consensus.id} consensus={consensus} />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'My Predictions' && (
                  <div>
<div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden mb-6">
               <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-800 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                 <div className="col-span-4">Match</div>
                 <div className="col-span-3 text-center">Prediction</div>
                 <div className="col-span-2 text-center">Result</div>
                 <div className="col-span-1 text-right">Date</div>
                 <div className="col-span-2"></div>
               </div>
               <div className="divide-y divide-gray-800">
                 {myPredictions.map((pred) => (
                   <PredictionRow key={pred.id} prediction={pred} />
                 ))}
               </div>
             </div>

                    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Your Overall Accuracy</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Correct</span>
                            <span className="text-green-400 font-bold">4</span>
                          </div>
                          <div className="w-full h-2 bg-[#0f1419] rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: '67%' }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Incorrect</span>
                            <span className="text-red-400 font-bold">1</span>
                          </div>
                          <div className="w-full h-2 bg-[#0f1419] rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: '17%' }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Pending</span>
                            <span className="text-yellow-400 font-bold">1</span>
                          </div>
                          <div className="w-full h-2 bg-[#0f1419] rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: '16%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                        <p className="text-sm text-gray-400">Overall Accuracy</p>
                        <p className="text-3xl font-black text-white">67%</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-6">Recent Community Picks</h2>
                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                  <div className="space-y-5">
                    {recentCommunityPicks.map((pick) => (
                      <div key={pick.id} className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {pick.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{pick.username}</span>
                            <span className="text-xs text-gray-500">predicted</span>
                            <span className="text-sm font-medium text-[#00d4ff]">{pick.prediction}</span>
                          </div>
<div className="flex items-center gap-3 text-xs text-gray-500">
                             <span>{pick.match}</span>
                             <span>•</span>
                             <span>{pick.timestamp}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-6">Make a Prediction</h2>
                <PredictionForm userId={user?.id} />
              </section>
            </div>

{matchId && (
               <PredictionModal
                 matchId={matchId}
                 onClose={() => setMatchId(null)}
                 onSuccess={fetchData}
                 userId={user?.id}
               />
             )}

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Top Predictors</h3>
                <div className="space-y-3">
                  {topPredictors.map((predictor) => (
                    <Link key={predictor.id} href={`/profile?id=${predictor.id}`} className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg border border-gray-800 hover:border-[#e94560]/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {predictor.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{predictor.username}</p>
                        <p className="text-xs text-gray-500">{predictor.accuracy}% accuracy • {predictor.streak} streak</p>
                      </div>
                      <span className="text-xs font-bold text-[#00d4ff]">{predictor.intelScore.toLocaleString()}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Prediction Rules</h3>
                <div className="space-y-4">
                  {predictionRules.map((rule) => (
                    <div key={rule.title} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] mt-2 flex-shrink-0"></span>
                      <div>
                        <p className="text-sm font-medium text-white">{rule.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Current Season</h3>
                <div className="space-y-3">
                  {seasonStats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{stat.label}</span>
                      <span className="text-white font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-3">Community Accuracy</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Overall</span>
                      <span className="text-[#00d4ff] font-bold">{communityAccuracy}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#e94560] to-[#00d4ff] rounded-full" style={{ width: `${communityAccuracy}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Correct</span>
                      <span className="text-green-400 font-bold">{predictionStats.correct}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${completedPredsCount > 0 ? Math.round((predictionStats.correct / completedPredsCount) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Incorrect</span>
                      <span className="text-red-400 font-bold">{predictionStats.incorrect}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${completedPredsCount > 0 ? Math.round((predictionStats.incorrect / completedPredsCount) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Pending</span>
                      <span className="text-yellow-400 font-bold">{predictionStats.pending}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${allPredictions.length > 0 ? Math.round((predictionStats.pending / allPredictions.length) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/community" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Community</Link>
                  <Link href="/matches" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Matches</Link>
                  <Link href="/rankings" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Rankings</Link>
                  <Link href="/leaderboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Leaderboard</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

/* ========================================================================== */
/* Match Card                                                                 */
/* ========================================================================== */

function MatchCard({ match, onPredict, userId, hasPredicted }: { match: MatchWithResolvedTeams; onPredict: (matchId: string) => void; userId?: string; hasPredicted?: boolean }) {
  if (!match?.id) {
    return null
  }
  return (
    <Link href={`/match/${match.id}`} className="block">
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-5 md:p-6 hover:border-[#e94560]/40 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{getTournamentName(match)}</span>
        {match.status === 'live' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-400/10 text-red-400 border border-red-400/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            Live
          </span>
        )}
      </div>

<div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <TeamLogo team={getTeam(match, 'team1')} size="xl" />
          <span className="text-sm font-bold text-white">{getTeamName(match, 'team1')}</span>
        </div>
        <span className="text-xs text-gray-600 font-bold uppercase">vs</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">{getTeamName(match, 'team2')}</span>
          <TeamLogo team={getTeam(match, 'team2')} size="xl" />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-400">Community picks</span>
          <span className="text-gray-500">{match.prediction1 + match.prediction2}% voted</span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-[#0f1419]">
          <div className="bg-[#e94560] h-full rounded-l-full" style={{ width: `${match.prediction1}%` }} />
          <div className="bg-[#00d4ff] h-full rounded-r-full" style={{ width: `${match.prediction2}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-[#e94560] font-bold">{match.prediction1}% {getTeamName(match, 'team1')}</span>
            <span className="text-[#00d4ff] font-bold">{match.prediction2}% {getTeamName(match, 'team2')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{match.time}</span>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.preventDefault(); onPredict?.(match.id) }}
            disabled={!userId}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              userId
                ? hasPredicted
                  ? 'text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-600/50'
                  : 'text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] hover:shadow-lg hover:shadow-[#e94560]/50'
                : 'text-gray-500 bg-gray-700 cursor-not-allowed'
            }`}
          >
            {!userId ? 'Login to predict' : hasPredicted ? 'Update Prediction' : 'Predict'}
          </button>
        </div>
      </div>
    </div>
    </Link>
  )
}

/* ========================================================================== */
/* Consensus Row                                                              */
/* ========================================================================== */

function ConsensusRow({ consensus }: { consensus: CommunityConsensus }) {
const confidenceColor = consensus.confidence === 'high' ? 'text-green-400 border-green-400/20 bg-green-400/10' : consensus.confidence === 'medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' : 'text-gray-400 border-gray-400/20 bg-gray-400/10'

  return (
    <Link href={`/match/${consensus.id}`} className="block">
      <div className="px-5 py-4 hover:bg-[#1a1f2e]/60 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <TeamLogo logo={consensus.logo1} name={consensus.team1} size="sm" />
            <span className="text-sm font-semibold text-white">{consensus.team1}</span>
            <span className="text-xs text-gray-600 font-medium">vs</span>
            <span className="text-sm font-semibold text-white">{consensus.team2}</span>
            <TeamLogo logo={consensus.logo2} name={consensus.team2} size="sm" />
          </div>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${confidenceColor}`}>
            {consensus.confidence}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{consensus.totalPredictions.toLocaleString()} predictions</span>
              <span>{consensus.percentage}% community pick</span>
            </div>
            <div className="w-full h-2 bg-[#0f1419] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full" style={{ width: `${consensus.percentage}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ========================================================================== */
/* Prediction Row                                                             */
/* ========================================================================== */

function PredictionRow({ prediction }: { prediction: MyPrediction }) {
  const statusConfig: Record<MyPrediction['result'], string> = {
    correct: 'bg-green-400/10 text-green-400 border-green-400/20',
    incorrect: 'bg-red-400/10 text-red-400 border-red-400/20',
    pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    void: 'bg-gray-400/10 text-gray-300 border-gray-400/20',
  }
  const statusLabel: Record<MyPrediction['result'], string> = {
    correct: 'Correct',
    incorrect: 'Incorrect',
    pending: 'Pending',
    void: 'Void (Draw)',
  }

  return (
    <div className="px-5 py-3.5 hover:bg-[#1a1f2e]/60 transition-colors">
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-12 md:col-span-4">
          <p className="text-sm font-semibold text-white">{prediction.match}</p>
          <p className="text-xs text-gray-500 md:hidden">{prediction.date}</p>
        </div>
        <div className="hidden md:block md:col-span-3 text-center">
          <span className="text-sm text-[#00d4ff] font-medium">{prediction.prediction}</span>
        </div>
        <div className="hidden md:flex md:col-span-2 items-center justify-center">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig[prediction.result]}`}>
            {statusLabel[prediction.result]}
          </span>
        </div>
        <div className="hidden md:block md:col-span-1 text-right">
          <span className="text-xs text-gray-500">{prediction.date}</span>
        </div>
      </div>
      <div className="md:hidden mt-2 flex items-center justify-between">
        <span className="text-xs text-[#00d4ff] font-medium">{prediction.prediction}</span>
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig[prediction.result]}`}>
          {statusLabel[prediction.result]}
        </span>
      </div>
    </div>
  )
}

/* ========================================================================== */
/* Prediction Form                                                            */
/* ========================================================================== */

function PredictionForm({ matchId, onSuccess, userId }: { matchId?: string; onSuccess?: () => void; userId?: string }) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedTeam || !matchId) {
      return
    }
    if (!userId) {
      setShowLoginPrompt(true)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const result = await submitPrediction(
      matchId,
      selectedTeam === 'team1'
    )
    if (!result.success) {
      setSubmitError(result.error || 'Failed to submit prediction')
    } else if (onSuccess) {
      onSuccess()
    }
    setSubmitting(false)
    setSelectedTeam(null)
  }

  return (
    <>
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/30 rounded-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-3xl block mb-1">🔥</span>
              <p className="text-sm font-bold text-white">Spirit</p>
            </div>
            <span className="text-lg font-black text-gray-600">VS</span>
            <div className="text-center">
              <span className="text-3xl block mb-1">⚡</span>
              <p className="text-sm font-bold text-white">FaZe</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">ESL Pro League S21</div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Select your prediction</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedTeam('team1')}
                className={`py-3 rounded-lg text-sm font-semibold transition-all border ${
                  selectedTeam === 'team1'
                    ? 'bg-[#e94560]/10 border-[#e94560] text-[#e94560]'
                    : 'bg-[#0f1419] border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Spirit wins
              </button>
              <button
                onClick={() => setSelectedTeam('team2')}
                className={`py-3 rounded-lg text-sm font-semibold transition-all border ${
                  selectedTeam === 'team2'
                    ? 'bg-[#00d4ff]/10 border-[#00d4ff] text-[#00d4ff]'
                    : 'bg-[#0f1419] border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                FaZe wins
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedTeam || submitting}
            className={`w-full py-3.5 rounded-lg font-bold transition-all ${
              selectedTeam && !submitting
                ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white hover:shadow-lg hover:shadow-[#e94560]/50 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Prediction'}
          </button>

          {submitError && (
            <p className="mt-3 text-sm text-red-400">{submitError}</p>
          )}
        </div>
      </div>

      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border border-gray-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4">Login Required</h3>
            <p className="text-gray-400 mb-6">Please log in to submit predictions.</p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded hover:shadow-lg hover:shadow-[#e94560]/50 transition-all text-center" onClick={() => setShowLoginPrompt(false)}>
                Login
              </Link>
              <button onClick={() => setShowLoginPrompt(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded hover:bg-[#0f1419] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PredictionModal({ matchId, onClose, onSuccess, userId }: { matchId: string; onClose: () => void; onSuccess: () => void; userId?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] border border-gray-700 rounded-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Submit Prediction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-5">
          <PredictionForm matchId={matchId} onSuccess={() => { onClose(); onSuccess(); }} userId={userId} />
        </div>
      </div>
    </div>
  )
}