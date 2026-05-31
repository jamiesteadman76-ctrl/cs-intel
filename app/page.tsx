import Link from 'next/link'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import MatchCard from '@/components/MatchCard'
import FeaturedMatch from '@/components/FeaturedMatch'
import IntelPostCard from '@/components/IntelPostCard'
import CommunityActivityItem from '@/components/CommunityActivityItem'
import RankingItem from '@/components/RankingItem'
import Footer from '@/components/Footer'
import {
  matches,
  featuredMatch,
  intelPosts,
  communityActivity,
  rankings,
} from '@/lib/data'

export default function Home() {
  return (
    <div className="bg-[#0f1419] text-gray-100">
      <Header />
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Today's Matches Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Today's Matches
            </h2>
            <p className="text-gray-400">
              Live match analysis and community predictions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>

        {/* Featured Match Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Featured Match
            </h2>
            <p className="text-gray-400">
              Deep dive analysis with community intelligence
            </p>
          </div>

          <FeaturedMatch match={featuredMatch} />
        </section>

        {/* Latest Intel Section */}
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

        {/* Community Activity Section */}
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
              {communityActivity.map((activity) => (
                <CommunityActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </section>

        {/* Rankings Preview Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Top Teams
            </h2>
            <p className="text-gray-400">
              Current rankings based on team performance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rankings card */}
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 md:p-8">
              <div className="space-y-1">
                {rankings.map((ranking) => (
                  <RankingItem key={ranking.rank} ranking={ranking} />
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/50 rounded-lg p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Complete Rankings
                </h3>
                <p className="text-gray-400 mb-6">
                  Explore detailed team statistics, head-to-head matchups, and
                  historical performance data.
                </p>
              </div>

              <button className="w-full py-3 px-6 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105">
                View Full Rankings
              </button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-24 mb-0 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/10 via-transparent to-[#0f3460]/10"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#e94560]/10 rounded-full blur-3xl opacity-50"></div>

          {/* Content */}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
