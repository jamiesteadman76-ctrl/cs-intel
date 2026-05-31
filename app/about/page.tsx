import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main>
        {/* ============================================ */}
        {/* PAGE HEADER                                   */}
        {/* ============================================ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 via-transparent to-[#0f3460]/5"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e94560]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00d4ff]/5 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">CS Intel</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
                Building the future of CS2 analysis through community collaboration, structured data, and shared intelligence.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* MAIN CONTENT                                  */}
        {/* ============================================ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="max-w-3xl mx-auto space-y-16 md:space-y-24">

            {/* -------------------------------------------- */}
            {/* SECTION 1: WHAT IS CS INTEL                  */}
            {/* -------------------------------------------- */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-lg bg-[#e94560]/10 border border-[#e94560]/30 flex items-center justify-center text-sm">01</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">What is CS Intel?</h2>
              </div>

              <div className="prose-custom">
                <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4">
                  CS Intel is a community-driven Counter-Strike 2 intelligence platform focused on match analysis, community predictions, and esports discussion.
                </p>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4">
                  We bring together fans, analysts, and bettors in one structured environment where insight is rewarded and quality analysis rises to the top. Every match discussion, prediction, and piece of intel contributes to a collective knowledge base that helps everyone make better-informed decisions.
                </p>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                  Unlike scattered forums and social media threads, CS Intel organises conversations around matches, teams, tournaments, and betting markets — so you always find the signal amid the noise.
                </p>
              </div>
            </section>

            {/* -------------------------------------------- */}
            {/* SECTION 2: OUR MISSION                       */}
            {/* -------------------------------------------- */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-sm text-[#00d4ff]">02</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Our Mission</h2>
              </div>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 md:p-8">
                <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-4">
                  Make CS2 matches easier to understand through community insight and structured analysis.
                </p>
                <p className="text-base text-gray-400 leading-relaxed">
                  Good analysis should be accessible, not locked behind paywalls or buried in Discord servers. Our mission is to surface the best community knowledge, reward the contributors who produce it, and give every fan the tools to follow the game at a deeper level.
                </p>
              </div>
            </section>

            {/* -------------------------------------------- */}
            {/* SECTION 3: HOW IT WORKS                      */}
            {/* -------------------------------------------- */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-sm text-yellow-400">03</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">How It Works</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    icon: '📋',
                    title: 'Match Breakdowns',
                    desc: 'Every match is unpacked with structured analysis — map pools, head-to-head history, player form, and tactical context, all in one place.',
                  },
                  {
                    icon: '🎯',
                    title: 'Community Predictions',
                    desc: 'Users make score and winner predictions before matches. Results are tracked, accuracy is measured, and the best predictors climb the leaderboard.',
                  },
                  {
                    icon: '💬',
                    title: 'Discussion System',
                    desc: 'Topic-based forums for match reactions, roster news, tournament storylines, and betting value discussions. Upvotes surface the best takes.',
                  },
                  {
                    icon: '⭐',
                    title: 'Intel Score Reputation',
                    desc: 'A transparent reputation system that rewards quality contributions — accurate predictions, insightful comments, and helpful analysis all earn you points.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 hover:border-[#e94560]/30 transition-all"
                  >
                    <div className="text-2xl mb-4">{item.icon}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* -------------------------------------------- */}
            {/* SECTION 4: WHY IT EXISTS                     */}
            {/* -------------------------------------------- */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/30 flex items-center justify-center text-sm text-green-400">04</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Why It Exists</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Problem */}
                <div className="bg-gradient-to-br from-red-500/5 to-[#1a1f2e] border border-red-500/20 rounded-xl p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-bold text-red-400">The Problem</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    CS2 information is scattered across HLTV threads, Twitter/X feeds, Discord servers, and Reddit. Good analysis gets buried, hot takes get amplified, and there is no single place to find trusted, structured community intelligence.
                  </p>
                </div>

                {/* Solution */}
                <div className="bg-gradient-to-br from-[#e94560]/5 to-[#0f3460]/5 border border-[#e94560]/20 rounded-xl p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-bold text-[#00d4ff]">Our Solution</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    One structured platform where match analysis, predictions, and discussion live together. Reputation systems reward accuracy. Community voting surfaces the best content. Every insight is tied to the match, team, or tournament it belongs to.
                  </p>
                </div>
              </div>
            </section>

            {/* -------------------------------------------- */}
            {/* VALUES / CLOSING                              */}
            {/* -------------------------------------------- */}
            <section className="text-center pt-8 border-t border-gray-800">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                Built for the community, by the community
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
                CS Intel is independent, community-governed, and focused on one thing — making Counter-Strike 2 more understandable and more fun to follow.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}