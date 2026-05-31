'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  scheduleMatches,
  todayKeyMatches,
  tournaments,
  quickStats,
  scheduleStats,
} from '@/lib/data'
import type { ScheduleMatch } from '@/lib/types'

const filters = ['Today', 'Tomorrow', 'This Week', 'Major 2026'] as const
type Filter = typeof filters[number]

function getFilteredMatches(filter: Filter): ScheduleMatch[] {
  switch (filter) {
    case 'Today':
      return scheduleMatches.filter((m) => m.time.startsWith('Today'))
    case 'Tomorrow':
      return scheduleMatches.filter((m) => m.time.startsWith('Tomorrow'))
    case 'This Week':
      return scheduleMatches
    case 'Major 2026':
      return scheduleMatches.filter((m) => m.tournament.includes('Major'))
    default:
      return scheduleMatches
  }
}

export default function SchedulePage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('Today')
  const filtered = getFilteredMatches(activeFilter)

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
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                  Schedule
                </h1>
                <p className="text-gray-400 text-base md:text-lg max-w-xl">
                  Upcoming Counter-Strike 2 matches and tournament fixtures.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-3">
                {quickStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg px-4 py-2.5 text-center"
                  >
                    <div className="text-lg mb-0.5">{stat.icon}</div>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    activeFilter === filter
                      ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white shadow-lg shadow-[#e94560]/30'
                      : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {filter}
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

            {/* ========== LEFT / MAIN COLUMN ========== */}
            <div className="lg:col-span-2 space-y-8">

              {/* -------------------------------------------- */}

              {/* -------------------------------------------- */}
              {/* FEATURED MATCH                               */}
              {/* -------------------------------------------- */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e94560] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e94560]"></span>
                  </span>
                  <h2 className="text-sm font-semibold text-[#e94560] uppercase tracking-wider">
                    Next Match
                  </h2>
                </div>

                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-[#e94560]/40 rounded-xl p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#e94560]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔥</div>
                        <p className="text-base font-bold text-white">Spirit</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-gray-500 uppercase tracking-widest">VS</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">⚡</div>
                        <p className="text-base font-bold text-white">FaZe</p>
                      </div>
                    </div>

                    <div className="text-center md:text-right">
                      <p className="text-sm text-gray-400 mb-1">ESL Pro League Season 21</p>
                      <p className="text-xl md:text-2xl font-bold text-white mb-1">
                        Today 18:00 <span className="text-sm text-gray-500 font-medium">UK</span>
                      </p>
                      <p className="text-xs text-[#00d4ff]">Starts in 2h 14m</p>
                    </div>

                    <button className="px-6 py-3 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-105 text-sm whitespace-nowrap">
                      Open Match Hub →
                    </button>
                  </div>
                </div>
              </section>

              {/* -------------------------------------------- */}
              {/* ALL MATCHES                                  */}
              {/* -------------------------------------------- */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    All Matches
                  </h2>
                  <span className="text-xs text-gray-500 font-medium">
                    {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Match</div>
                    <div className="col-span-3">Tournament</div>
                    <div className="col-span-2 text-center">Time (UK)</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-1 text-right">Status</div>
                  </div>

                  <div className="divide-y divide-gray-800">
                    {filtered.map((match) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <div className="p-10 text-center">
                      <p className="text-gray-500 text-sm">No matches found for this filter.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ========== RIGHT SIDEBAR ========== */}
            <div className="space-y-6">

              {/* Today's Key Matches */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Today's Key Matches
                </h3>
                <div className="space-y-2">
                  {todayKeyMatches.map((match) => (
                    <MiniMatchRow key={match.id} match={match} />
                  ))}
                </div>
              </div>

              {/* Live Matches */}
              {scheduleMatches.some((m) => m.status === 'live') && (
                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#e94560]/30 rounded-lg p-5 md:p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    Live Matches
                  </h3>
                  <div className="space-y-2">
                    {scheduleMatches
                      .filter((m) => m.status === 'live')
                      .map((match) => (
                        <MiniMatchRow key={match.id} match={match} />
                      ))}
                  </div>
                </div>
              )}

              {/* Tournaments */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 11-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  Tournaments
                </h3>
                <div className="space-y-2">
                  {tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="flex items-center justify-between p-3 bg-[#0f1419] rounded-lg border border-gray-800 hover:border-[#e94560]/30 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{tournament.name}</p>
                        <p className="text-xs text-gray-500">{tournament.matches} matches</p>
                      </div>
                      <span className="text-xs font-bold text-[#00d4ff]">{tournament.prizePool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats Summary */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Total Today</p>
                    <p className="text-xl font-bold text-white">{scheduleStats.totalToday}</p>
                  </div>
                  <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Live Now</p>
                    <p className="text-xl font-bold text-[#e94560]">{scheduleStats.liveNow}</p>
                  </div>
                  <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Upcoming Today</p>
                    <p className="text-xl font-bold text-[#00d4ff]">{scheduleStats.upcomingToday}</p>
                  </div>
                  <div className="bg-[#0f1419] rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">This Week</p>
                    <p className="text-xl font-bold text-white">{scheduleStats.totalThisWeek}</p>
                  </div>
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
/* Reusable sub-components (co-located to keep the page single-file)          */
/* ========================================================================== */

function StatusBadge({ status }: { status: ScheduleMatch['status'] }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-400/10 text-red-400 border border-red-400/20">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
        </span>
        Live
      </span>
    )
  }
  if (status === 'finished') {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-400/10 text-gray-400 border border-gray-400/20">
        Finished
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">
      Upcoming
    </span>
  )
}

function MatchRow({ match }: { match: ScheduleMatch }) {
  return (
    <div className="px-5 py-4 hover:bg-[#1a1f2e]/60 transition-colors cursor-pointer group">
      {/* Mobile layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-lg">{match.team1.logo}</span>
            <span className="text-sm font-semibold text-white">{match.team1.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-500">VS</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">{match.team2.name}</span>
            <span className="text-lg">{match.team2.logo}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 truncate mr-2">{match.tournament}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {match.status === 'live' && match.score1 !== undefined && match.score2 !== undefined && (
              <span className="text-xs font-bold text-white">
                {match.score1} - {match.score2}
              </span>
            )}
            <span className="text-xs text-gray-500">{match.time}</span>
            <StatusBadge status={match.status} />
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-12 gap-2 items-center">
        <div className="col-span-4 flex items-center gap-3">
          <span className="text-lg">{match.team1.logo}</span>
          <span className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors">
            {match.team1.name}
          </span>
          <span className="text-xs text-gray-600 font-medium">vs</span>
          <span className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors">
            {match.team2.name}
          </span>
          <span className="text-lg">{match.team2.logo}</span>
        </div>
        <div className="col-span-3">
          <span className="text-sm text-gray-400 truncate block">{match.tournament}</span>
        </div>
        <div className="col-span-2 text-center">
          <span className="text-sm text-gray-300">{match.time}</span>
        </div>
        <div className="col-span-2 text-center">
          {match.status === 'live' && match.score1 !== undefined && match.score2 !== undefined ? (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
              <span className="text-[#00d4ff]">{match.score1}</span>
              <span className="text-gray-500">-</span>
              <span className="text-[#e94560]">{match.score2}</span>
            </span>
          ) : (
            <span className="text-sm text-gray-600">-</span>
          )}
        </div>
        <div className="col-span-1 flex justify-end">
          <StatusBadge status={match.status} />
        </div>
      </div>
    </div>
  )
}

function MiniMatchRow({ match }: { match: ScheduleMatch }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#0f1419] rounded-lg border border-gray-800 hover:border-[#e94560]/30 transition-colors cursor-pointer">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-sm">{match.team1.logo}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {match.team1.name} vs {match.team2.name}
          </p>
          <p className="text-[10px] text-gray-500 truncate">{match.tournament}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {match.status === 'live' && match.score1 !== undefined && match.score2 !== undefined && (
          <span className="text-xs font-bold text-white">
            {match.score1}-{match.score2}
          </span>
        )}
        <span className="text-[10px] text-gray-500">{match.time}</span>
        <StatusBadge status={match.status} />
      </div>
    </div>
  )
}