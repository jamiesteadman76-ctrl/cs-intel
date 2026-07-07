'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import MatchCard from '@/components/MatchCard'
import FeaturedMatch from '@/components/FeaturedMatch'
import IntelPostCard from '@/components/IntelPostCard'
import CommunityActivityItem from '@/components/CommunityActivityItem'
import RankingItem from '@/components/RankingItem'
import Footer from '@/components/Footer'
import { useUser } from '@/lib/auth/useUser'
import { getMatchesWithTeams, getIntelPosts, getLeaderboard } from '@/lib/api'
import { getCommunityActivity } from '@/lib/api/community'
import { supabase } from '@/lib/supabase'
import type { DbMatch, LeaderboardEntry } from '@/lib/api'
import type { IntelPost, TeamStats } from '@/lib/types'
import type { CommunityActivity } from '@/lib/api/community'

function formatTimestamp(dateString: string | undefined): string {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minutes ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days ago`
}

export default function Home() {
  const { user, loading: authLoading } = useUser()
  const [matches, setMatches] = useState<DbMatch[]>([])
  const [featuredMatch, setFeaturedMatch] = useState<DbMatch | null>(null)
  const [intelPosts, setIntelPosts] = useState<IntelPost[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [communityActivity, setCommunityActivity] = useState<CommunityActivity[]>([])
  const [teamStats, setTeamStats] = useState<Record<string, TeamStats>>({})
  const [matchRatings, setMatchRatings] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [communityActivityLoading, setCommunityActivityLoading] = useState(true)

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const matchesData = await getMatchesWithTeams()
      setMatches(matchesData)

      const featured = matchesData.find(m => m.status === 'completed') || matchesData[0] || null
      setFeaturedMatch(featured)

      const intelData = await getIntelPosts(supabase, true)
      const mappedIntelPosts: IntelPost[] = intelData.map((post, idx) => ({
        id: post.id || `intel-${idx}`,
        title: post.title,
        category: (post.category || 'team-form') as IntelPost['category'],
        timestamp: formatTimestamp(post.created_at),
        comments: 0,
      }))
      setIntelPosts(mappedIntelPosts)

      const [leaderboardData, activityData] = await Promise.all([
        getLeaderboard(),
        getCommunityActivity(),
      ])
      setLeaderboard(leaderboardData)
      setCommunityActivity(activityData.map(a => ({ ...a, timestamp: formatTimestamp(a.timestamp) })))
      setCommunityActivityLoading(false)

      const [statsRes, ratingsRes] = await Promise.all([
        fetch('/api/teams/stats'),
        fetch('/api/ratings'),
      ])
      const statsData = statsRes.ok ? await statsRes.json() : { stats: {} }
      setTeamStats(statsData.stats || {})

      const ratingsData = ratingsRes.ok ? await ratingsRes.json() : { ratings: [] }
      const ratingMap: Record<string, number> = {}
      for ( const rating of ratingsData.ratings || [] ) {
        ratingMap[rating.teamId] = rating.rating
      }
      setMatchRatings(ratingMap)
    } catch (err) {
      console.error('Failed to fetch homepage data:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="bg-[#0f1419] text-gray-100">
        <Header />
        <main>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Loading...</h2>
              <p className="text-gray-400">Fetching latest data from Supabase...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-[#0f1419] text-gray-100">
      <Header />
      <main>
        <Hero />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Today&apos;s Matches
            </h2>
            <p className="text-gray-400">
              Live match analysis and community predictions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} teamStats={teamStats} matchRatings={matchRatings} />
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Featured Match
            </h2>
            <p className="text-gray-400">
              Deep dive analysis with community intelligence
            </p>
          </div>

          {featuredMatch ? (
            <FeaturedMatch
              match={featuredMatch}
              teamStats={{
                team1: teamStats[featuredMatch.team1.id],
                team2: teamStats[featuredMatch.team2.id],
              }}
              matchRatings={matchRatings}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">No featured match available</p>
          )}
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Latest Intel
            </h2>
            <p className="text-gray-400">
              Team form, roster changes, tournaments and market movements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {intelPosts.map((post) => (
              <IntelPostCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Community Activity
            </h2>
            <p className="text-gray-400">
              Real-time predictions and insights from the community
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 md:p-8">
            <div className="space-y-4">
              {communityActivityLoading ? [] : communityActivity.length === 0 ? (
                <div className="rounded-lg border border-gray-700 bg-[#0f1419] p-6 text-center text-sm text-gray-400">
                  No data available yet
                </div>
              ) : communityActivity.map((activity) => (
                <CommunityActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Leaderboard Preview
            </h2>
            <p className="text-gray-400">
              Top analysts by Intel Score
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 md:p-8">
              <div className="space-y-1">
                {leaderboard.map((entry) => (
                  <RankingItem key={entry.rank} entry={entry} />
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/50 rounded-lg p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  View Full Leaderboard
                </h3>
                <p className="text-gray-400 mb-6">
                  See the complete rankings of all analysts and climb the leaderboard.
                </p>
              </div>

              <Link
                href="/leaderboard"
                className="w-full py-3 px-6 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105 text-center"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-24 mb-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/10 via-transparent to-[#0f3460]/10"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#e94560]/10 rounded-full blur-3xl opacity-50"></div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {!loading && !user && (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  Join the Community
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Become part of a thriving community of Counter-Strike 2 analysts,
                  bettors, and esports enthusiasts.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup" className="px-8 py-3 md:py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold rounded hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105 text-center">
                    Sign Up Free
                  </Link>
                  <Link href="/about" className="px-8 py-3 md:py-4 border-2 border-[#e94560] text-white font-semibold rounded hover:bg-[#e94560]/10 transition-all text-center">
                    Learn More
                  </Link>
                </div>
              </>
            )}
            {!loading && user && (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  Welcome Back
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Continue building your Intel Score and climb the leaderboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/leaderboard" className="px-8 py-3 md:py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold rounded hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105 text-center">
                    View Leaderboard
                  </Link>
                  <Link href="/predictions" className="px-8 py-3 md:py-4 border-2 border-[#e94560] text-white font-semibold rounded hover:bg-[#e94560]/10 transition-all text-center">
                    Predictions Centre
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
