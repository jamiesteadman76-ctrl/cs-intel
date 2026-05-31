export default function Hero() {
  return (
    <section className="relative min-h-[500px] md:min-h-[600px] overflow-hidden">
      {/* Background gradient with esports effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e94560]/10 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0f3460]/20 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            The Home of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">
              CS2 Betting
            </span>{' '}
            Intelligence
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
            Match analysis, community insight, predictions and discussion for
            Counter-Strike 2 fans and bettors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-3 md:py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold rounded hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105">
              View Today's Matches
            </button>
            <button className="px-8 py-3 md:py-4 border-2 border-[#e94560] text-white font-semibold rounded hover:bg-[#e94560]/10 transition-all">
              Join Community
            </button>
          </div>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e94560]/30 to-transparent"></div>
    </section>
  )
}
