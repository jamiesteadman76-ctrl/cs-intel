'use client'

import { useEffect, useState } from 'react'
import TeamLogo from '@/components/TeamLogo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  getCommunityStats,
  getCommunityCategories,
  getCommunityPosts,
  getCommunityTags,
  getNewestMembers,
  CommunityStats,
  CommunityPost,
  CommunityCategory,
  NewestMember,
} from '@/lib/api/community'
import { getMatchesWithTeams, getLeaderboard } from '@/lib/api'
import type { LeaderboardEntry } from '@/lib/api'

type TrendingMatch = { team1: string; team2: string; tournament: string; time: string; logo1: string; logo2: string }

function formatTimestamp(dateString?: string | null): string {
  if (!dateString?.trim()) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days ago`
}

function formatJoinedDate(dateString?: string | null): string {
  if (!dateString?.trim()) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours < 24) return 'Joined today'
  const diffDays = Math.floor(diffHours / 24)
  return `Joined ${diffDays} days ago`
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'latest' | 'hot' | 'top'>('latest')

  const [stats, setStats] = useState<CommunityStats>({ totalMembers: 0, activeUsers: 0, postsToday: 0, commentsToday: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [tags, setTags] = useState<{name: string; posts: number}[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [trendingMatches, setTrendingMatches] = useState<TrendingMatch[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [newestMembers, setNewestMembers] = useState<NewestMember[]>([])
  const [newestLoading, setNewestLoading] = useState(true)
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, categoriesData, postsData, tagsData, matchesData, membersData, contributorsData] = await Promise.all([
          getCommunityStats(),
          getCommunityCategories(),
          getCommunityPosts(),
          getCommunityTags(),
          getMatchesWithTeams(),
          getNewestMembers(),
          getLeaderboard(),
        ])
        setStats(statsData)
        setCategories(categoriesData)
        setPosts(postsData.map(p => ({ ...p, timestamp: formatTimestamp(p.timestamp) })))
        setTags(tagsData)
        setTrendingMatches(matchesData.slice(0, 3).map(m => ({
          team1: m.team1.name,
          team2: m.team2.name,
          tournament: m.tournament,
          time: m.time,
          logo1: m.team1.logo,
          logo2: m.team2.logo,
        })))
        setNewestMembers(membersData.map(m => ({ ...m, joinedDate: formatJoinedDate(m.joinedDate) })))
        setContributors(contributorsData)
      } catch (error) {
        console.error('Failed to fetch community data:', error)
      } finally {
        setStatsLoading(false)
        setCategoriesLoading(false)
        setPostsLoading(false)
        setTagsLoading(false)
        setTrendingLoading(false)
        setNewestLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 via-transparent to-[#0f3460]/5"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e94560]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-12 md:pb-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                CS Intel{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">
                  Community
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Join discussions about CS2 matches, teams, betting markets, roster
                changes and tournament storylines.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {[{ label: 'Total Members', value: stats.totalMembers.toLocaleString(), icon: '👥' },
                { label: 'Active Now', value: stats.activeUsers.toLocaleString(), icon: '🟢' },
                { label: 'Posts Today', value: stats.postsToday.toLocaleString(), icon: '📝' },
                { label: 'Comments Today', value: stats.commentsToday.toLocaleString(), icon: '💬' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 md:p-6 text-center hover:border-[#e94560]/50 transition-all group"
                >
                  <div className="text-2xl md:text-3xl mb-2">{stat.icon}</div>
                  <p className="text-2xl md:text-3xl font-bold text-white mb-1 group-hover:text-[#00d4ff] transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
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
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      Trending Discussions
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Hot topics the community is debating right now</p>
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    🔥 Live
                  </span>
                </div>

                <div className="space-y-4">
                  {postsLoading ? [] : posts.length === 0 ? (
                    <div className="rounded-lg border border-gray-700 bg-[#0f1419] p-6 text-center text-sm text-gray-400">
                      No data available yet
                    </div>
                  ) : posts.slice(0, 4).map((post, index) => (
                    <div
                      key={post.id}
                      className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6 hover:border-[#e94560]/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 hidden sm:flex flex-col items-center">
                          <span className="text-xs text-gray-500 font-bold mb-1">#{index + 1}</span>
                          <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.519-7.594A2 2 0 0015.378 8H4.066a2 2 0 00-1.934 2.333l.003.017z" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-[#e94560] transition-colors leading-snug mb-3">
                            {post.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.519-7.594A2 2 0 0015.378 8H4.066a2 2 0 00-1.934 2.333l.003.017z" />
                              </svg>
                              {post.upvotes}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                              </svg>
                              {post.replies}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              {post.views.toLocaleString()}
                            </span>
                            <span className="text-[#00d4ff] font-medium">
                              Posted: {post.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Top Contributors
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Leading analysts by Intel Score</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {contributors.slice(0, 8).map((contributor) => (
                    <div key={contributor.id} className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold mx-auto mb-2">
                        {contributor.avatar?.charAt(0) ?? '?'}
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{contributor.username}</p>
                      <p className="text-xs text-gray-500">Score: {contributor.intelScore.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      Community Categories
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Browse discussions by topic</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoriesLoading ? [] : categories.length === 0 ? (
                    <div className="rounded-lg border border-gray-700 bg-[#0f1419] p-6 text-center text-sm text-gray-400 sm:col-span-2 lg:col-span-3">
                      No data available yet
                    </div>
                  ) : categories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 hover:border-[#e94560]/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{category.icon}</span>
                        <h3 className="font-semibold text-white group-hover:text-[#e94560] transition-colors text-sm md:text-base">
                          {category.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          <span className="text-[#00d4ff] font-semibold">{category.posts.toLocaleString()}</span> posts
                        </span>
                        <span className="text-green-400">
                          {category.viewing} viewing
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      Latest Posts
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Fresh from the community</p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#1a1f2e] border border-gray-700 rounded-lg p-1">
                    {(['latest', 'hot', 'top'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
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
                  <div className="divide-y divide-gray-800">
                    {postsLoading ? [] : posts.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">
                        No data available yet
                      </div>
                    ) : posts.map((post) => (
                      <div
                        key={post.id}
                        className="p-5 md:p-6 hover:bg-[#1a1f2e]/80 transition-colors cursor-pointer"
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 hidden sm:flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560]/80 to-[#ff6b6b]/80 flex items-center justify-center text-white font-bold text-sm">
                              {post.avatar}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-[#00d4ff]">{post.username}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{post.timestamp}</span>
                              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#e94560]/10 text-[#e94560] border border-[#e94560]/20">
                                {post.category}
                              </span>
                            </div>

                            <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#e94560] transition-colors leading-snug">
                              {post.title}
                            </h3>

                            <p className="text-sm text-gray-400 leading-relaxed mb-3 line-clamp-2">
                              {post.preview}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.519-7.594A2 2 0 0015.378 8H4.066a2 2 0 00-1.934 2.333l.003.017z" />
                                </svg>
                                {post.upvotes}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                {post.replies}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                {post.views.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Hot Topics
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Trending tags in the community</p>
                </div>

                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                  <div className="flex flex-wrap gap-3">
                    {tagsLoading ? [] : tags.length === 0 ? (
                      <div className="rounded-lg border border-gray-700 bg-[#0f1419] p-6 text-center text-sm text-gray-400 w-full">
                        No data available yet
                      </div>
                    ) : tags.map((tag) => (
                      <button
                        key={tag.name}
                        className="group inline-flex items-center gap-2 px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg hover:border-[#e94560]/50 hover:bg-[#e94560]/5 transition-all"
                      >
                        <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                          #{tag.name}
                        </span>
                        <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                          {tag.posts}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <div className="bg-gradient-to-br from-[#e94560]/10 to-[#0f3460]/10 border border-[#e94560]/30 rounded-lg p-6 md:p-8 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                    Start the Conversation
                  </h2>
                  <p className="text-gray-400 mb-6 max-w-xl mx-auto text-sm md:text-base">
                    Share your analysis, ask questions, or make bold predictions. The community is listening.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {[
                      { label: 'Start Discussion', primary: true },
                      { label: 'Ask Question', primary: false },
                      { label: 'Share Analysis', primary: false },
                      { label: 'Make Prediction', primary: false },
                    ].map((action) => (
                      <button
                        key={action.label}
                        className={`px-5 py-3 rounded-lg font-semibold text-sm transition-all ${
                          action.primary
                            ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white hover:shadow-lg hover:shadow-[#e94560]/50 hover:scale-105'
                            : 'border border-gray-600 text-gray-300 hover:border-[#e94560]/50 hover:text-white hover:bg-[#e94560]/5'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Community Rules
                </h3>
                <ul className="space-y-3 text-sm">
                  {[
                    'Respect all community members',
                    'No spam or self-promotion',
                    'Back up betting claims with data',
                    'No toxicity or harassment',
                    'Stay on topic in discussions',
                    'Report rule-breaking content',
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-400">
                      <span className="text-[#e94560] font-bold mt-0.5">{i + 1}.</span>
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654a1 1 0 00-.799-.993 6.905 6.905 0 011.77-2.39 1 1 0 101.414-1.414 3.235 3.235 0 01-.138-1.248z" clipRule="evenodd" />
                    <path d="M15.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  Trending Matches
                </h3>
                <div className="space-y-3">
                  {trendingLoading ? [] : trendingMatches.length === 0 ? (
                    <div className="rounded-lg border border-gray-700 bg-[#0f1419] p-6 text-center text-sm text-gray-400">
                      No data available yet
                    </div>
                  ) : trendingMatches.map((match) => (
                    <div
                      key={`${match.team1}-${match.team2}`}
                      className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg border border-gray-800 hover:border-[#e94560]/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo logo={match.logo1} name={match.team1} size="sm" />
                        <span className="text-xs font-semibold text-white truncate">{match.team1}</span>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">VS</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-xs font-semibold text-white truncate">{match.team2}</span>
                        <TeamLogo logo={match.logo2} name={match.team2} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Top Contributors
                </h3>
                <div className="space-y-3">
                  {contributors.slice(0, 5).map((contributor) => (
                    <div key={contributor.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {contributor.avatar?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{contributor.username}</p>
                        <p className="text-xs text-gray-500">Score: {contributor.intelScore.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Newest Members
                </h3>
                <div className="space-y-3">
                  {newestLoading ? [] : newestMembers.length === 0 ? (
                    <div className="rounded-lg border border-gray-700 bg-[#0f1419] p-6 text-center text-sm text-gray-400">
                      No data available yet
                    </div>
                  ) : newestMembers.map((member) => (
                    <div key={member.username} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{member.username}</p>
                        <p className="text-xs text-gray-500">{member.joinedDate}</p>
                      </div>
                      <button className="flex-shrink-0 px-3 py-1 text-xs font-medium text-white border border-gray-600 rounded hover:border-[#e94560]/50 hover:bg-[#e94560]/5 transition-all">
                        Welcome
                      </button>
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