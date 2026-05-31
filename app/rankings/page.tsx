'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  rankingTeams,
  rankingMovers,
  rankingUpcoming,
} from '@/lib/data'
import type { RankingTeam, RankingMover, RankingUpcoming } from '@/lib/types'

const tabs = ['Global Rankings', 'This Month', 'Major 2026 Form'] as const
type Tab = typeof tabs[number]

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Global Rankings')
  const [hoveredTeam, setHoveredTeam] = useState<RankingTeam | null>(null)

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

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8 md:pb-10">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                Team Rankings
              </h1>
              <p className="text-gray-400 text-base md:text-lg max-w-xl">
                CS2 global team rankings powered by community intelligence and performance data.
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white shadow-lg shadow-[#e94560]/30'
                      : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
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
              {/* TOP 3 PODIUM                                   */}
              {/* -------------------------------------------- */}
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-6">
                  Top Teams
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {rankingTeams.slice(0, 3).map((team) => (
                    <PodiumCard key={team.rank} team={team} rank={team.rank} />
                  ))}
                </div>
              </section>

              {/* -------------------------------------------- */}
              {/* RANKINGS TABLE                                 */}
              {/* -------------------------------------------- */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Full Rankings
                  </h2>
                  <span className="text-xs text-gray-500 font-medium">
                    Top 10 teams
                  </span>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Team</div>
                    <div className="col-span-2 text-center">Rating</div>
                    <div className="col-span-2 text-center">Win %</div>
                    <div className="col-span-2 text-center">Form</div>
                    <div className="col-span-1 text-right">Trend</div>
                  </div>

                  <div className="divide-y divide-gray-800">
                    {rankingTeams.map((team) => (
                      <RankingRow
                        key={team.rank}
                        team={team}
                        onHover={setHoveredTeam}
                      />
                    ))}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {rankingTeams.map((team) => (
                    <div
                      key={team.rank}
                      className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-black ${team.rank <= 3 ? 'text-[#e94560]' : 'text-gray-500'}`}>
                            #{team.rank}
                          </span>
                          <span className="text-2xl">{team.logo}</span>
                          <div>
                            <p className="text-sm font-bold text-white">{team.name}</p>
                            {team.country && <span className="text-xs">{team.country}</span>}
                          </div>
                        </div>
                        <TrendBadge change={team.change} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#0f1419] rounded px-2 py-1.5">
                          <p className="text-xs text-gray-500">Rating</p>
                          <p className="text-sm font-bold text-white">{team.rating}</p>
                        </div>
                        <div className="bg-[#0f1419] rounded px-2 py-1.5">
                          <p className="text-xs text-gray-500">Win %</p>
                          <p className="text-sm font-bold text-[#00d4ff]">{team.winRate}%</p>
                        </div>
                        <div className="bg-[#0f1419] rounded px-2 py-1.5">
                          <p className="text-xs text-gray-500">Form</p>
                          <div className="flex items-center justify-center gap-0.5">
                            {team.form.map((f, i) => (
                              <span
                                key={i}
                                className={`text-xs font-bold ${f === 'W' ? 'text-green-400' : 'text-red-400'}`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ========== RIGHT SIDEBAR ========== */}
            <div className="space-y-6">

              {/* Team Preview Card (shows on hover) */}
              {hoveredTeam && (
                <div className="hidden lg:block">
                  <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/40 rounded-lg p-5 md:p-6 sticky top-24">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{hoveredTeam.logo}</span>
                      <div>
                        <p className="text-base font-bold text-white">{hoveredTeam.name}</p>
                        <p className="text-xs text-gray-500">#{hoveredTeam.rank} • {hoveredTeam.rating} rating</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Recent Form</p>
                        <div className="flex gap-1.5">
                          {hoveredTeam.form.map((f, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                                f === 'W'
                                  ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                                  : 'bg-red-400/10 text-red-400 border border-red-400/20'
                              }`}
                            >
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Best Map</p>
                          <p className="text-sm font-semibold text-green-400">📈 {hoveredTeam.bestMap}</p>
                        </div>
                        <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Worst Map</p>
                          <p className="text-sm font-semibold text-red-400">📉 {hoveredTeam.worstMap}</p>
                        </div>
                      </div>

                      <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Key Player</p>
                        <p className="text-sm font-semibold text-[#00d4ff]">⭐ {hoveredTeam.keyPlayer}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Win Rate</span>
                          <span className="text-[#00d4ff] font-bold">{hoveredTeam.winRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0f1419] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#e94560] to-[#00d4ff] rounded-full"
                            style={{ width: `${hoveredTeam.winRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Biggest Movers */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Biggest Movers
                </h3>
                <div className="space-y-3">
                  {rankingMovers.map((mover) => (
                    <div key={mover.team} className="flex items-center gap-3">
                      <span className="text-lg">{mover.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{mover.team}</p>
                        <p className="text-xs text-gray-500 truncate">{mover.reason}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        mover.direction === 'up'
                          ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                          : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      }`}>
                        {mover.direction === 'up' ? '↑' : '↓'}{mover.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performers This Week */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Top Performers
                </h3>
                <div className="space-y-3">
                  {rankingTeams.slice(0, 5).map((team) => (
                    <div key={team.rank} className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg border border-gray-800">
                      <span className={`text-sm font-black w-5 ${team.rank <= 3 ? 'text-[#e94560]' : 'text-gray-500'}`}>
                        #{team.rank}
                      </span>
                      <span className="text-lg">{team.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                        <p className="text-xs text-gray-500">{team.form.slice(0, 3).join('')} last 3</p>
                      </div>
                      <span className="text-sm font-bold text-[#00d4ff]">{team.winRate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Matches Affecting Rankings */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Upcoming Impact
                </h3>
                <div className="space-y-3">
                  {rankingUpcoming.map((match) => (
                    <div key={`${match.team1}-${match.team2}`} className="p-3 bg-[#0f1419] rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{match.team1}</span>
                          <span className="text-xs text-gray-600 font-medium">vs</span>
                          <span className="text-sm font-semibold text-white">{match.team2}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          match.impact === 'high'
                            ? 'bg-[#e94560]/10 text-[#e94560] border border-[#e94560]/20'
                            : match.impact === 'medium'
                              ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                              : 'bg-gray-400/10 text-gray-400 border border-gray-400/20'
                        }`}>
                          {match.impact}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{match.tournament}</span>
                        <span className="text-[#00d4ff]">{match.time}</span>
                      </div>
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

/* ========================================================================== */
/* Reusable sub-components                                                    */
/* ========================================================================== */

function PodiumCard({ team, rank }: { team: RankingTeam, rank: number }) {
  const isTop = rank === 1
  return (
    <div className={`relative rounded-lg p-5 md:p-6 text-center border ${
      isTop
        ? 'bg-gradient-to-br from-[#e94560]/15 via-[#1a1f2e] to-[#0f1419] border-[#e94560]/50 shadow-lg shadow-[#e94560]/10'
        : 'bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-gray-700'
    }`}>
      {isTop && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
          🥇 #1
        </div>
      )}
      <div className={`text-4xl mb-3 ${isTop ? 'text-5xl' : ''}`}>{team.logo}</div>
      <p className={`font-bold text-white mb-1 ${isTop ? 'text-base' : 'text-sm'}`}>{team.name}</p>
      <p className={`font-black ${isTop ? 'text-2xl text-[#00d4ff]' : 'text-lg text-gray-400'}`}>
        {team.rating}
      </p>
      <p className="text-xs text-gray-500 mt-1">Rating</p>
      <div className="mt-3 flex items-center justify-center gap-1">
        {team.form.slice(0, 3).map((f, i) => (
          <span key={i} className={`text-xs font-bold ${f === 'W' ? 'text-green-400' : 'text-red-400'}`}>
            {f}
          </span>
        ))}
        <span className="text-xs text-gray-500">...</span>
      </div>
      <div className="mt-2">
        <TrendBadge change={team.change} size="small" />
      </div>
    </div>
  )
}

function RankingRow({ team, onHover }: { team: RankingTeam, onHover: (t: RankingTeam | null) => void }) {
  return (
    <div
      className="px-5 py-4 hover:bg-[#1a1f2e]/60 transition-colors cursor-pointer group"
      onMouseEnter={() => onHover(team)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Rank */}
        <div className="col-span-1">
          <span className={`text-sm font-black ${team.rank <= 3 ? 'text-[#e94560]' : 'text-gray-500'}`}>
            {team.rank}
          </span>
        </div>

        {/* Team */}
        <div className="col-span-4 flex items-center gap-3">
          <span className="text-lg">{team.logo}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors truncate">
              {team.name}
            </p>
            {team.country && <span className="text-[10px] text-gray-500">{team.country}</span>}
          </div>
        </div>

        {/* Rating */}
        <div className="col-span-2 text-center">
          <span className="text-sm font-bold text-white">{team.rating}</span>
        </div>

        {/* Win Rate */}
        <div className="col-span-2 text-center">
          <span className="text-sm font-semibold text-[#00d4ff]">{team.winRate}%</span>
        </div>

        {/* Form */}
        <div className="col-span-2 flex items-center justify-center gap-1">
          {team.form.map((f, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                f === 'W'
                  ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                  : 'bg-red-400/10 text-red-400 border border-red-400/20'
              }`}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Trend */}
        <div className="col-span-1 flex justify-end">
          <TrendBadge change={team.change} />
        </div>
      </div>
    </div>
  )
}

function TrendBadge({ change, size = 'normal' }: { change: number, size?: string }) {
  const isUp = change > 0
  const isDown = change < 0
  const isNeutral = change === 0

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center justify-center font-bold ${
        size === 'small' ? 'text-xs w-7 h-7 rounded-full bg-gray-700 text-gray-500' : 'text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-500'
      }`}>
        —
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-0.5 font-bold ${
      isUp ? 'text-green-400' : 'text-red-400'
    } ${size === 'small' ? 'text-xs' : 'text-xs px-2 py-1 rounded-full'}`}>
      {isUp ? '↑' : '↓'}{Math.abs(change)}
    </span>
  )
}