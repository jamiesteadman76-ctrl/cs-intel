'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Team, TeamStats } from '@/lib/types'
import TeamLogo from '@/components/TeamLogo'

interface MatchCardUnifiedProps {
  match: {
    id: string
    team1: Team & { slug?: string }
    team2: Team & { slug?: string }
    tournament: string
    tournamentData?: { name?: string }
    time: string
    status: 'upcoming' | 'live' | 'completed'
    result?: 'team1_win' | 'team2_win' | 'draw'
    score1?: number
    score2?: number
  }
  teamStats?: {
    team1?: TeamStats
    team2?: TeamStats
  }
}

const resultColors: Record<string, string> = {
  team1_win: 'text-green-400',
  team2_win: 'text-green-400',
  draw: 'text-yellow-400',
}

function formatSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getTeamSlug(team: Team): string {
  return (team as Team & { slug?: string }).slug || formatSlug(team.name)
}

function formatMatchTime(isoTime: string): string {
  if (!isoTime) return ''
  const date = new Date(isoTime)
  const now = new Date()

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const matchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'

  if (matchDate.getTime() === today.getTime()) {
    return `Today ${timeStr}`
  } else if (matchDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${timeStr}`
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).replace(',', ` ${timeStr.split(' ')[1]}`)
  }
}

function FormBadges({ form }: { form: string[] }) {
  if (form.length === 0) {
    return <span className="text-[10px] text-gray-500">No matches</span>
  }

  return (
    <div className="flex items-center gap-1">
      {form.map((f, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
            f === 'W' ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 
            'bg-red-400/20 text-red-400 border border-red-400/30'
          }`}
        >
          {f}
        </span>
      ))}
    </div>
  )
}

function formatStreak(stats: TeamStats | undefined) {
  if (!stats?.current_streak.type || stats.current_streak.count === 0) return '—'
  return `${stats.current_streak.type}${stats.current_streak.count}`
}

function TeamStatLine({ label, stats }: { label: string, stats: TeamStats | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-gray-500 truncate">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-[#00d4ff]">{stats?.win_rate ?? 0}% WR</span>
        <FormBadges form={stats?.last5_form ?? []} />
        <span className="text-[10px] font-semibold text-white">{formatStreak(stats)}</span>
      </div>
    </div>
  )
}

export default function MatchCardUnified({ match, teamStats }: MatchCardUnifiedProps) {
  const showResult = match.status === 'completed' && match.result
  const showScore = match.status === 'completed' && match.score1 !== undefined && match.score2 !== undefined
  const tournamentName = match.tournamentData?.name || match.tournament

  return (
    <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/50 transition-all card-hover">
      <Link href={`/match/${match.id}`} className="absolute inset-0 rounded-lg z-0" aria-label={`Open match ${match.team1.name} vs ${match.team2.name}`} />
      <div className="relative z-10 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/team/${getTeamSlug(match.team1)}`} className="flex items-center gap-2 pointer-events-auto">
                <TeamLogo team={match.team1} />
                <span className="font-semibold text-white">{match.team1?.name || 'TBD'}</span>
              </Link>
              <span className="mx-2 text-gray-400">vs</span>
              <Link href={`/team/${getTeamSlug(match.team2)}`} className="flex items-center gap-2 pointer-events-auto">
                <TeamLogo team={match.team2} />
                <span className="font-semibold text-white">{match.team2?.name || 'TBD'}</span>
              </Link>
            </div>
            <div className="text-sm text-gray-400 mb-2">
              <Link href={`/tournament/${formatSlug(tournamentName)}`} className="pointer-events-auto">{tournamentName}</Link> • {formatMatchTime(match.time || '')}
            </div>
            {teamStats && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <TeamStatLine label={match.team1?.name || 'Team 1'} stats={teamStats.team1} />
                <TeamStatLine label={match.team2?.name || 'Team 2'} stats={teamStats.team2} />
              </div>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            {match.status === 'live' && (
              <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded">
                LIVE
              </span>
            )}
            {showScore && (
              <div className="font-bold text-lg text-white">
                {match.score1} - {match.score2}
              </div>
            )}
            {showResult && (
              <span className={`text-xs font-bold ${resultColors[match.result!]}`}>
                {match.result === 'team1_win' ? 'WIN' : match.result === 'team2_win' ? 'WIN' : 'DRAW'}
              </span>
            )}
            <div className="text-xs capitalize text-gray-500">{match.status}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
