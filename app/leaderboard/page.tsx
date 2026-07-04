'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getLeaderboard, getPredictions } from '@/lib/api'
import type { LeaderboardEntry } from '@/lib/api'
import type { LeaderboardUser } from '@/lib/types'

const tabs = ['Overall', 'Top Predictors', 'Top Analysts', 'Rising Stars'] as const
type Tab = typeof tabs[number]

const leaderboardRules = [
  { title: 'Prediction Accuracy', description: 'Correct predictions earn +10 points, incorrect lose 2. Confidence bonuses apply.' },
  { title: 'Intel Score', description: 'Your total points determine your rank. Higher scores climb the leaderboard.' },
  { title: 'Active Participation', description: 'Regular predictions keep your streak alive and boost your score.' },
]

const scoreComponents = [
  { label: 'Correct Prediction', description: '+10 base points', icon: '✓' },
  { label: 'High Confidence Bonus', description: '+2 points (90%+)', icon: '🔥' },
  { label: 'Medium Confidence', description: '+1 point (70-89%)', icon: '⭐' },
  { label: 'Incorrect Prediction', description: '-2 points', icon: '✗' },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overall')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [leaderboardStats, setLeaderboardStats] = useState({
    totalMembers: 0,
    totalPredictions: 0,
    averageAccuracy: 0,
    activeAnalysts: 0,
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardData, predictionsData] = await Promise.all([
          getLeaderboard(),
          getPredictions(),
        ])
        
        setLeaderboard(leaderboardData)
        
        const completedPredictions = predictionsData.filter((p) => p.result !== 'pending')
        const correctCount = completedPredictions.filter((p) => p.result === 'correct').length
        const totalAccuracy = completedPredictions.length > 0
          ? Math.round((correctCount / completedPredictions.length) * 100)
          : 0
        
        setLeaderboardStats({
          totalMembers: leaderboardData.length,
          totalPredictions: predictionsData.length,
          averageAccuracy: totalAccuracy,
          activeAnalysts: leaderboardData.filter((u) => u.predictions > 0).length,
        })
      } catch (error) {
        console.error('Error fetching leaderboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const risingStars = leaderboard
    .filter((u) => u.predictions > 0 && u.intelScore > 0 && u.predictions <= 20)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 6)
    .sort((a, b) => b.intelScore - a.intelScore)
    .slice(0, 6)
    .map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      joinedDate: 'Recent',
      scoreGained: u.intelScore,
      accuracy: u.accuracy,
    }))

  const leaderboardUsers: LeaderboardUser[] = leaderboard.map((entry) => ({
    id: entry.id,
    rank: entry.rank,
    username: entry.username,
    avatar: entry.avatar,
    intelScore: entry.intelScore,
    accuracy: entry.accuracy,
    predictions: entry.predictions,
    posts: 0,
    comments: 0,
    streak: entry.streak,
    change: 0,
    joinedDate: '',
  }))

  if (loading) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">Loading leaderboard...</p>
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
                Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">Leaderboard</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl">The most respected analysts, predictors and contributors on CS Intel.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Total Members', value: leaderboardStats.totalMembers.toLocaleString(), accent: false },
                { label: 'Total Predictions', value: leaderboardStats.totalPredictions.toLocaleString(), accent: false },
                { label: 'Average Accuracy', value: `${leaderboardStats.averageAccuracy}%`, accent: true },
                { label: 'Active Analysts', value: leaderboardStats.activeAnalysts.toLocaleString(), accent: false },
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
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Leaderboard</h2>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
                  {tabs.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white shadow-lg shadow-[#e94560]/30' : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>{tab}</button>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                  <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-800 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-3">User</div>
                    <div className="col-span-2 text-center">Intel Score</div>
                    <div className="col-span-2 text-center">Accuracy</div>
                    <div className="col-span-2 text-center hidden sm:block">Streak</div>
                    <div className="col-span-1 text-center hidden md:block">Predictions</div>
                    <div className="col-span-1 text-right">Trend</div>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {leaderboardUsers.map((user) => (
                      <LeaderboardRow key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-6">Rising Stars</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {risingStars.map((star) => (
                    <div key={star.id} className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 hover:border-[#e94560]/30 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white text-sm font-bold">{star.avatar}</div>
                        <div>
                          <p className="text-sm font-semibold text-white">{star.username}</p>
                          <p className="text-[10px] text-gray-500">Joined {star.joinedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-gray-500">Score gained</p>
                          <p className="text-base font-bold text-[#00d4ff]">+{star.scoreGained.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Accuracy</p>
                          <p className="text-base font-bold text-white">{star.accuracy}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Leaderboard Rules</h3>
                <div className="space-y-4">
                  {leaderboardRules.map((rule) => (
                    <div key={rule.title} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] mt-2 flex-shrink-0"></span>
                      <div>
                        <p className="text-sm font-medium text-white">{rule.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">How Intel Score Works</h3>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">Earn points through accurate predictions, quality analysis, and community engagement. The top contributors climb the ranks.</p>
                <div className="space-y-3">
                  {scoreComponents.map((comp) => (
                    <div key={comp.label} className="flex items-start gap-3">
                      <span className="text-base flex-shrink-0">{comp.icon}</span>
                      <div>
                        <p className="text-xs font-medium text-white">{comp.label}</p>
                        <p className="text-[10px] text-gray-500">{comp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Current Season</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Season</span>
                    <span className="text-white font-semibold">Q2 2026</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Time Remaining</span>
                    <span className="text-[#00d4ff] font-semibold">28 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="text-[#e94560] font-semibold">$5,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Top 10 Bonus</span>
                    <span className="text-yellow-400 font-semibold">+20% Score</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/community" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Community</Link>
                  <Link href="/matches" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Matches</Link>
                  <Link href="/profile" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Your Profile</Link>
                  <Link href="/about" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">About CS Intel</Link>
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

function getRankStyle(rank: number) {
  if (rank === 1) return { badge: '🥇', ring: 'ring-yellow-400', bg: 'bg-yellow-400/5', border: 'border-yellow-400/30' }
  if (rank === 2) return { badge: '🥈', ring: 'ring-gray-300', bg: 'bg-gray-300/5', border: 'border-gray-300/30' }
  if (rank === 3) return { badge: '🥉', ring: 'ring-orange-400', bg: 'bg-orange-400/5', border: 'border-orange-400/30' }
  return { badge: `#${rank}`, ring: '', bg: '', border: '' }
}

function LeaderboardRow({ user }: { user: LeaderboardUser }) {
  const style = getRankStyle(user.rank)
  const isChangePositive = user.change > 0
  const isChangeNegative = user.change < 0

  return (
    <Link href={`/profile?id=${user.id}`} className="block">
      <div className={`px-5 py-3.5 hover:bg-[#1a1f2e]/60 transition-colors cursor-pointer group ${style.bg}`}>
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-2 md:col-span-1">
            <span className={`text-sm font-black ${user.rank <= 3 ? 'text-[#e94560]' : 'text-gray-500'}`}>{style.badge}</span>
          </div>
          <div className="col-span-5 md:col-span-3 flex items-center gap-3">
            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${user.rank <= 3 ? 'bg-gradient-to-br from-[#e94560] to-[#ff6b6b] text-white' : 'bg-[#0f1419] border border-gray-700 text-gray-400'}`}>
              {user.avatar}
            </div>
            <span className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors truncate">{user.username}</span>
          </div>
          <div className="col-span-3 md:col-span-2 text-center">
            <span className="text-sm font-bold text-[#00d4ff]">{user.intelScore.toLocaleString()}</span>
          </div>
          <div className="hidden md:block md:col-span-2 text-center">
            <span className="text-sm font-semibold text-white">{user.accuracy}%</span>
          </div>
          <div className="hidden sm:block col-span-2 text-center">
            <span className={`inline-flex items-center gap-1 text-xs font-bold ${user.streak >= 5 ? 'text-orange-400' : user.streak >= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
              {user.streak > 0 && '🔥'}{user.streak}
            </span>
          </div>
          <div className="hidden md:block md:col-span-1 text-center">
            <span className="text-sm text-gray-400">{user.predictions}</span>
          </div>
          <div className="col-span-2 md:col-span-1 flex justify-end">
            {isChangePositive && <span className="text-xs font-bold text-green-400">↑{user.change}</span>}
            {isChangeNegative && <span className="text-xs font-bold text-red-400">↓{Math.abs(user.change)}</span>}
            {user.change === 0 && <span className="text-xs font-bold text-gray-600">—</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}