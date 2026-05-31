'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  predictionMatches,
  communityConsensus,
  topPredictors,
  myPredictions,
  recentCommunityPicks,
  predictionRules,
  seasonStats,
} from '@/lib/data'
import type { PredictionMatch, MyPrediction, CommunityConsensus } from '@/lib/types'

const tabs = ['Today\'s Picks', 'Upcoming Matches', 'Community Consensus', 'My Predictions'] as const
type Tab = typeof tabs[number]

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Today\'s Picks')

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
                { label: 'Predictions Today', value: '2,847', accent: false },
                { label: 'Community Accuracy', value: '64%', accent: true },
                { label: 'Active Predictors', value: '3,891', accent: false },
                { label: 'Matches Available', value: '12', accent: false },
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
                    {predictionMatches.filter(m => m.status === 'upcoming' || m.status === 'live').map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}

                {activeTab === 'Upcoming Matches' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predictionMatches.filter(m => m.status === 'upcoming').map((match) => (
                      <MatchCard key={match.id} match={match} />
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
                        <div className="col-span-2 text-center">Confidence</div>
                        <div className="col-span-2 text-center">Result</div>
                        <div className="col-span-1 text-right">Date</div>
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
                            <span>{pick.confidence}% confidence</span>
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
                <PredictionForm />
              </section>
            </div>

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
                      <span className="text-[#00d4ff] font-bold">64%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#e94560] to-[#00d4ff] rounded-full" style={{ width: '64%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Top 10%</span>
                      <span className="text-green-400 font-bold">78%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Your accuracy</span>
                      <span className="text-yellow-400 font-bold">71%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: '71%' }} />
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

function MatchCard({ match }: { match: PredictionMatch }) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-5 md:p-6 hover:border-[#e94560]/40 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{match.tournament}</span>
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
          <span className="text-2xl">{match.logo1}</span>
          <span className="text-sm font-bold text-white">{match.team1}</span>
        </div>
        <span className="text-xs text-gray-600 font-bold uppercase">vs</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">{match.team2}</span>
          <span className="text-2xl">{match.logo2}</span>
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
          <span className="text-[#e94560] font-bold">{match.prediction1}% {match.team1}</span>
          <span className="text-[#00d4ff] font-bold">{match.prediction2}% {match.team2}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{match.time}</span>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0f1419] border border-gray-700 rounded-lg hover:border-[#e94560]/50 transition-colors">
            View Hub
          </button>
          <button className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all">
            Predict
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========================================================================== */
/* Consensus Row                                                              */
/* ========================================================================== */

function ConsensusRow({ consensus }: { consensus: CommunityConsensus }) {
  const confidenceColor = consensus.confidence === 'high' ? 'text-green-400 border-green-400/20 bg-green-400/10' : consensus.confidence === 'medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' : 'text-gray-400 border-gray-400/20 bg-gray-400/10'

  return (
    <div className="px-5 py-4 hover:bg-[#1a1f2e]/60 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg">{consensus.logo1}</span>
          <span className="text-sm font-semibold text-white">{consensus.team1}</span>
          <span className="text-xs text-gray-600 font-medium">vs</span>
          <span className="text-sm font-semibold text-white">{consensus.team2}</span>
          <span className="text-lg">{consensus.logo2}</span>
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
  )
}

/* ========================================================================== */
/* Prediction Row                                                             */
/* ========================================================================== */

function PredictionRow({ prediction }: { prediction: MyPrediction }) {
  const statusConfig = {
    correct: 'bg-green-400/10 text-green-400 border-green-400/20',
    incorrect: 'bg-red-400/10 text-red-400 border-red-400/20',
    pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  }
  const statusLabel = { correct: 'Correct', incorrect: 'Incorrect', pending: 'Pending' }

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
          <div className="w-16 h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
            <div className="h-full bg-[#e94560] rounded-full" style={{ width: `${prediction.confidence}%` }} />
          </div>
          <span className="text-xs text-gray-400 ml-2">{prediction.confidence}%</span>
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

function PredictionForm() {
  const [confidence, setConfidence] = useState(72)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  return (
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
        <span className="text-xs text-gray-500">ESL Pro League S21</span>
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

        <div>
          <div className="flex items-center justify-between text-sm mb-3">
            <label className="text-gray-300 font-medium">Confidence</label>
            <span className="text-[#e94560] font-bold">{confidence}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full h-2 bg-[#0f1419] rounded-full appearance-none cursor-pointer accent-[#e94560]"
          />
          <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1">
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <button
          disabled={!selectedTeam}
          className={`w-full py-3.5 rounded-lg font-bold transition-all ${
            selectedTeam
              ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white hover:shadow-lg hover:shadow-[#e94560]/50 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit Prediction
        </button>
      </div>
    </div>
  )
}