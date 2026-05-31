import Header from '@/components/Header'
import MatchHeader from '@/components/MatchHeader'
import CommunityConfidence from '@/components/CommunityConfidence'
import MatchSnapshot from '@/components/MatchSnapshot'
import KeyPlayers from '@/components/KeyPlayers'
import CommunityDiscussionFeed from '@/components/CommunityDiscussionFeed'
import CommunityPredictionsWidget from '@/components/CommunityPredictionsWidget'
import IntelFeed from '@/components/IntelFeed'
import RelatedMatchCard from '@/components/RelatedMatchCard'
import TournamentInfoWidget from '@/components/TournamentInfoWidget'
import Footer from '@/components/Footer'
import {
  featuredMatch,
  communityComments,
  communityPredictions,
  intelUpdates,
  relatedMatches,
  matchTournament,
} from '@/lib/data'

export const metadata = {
  title: 'FaZe Clan vs NAVI - CS Intel Match Hub',
  description:
    'In-depth match analysis, community predictions, and betting intelligence for FaZe Clan vs NAVI.',
}

export default function MatchPage() {
  return (
    <div className="bg-[#0f1419] text-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Match Header */}
        <MatchHeader match={featuredMatch} />

        {/* Community Confidence */}
        <CommunityConfidence match={featuredMatch} />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - main content */}
          <div className="lg:col-span-2">
            {/* Match Snapshot */}
            <MatchSnapshot match={featuredMatch} />

            {/* Key Players */}
            <KeyPlayers match={featuredMatch} />

            {/* Community Discussion */}
            <CommunityDiscussionFeed comments={communityComments} />

            {/* Community Predictions */}
            <CommunityPredictionsWidget predictions={communityPredictions} />

            {/* Intel Feed */}
            <IntelFeed updates={intelUpdates} />

            {/* Related Matches */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6">Upcoming Matches</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {relatedMatches.map((match) => (
                  <RelatedMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          </div>

          {/* Right column - sidebar */}
          <div>
            <TournamentInfoWidget tournament={matchTournament} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
