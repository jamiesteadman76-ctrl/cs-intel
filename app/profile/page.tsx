'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  profileStats,
  profileActivities,
  predictionHistory,
  topAnalysisPosts,
  reputationSources,
  achievements,
  favoriteTeams,
  recentFollowers,
  communityStanding,
} from '@/lib/data'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'predictions' | 'posts' | 'activity'>('predictions')

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main>
        {/* ============================================ */}
        {/* PROFILE HEADER                                  */}
        {/* ============================================ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 via-transparent to-[#0f3460]/5"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e94560]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8 md:pb-12">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-lg shadow-[#e94560]/30">
                    👤
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      ClutchKing
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e94560]/10 border border-[#e94560]/30 rounded-full text-xs font-semibold text-[#e94560] w-fit">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Top Contributor
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Joined January 2024
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-lg">🇷🇺</span>
                      Russia
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-[#00d4ff] font-semibold">
                      12,450 Reputation
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
                    CS2 bettor since 2017. Focused on map pools and underdog value. Always looking for edges in the betting markets through deep analysis.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105 text-sm">
                    Follow
                  </button>
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

        {/* ============================================ */}
        {/* MAIN CONTENT GRID                              */}
        {/* ============================================ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ========== LEFT COLUMN ========== */}
            <div className="lg:col-span-2 space-y-8">

              {/* -------------------------------------------- */}
              {/* PROFILE STATS                                 */}
              {/* -------------------------------------------- */}
              <section>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-6">
                  Profile Stats
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Reputation', value: profileStats.reputation.toLocaleString(), accent: true },
                    { label: 'Total Posts', value: profileStats.totalPosts.toLocaleString(), accent: false },
                    { label: 'Comments', value: profileStats.comments.toLocaleString(), accent: false },
                    { label: 'Predictions', value: profileStats.predictionsMade.toLocaleString(), accent: false },
                    { label: 'Accuracy', value: `${profileStats.predictionAccuracy}%`, accent: true },
                    { label: 'Upvotes', value: profileStats.upvotesReceived.toLocaleString(), accent: false },
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

              {/* -------------------------------------------- */}
              {/* PREDICTION HISTORY                           */}
              {/* -------------------------------------------- */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Prediction History
                  </h2>
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
                </div>

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
                                {prediction.team1}
                              </span>
                              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">vs</span>
                              <span className="text-sm font-semibold text-white">
                                {prediction.team2}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-gray-300">
                                Prediction: <span className="text-[#00d4ff] font-semibold">{prediction.prediction}</span>
                              </span>
                              <span className="text-xs text-gray-500">
                                {prediction.confidence}% confidence
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
                              {prediction.result === 'correct' ? '✓ Correct' : prediction.result === 'incorrect' ? '✗ Incorrect' : '~ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* -------------------------------------------- */}
              {/* TAB SECTION: Recent Activity / Top Posts      */}
              {/* -------------------------------------------- */}
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
                  {activeTab === 'activity' && (
                    <div className="divide-y divide-gray-800">
                      {profileActivities.map((activity) => (
                        <div key={activity.id} className="p-5 hover:bg-[#1a1f2e]/80 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0f1419] border border-gray-700 flex items-center justify-center text-lg">
                              {activity.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 leading-relaxed">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {activity.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'posts' && (
                    <div className="divide-y divide-gray-800">
                      {topAnalysisPosts.map((post) => (
                        <div key={post.id} className="p-5 hover:bg-[#1a1f2e]/80 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#e94560]/10 text-[#e94560] border border-[#e94560]/20 mb-2">
                                {post.category}
                              </span>
                              <h3 className="text-base font-semibold text-white mb-2 leading-snug">
                                {post.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                  {post.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                  </svg>
                                  {post.replies}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.519-7.594A2 2 0 0015.378 8H4.066a2 2 0 00-1.934 2.333l.003.017z" />
                                  </svg>
                                  {post.upvotes}
                                </span>
                                <span className="text-gray-500">{post.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'predictions' && (
                    <div className="divide-y divide-gray-800">
                      {predictionHistory.map((prediction) => (
                        <div key={`tab-${prediction.id}`} className="p-5 hover:bg-[#1a1f2e]/80 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                <span className="text-sm font-semibold text-white">{prediction.team1}</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">vs</span>
                                <span className="text-sm font-semibold text-white">{prediction.team2}</span>
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
                                  : prediction.result === 'incorrect'
                                    ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                                    : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                              }`}
                            >
                              {prediction.result === 'correct' ? '✓ Correct' : prediction.result === 'incorrect' ? '✗ Incorrect' : '~ Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* -------------------------------------------- */}
              {/* REPUTATION BREAKDOWN                          */}
              {/* -------------------------------------------- */}
              <section>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-6">
                  Reputation Breakdown
                </h2>

                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6">
                  <div className="space-y-5">
                    {reputationSources.map((source) => (
                      <div key={source.label}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{source.icon}</span>
                            <span className="text-sm font-medium text-gray-200">{source.label}</span>
                          </div>
                          <span className="text-sm font-bold text-[#00d4ff]">
                            {(source.points / source.maxPoints * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#0f1419] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#e94560] to-[#00d4ff] rounded-full"
                            style={{ width: `${(source.points / source.maxPoints) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {source.points.toLocaleString()} / {source.maxPoints.toLocaleString()} points
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Reputation</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">
                      {profileStats.reputation.toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>

              {/* -------------------------------------------- */}
              {/* TOP ANALYSIS POSTS                            */}
              {/* -------------------------------------------- */}
              <section>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-6">
                  Top Analysis Posts
                </h2>

                <div className="space-y-4">
                  {topAnalysisPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 hover:border-[#e94560]/50 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#e94560]/10 text-[#e94560] border border-[#e94560]/20 mb-2">
                            {post.category}
                          </span>
                          <h3 className="text-base font-semibold text-white mb-2 leading-snug">
                            {post.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              {post.views.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                              </svg>
                              {post.replies}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.519-7.594A2 2 0 0015.378 8H4.066a2 2 0 00-1.934 2.333l.003.017z" />
                              </svg>
                              {post.upvotes}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-xs text-gray-500">{post.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ========== RIGHT SIDEBAR ========== */}
            <div className="space-y-6">

              {/* Current Rank */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Current Rank
                </h3>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b] mb-2">
                    #{communityStanding.rank}
                  </div>
                  <p className="text-sm text-gray-400">
                    Top {communityStanding.percentile}% of community
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {communityStanding.totalMembers.toLocaleString()} members
                  </p>
                </div>
              </div>

              {/* Next Achievement Progress */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Next Achievement</h3>
                <div className="text-center py-3">
                  <div className="text-4xl mb-3">💰</div>
                  <p className="text-base font-semibold text-white mb-1">Betting Guru</p>
                  <p className="text-xs text-gray-400 mb-4">
                    50+ successful betting recommendations
                  </p>
                  <div className="w-full h-2 bg-[#0f1419] rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full" style={{ width: '82%' }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">41 / 50 predictions</span>
                    <span className="text-[#00d4ff] font-semibold">82%</span>
                  </div>
                </div>
              </div>

              {/* Recent Followers */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Recent Followers
                </h3>
                <div className="space-y-3">
                  {recentFollowers.map((follower) => (
                    <div key={follower.username} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {follower.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{follower.username}</p>
                        <p className="text-xs text-gray-500">{follower.followedDate}</p>
                      </div>
                      <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-[#0f3460] rounded hover:bg-[#0f3460]/80 transition-colors">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite Teams */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  Favorite Teams
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {favoriteTeams.map((team) => (
                    <div
                      key={team.name}
                      className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg border border-gray-800 hover:border-[#e94560]/30 transition-colors"
                    >
                      <span className="text-xl">{team.logo}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{team.name}</p>
                        <p className="text-xs text-gray-500">Since {team.followedSince}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  Achievements
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`relative group text-center ${
                        achievement.unlocked ? 'cursor-pointer' : 'opacity-40'
                      }`}
                    >
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl border-2 mb-1.5 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-[#e94560]/20 to-[#ff6b6b]/20 border-[#e94560]/50'
                          : 'bg-[#0f1419] border-gray-700'
                      }`}>
                        {achievement.icon}
                      </div>
                      <p className="text-[10px] font-semibold text-gray-300 truncate leading-tight">
                        {achievement.name}
                      </p>
                      {achievement.unlocked && achievement.unlockedDate && (
                        <p className="text-[9px] text-gray-500">
                          {achievement.unlockedDate}
                        </p>
                      )}
                    </div>
                  ))}
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