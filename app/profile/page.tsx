'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPredictions, calculateIntelScore } from '@/lib/api'
import { useUser } from '@/lib/auth/useUser'
import type { Prediction } from '@/lib/api'

interface PredictionHistoryItem {
  id: string
  matchId: string
  prediction: string
  date: string
  result: 'correct' | 'incorrect' | 'pending' | 'void'
  team1?: string
  team2?: string
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'predictions' | 'posts' | 'activity'>('predictions')
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intelScore, setIntelScore] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const { user, loading: authLoading } = useUser()

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const allPredictions = await getPredictions()
        const filtered = allPredictions.filter((p) => p.user_id === user.id)
        setUserPredictions(filtered)

        const completed = filtered.filter((p) => p.result !== 'pending')
        const correctCount = completed.filter((p) => p.result === 'correct').length
        const acc = completed.length > 0 ? Math.round((correctCount / completed.length) * 100) : 0
        const score = calculateIntelScore(filtered)

        const sortedPredictions = [...filtered].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        let streak = 0
        let maxStreak = 0
        for (const p of sortedPredictions) {
          if (p.result === 'correct') {
            streak++
            maxStreak = Math.max(maxStreak, streak)
          } else if (p.result === 'incorrect') {
            streak = 0
          }
        }

        setAccuracy(acc)
        setIntelScore(score)
        setCurrentStreak(maxStreak)
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchData()
    }
  }, [user?.id, authLoading])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && user?.id && !authLoading) {
        getPredictions()
          .then(allPredictions => {
            const filtered = allPredictions.filter((p) => p.user_id === user.id)
            setUserPredictions(filtered)

            const completed = filtered.filter((p) => p.result !== 'pending')
            const correctCount = completed.filter((p) => p.result === 'correct').length
            const acc = completed.length > 0 ? Math.round((correctCount / completed.length) * 100) : 0
            const score = calculateIntelScore(filtered)

            const sortedPredictions = [...filtered].sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )

            let streak = 0
            let maxStreak = 0
            for (const p of sortedPredictions) {
              if (p.result === 'correct') {
                streak++
                maxStreak = Math.max(maxStreak, streak)
              } else if (p.result === 'incorrect') {
                streak = 0
              }
            }

            setAccuracy(acc)
            setIntelScore(score)
            setCurrentStreak(maxStreak)
          })
          .catch((error) => {
            console.error('Error refreshing profile data:', error)
          })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user?.id, authLoading])

  const predictionHistory: PredictionHistoryItem[] = userPredictions.map((p) => ({
    id: p.id,
    matchId: p.match_id,
    prediction: p.prediction === 'team1' ? 'Team 1 wins' : 'Team 2 wins',
    date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    result: p.result || 'pending',
  }))

  if (loading) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">Loading profile...</p>
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

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8 md:pb-12">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-lg shadow-[#e94560]/30">
                    👤
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {user?.email?.split('@')[0] || 'User'}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Member since 2024
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
                    CS Intel predictor and analyst.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <button disabled className="px-6 py-2.5 border border-gray-600 text-gray-500 font-semibold rounded-lg cursor-not-allowed text-sm">
                    Message
                  </button>
                  <button className="px-6 py-2.5 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:border-[#e94560]/50 hover:text-white transition-all text-sm">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-8">

              <section>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-6">
                  Profile Stats
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Intel Score', value: intelScore.toLocaleString(), accent: true },
                    { label: 'Predictions', value: userPredictions.length.toLocaleString(), accent: false },
                    { label: 'Accuracy', value: `${accuracy}%`, accent: true },
                    { label: 'Current Streak', value: `${currentStreak}`, accent: false },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-lg p-5 text-center border ${
                        stat.accent
                          ? 'bg-gradient-to-br from-[#e94560]/10 to-[#0f3460]/10 border-[#e94560]/30'
                          : 'bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-gray-700'
                      }`}
                    >
                      <p className={`text-2xl md:text-3xl font-bold mb-1 ${stat.accent ? 'text-[#00d4ff]' : 'text-white'}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs md:text-sm text-gray-400 font-medium uppercase tracking-wider">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Prediction History
                  </h2>
                  {predictionHistory.length > 0 && (
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        <span className="text-gray-400">
                          {(predictionHistory.filter(p => p.result === 'correct').length / predictionHistory.length * 100).toFixed(0)}% Win Rate
                        </span>
                      </span>
                      <span className="text-gray-500">
                        {predictionHistory.filter(p => p.result === 'correct').length}/{predictionHistory.length} correct
                      </span>
                    </div>
                  )}
                </div>

                {predictionHistory.length > 0 ? (
                  <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-800">
                      {predictionHistory.map((prediction) => (
                        <div
                          key={prediction.id}
                          className="p-5 hover:bg-[#1a1f2e]/80 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                <span className="text-sm font-semibold text-white">
                                  Match Prediction
                                </span>
                              </div>
<div className="flex flex-wrap items-center gap-2">
                                 <span className="text-sm text-gray-300">
                                   Prediction: <span className="text-[#00d4ff] font-semibold">{prediction.prediction}</span>
                                 </span>
                                 <span className="text-xs text-gray-500">
                                   {prediction.date}
                                 </span>
                               </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  prediction.result === 'correct'
                                    ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                                    : prediction.result === 'incorrect'
                                      ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                                      : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                                }`}
                              >
                                {                                   prediction.result === 'correct'
                                    ? '✓ Correct'
                                    : prediction.result === 'void'
                                      ? '~ Void (Draw)'
                                      : prediction.result === 'incorrect'
                                        ? '✗ Incorrect'
                                        : '~ Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-8 text-center">
                    <p className="text-gray-400">No predictions yet. Start predicting to build your Intel Score!</p>
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Content & Activity
                  </h2>
                  <div className="flex items-center gap-1 bg-[#1a1f2e] border border-gray-700 rounded-lg p-1">
                    {(['predictions', 'posts', 'activity'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all capitalize ${
                          activeTab === tab
                            ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
{activeTab === 'predictions' && (
                    predictionHistory.length > 0 ? (
                      <div className="divide-y divide-gray-800">
                        {predictionHistory.map((prediction) => (
                          <div key={`tab-${prediction.id}`} className="p-5 hover:bg-[#1a1f2e]/80 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5">
                                  <span className="text-sm font-semibold text-white">Match Prediction</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm text-gray-300">
                                    Predicted: <span className="text-[#00d4ff] font-semibold">{prediction.prediction}</span>
                                  </span>
                                  <span className="text-xs text-gray-500">{prediction.date}</span>
                                </div>
                              </div>
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    prediction.result === 'correct'
                                    ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                                    : prediction.result === 'void'
                                      ? 'bg-gray-400/10 text-gray-300 border border-gray-400/20'
                                      : prediction.result === 'incorrect'
                                        ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                                        : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                                }`}
                              >
                                {                                   prediction.result === 'correct'
                                    ? '✓ Correct'
                                    : prediction.result === 'void'
                                      ? '~ Void (Draw)'
                                      : prediction.result === 'incorrect'
                                        ? '✗ Incorrect'
                                        : '~ Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">No prediction activity yet.</p>
                      </div>
                    )
                  )}

                  {activeTab === 'posts' && (
                    <div className="p-8 text-center">
                      <p className="text-gray-400">No posts yet.</p>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="p-8 text-center">
                      <p className="text-gray-400">No recent activity.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Intel Score
                </h3>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b] mb-2">
                    {intelScore.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-400">
                    Based on {userPredictions.length} predictions
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {accuracy}% accuracy
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/predictions" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Make Prediction</Link>
                  <Link href="/leaderboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Leaderboard</Link>
                  <Link href="/matches" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Matches</Link>
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