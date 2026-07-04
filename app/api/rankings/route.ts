import { NextResponse } from 'next/server'
import { getAllTeamStats, getTeams } from '@/lib/api'
import type { TeamStats } from '@/lib/types'

export async function GET() {
  try {
    const [stats, teams] = await Promise.all([
      getAllTeamStats(),
      getTeams(),
    ])
    const statsByName = teams.reduce<Record<string, TeamStats>>((acc, team) => {
      const teamStats = stats[team.id]
      if (teamStats) acc[team.name] = teamStats
      return acc
    }, {})

    return NextResponse.json({ stats, statsByName })
  } catch (error) {
    console.error('[rankings GET]', error)
    return NextResponse.json({ stats: {}, statsByName: {} }, { status: 500 })
  }
}