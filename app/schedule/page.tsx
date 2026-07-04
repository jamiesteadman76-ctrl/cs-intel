'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getMatchesWithTeams, getTournaments } from '@/lib/api'
import type { ScheduleMatch, TeamStats } from '@/lib/types'
import MatchCardUnified from '@/components/MatchCardUnified'

const filters = ['Today', 'Tomorrow', 'This Week', 'Live', 'Completed'] as const
type Filter = typeof filters[number]

interface ScheduleMatchWithIds extends ScheduleMatch {
  team1Id?: string
  team2Id?: string
}

function convertToScheduleMatch(dbMatch: any): ScheduleMatchWithIds {
  return {
    id: dbMatch.id,
    team1: {
      name: dbMatch.team1?.name || 'TBD',
      logo: dbMatch.team1?.logo || '🎮',
    },
    team2: {
      name: dbMatch.team2?.name || 'TBD',
      logo: dbMatch.team2?.logo || '🎮',
    },
    tournament: dbMatch.tournamentData?.name || dbMatch.tournament || 'Unknown Tournament',
    time: dbMatch.time || '',
    status: dbMatch.status,
    result: dbMatch.result,
    score1: dbMatch.score1,
    score2: dbMatch.score2,
    team1Id: dbMatch.team1?.id,
    team2Id: dbMatch.team2?.id,
  }
}

function filterMatches(matches: ScheduleMatchWithIds[], activeFilter: Filter): ScheduleMatchWithIds[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)

  switch (activeFilter) {
    case 'Today':
      return matches.filter(m => {
        const matchDate = new Date(m.time)
        return matchDate >= todayStart && matchDate < todayEnd
      })
    case 'Tomorrow':
      return matches.filter(m => {
        const matchDate = new Date(m.time)
        return matchDate >= tomorrowStart && matchDate < tomorrowEnd
      })
    case 'This Week':
      return matches.filter(m => {
        const matchDate = new Date(m.time)
        return matchDate >= todayStart && matchDate < weekEnd
      })
    case 'Live':
      return matches.filter(m => m.status === 'live')
    case 'Completed':
      return matches.filter(m => m.status === 'completed')
    default:
      return matches
  }
}

export default function SchedulePage() {
  const [matches, setMatches] = useState<ScheduleMatchWithIds[]>([])
  const [teamStats, setTeamStats] = useState<Record<string, TeamStats>>({})
  const [tournamentsData, setTournamentsData] = useState<Array<{id: string; name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<Filter>('Today')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [dbMatches, dbTournaments, statsResponse] = await Promise.all([
          getMatchesWithTeams(),
          getTournaments(),
          fetch('/api/teams/stats').then(res => res.ok ? res.json() : { stats: {} }),
        ])
        const scheduleMatches = dbMatches.map(convertToScheduleMatch)
        setMatches(scheduleMatches)
        setTournamentsData(dbTournaments)
        setTeamStats(statsResponse.stats || {})
      } catch (err) {
        setError('Failed to load schedule data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredMatches = filterMatches(matches, activeFilter)

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Match Schedule</h1>
            <p>Loading matches...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Match Schedule</h1>
            <p className="text-red-500">{error}</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Match Schedule</h1>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

<div className="space-y-4">
             {filteredMatches.length > 0 ? (
               filteredMatches.map(match => (
                 <MatchCardUnified key={match.id} match={{
                   id: match.id,
                   team1: match.team1,
                   team2: match.team2,
                   tournament: match.tournament,
                   time: match.time,
                   status: match.status,
                   result: match.result,
                   score1: match.score1,
                   score2: match.score2,
                 }} teamStats={{
                   team1: match.team1Id ? teamStats[match.team1Id] : undefined,
                   team2: match.team2Id ? teamStats[match.team2Id] : undefined,
                 }} />
               ))
             ) : (
               <p className="text-gray-400">No matches found for this filter.</p>
             )}
           </div>
        </div>
      </main>
      <Footer />
    </>
  )
}