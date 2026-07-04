'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/lib/auth/useUser'
import { getMatchById, submitPrediction } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TeamLogo from '@/components/TeamLogo'
import type { DbMatch } from '@/lib/api'

function formatMatchTime(isoTime: string): string {
  if (!isoTime) return ''
  const date = new Date(isoTime)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC'
}

export default function MatchPredictPage() {
  const params = useParams()
  const matchId = params.id as string
  const [match, setMatch] = useState<DbMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { user, loading: authLoading } = useUser()

  useEffect(() => {
    async function fetchMatch() {
      try {
        const m = await getMatchById(undefined, matchId)
        setMatch(m)
      } catch (e) {
        setError('Failed to load match')
      } finally {
        setLoading(false)
      }
    }
    fetchMatch()
  }, [matchId])

  async function handlePredict(team1Win: boolean) {
    if (!match || !user) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitPrediction(match.id, team1Win)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to submit prediction')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to submit prediction')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Match Not Found</h1>
            <Link href="/matches" className="text-[#e94560] hover:text-[#ff6b6b]">Back to Matches</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Login Required</h1>
            <p className="text-gray-400 mb-6">You must be logged in to make predictions.</p>
            <Link href="/login" className="inline-block px-6 py-3 bg-[#e94560] text-white rounded-lg hover:bg-[#d63851] transition">
              Login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-green-400 mb-4">Prediction Submitted!</h1>
            <p className="text-gray-400 mb-6">Your prediction has been recorded successfully.</p>
            <Link href={`/match/${matchId}`} className="inline-block px-6 py-3 bg-[#e94560] text-white rounded-lg hover:bg-[#d63851] transition">
              Back to Match
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (match.status === 'completed' || match.status === 'live') {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Prediction Locked</h1>
            <p className="text-gray-400 mb-6">This match is {match.status} and predictions are no longer accepted.</p>
            <Link href={`/match/${matchId}`} className="inline-block px-6 py-3 bg-[#e94560] text-white rounded-lg hover:bg-[#d63851] transition">
              Back to Match
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href={`/match/${matchId}`} className="text-gray-400 hover:text-white text-sm">
            Back to Match
          </Link>
        </div>

        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-8 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Make Your Prediction</h1>
          <p className="text-gray-400 mb-6">{formatMatchTime(match.match_time)} {match.tournamentData?.name || match.tournament}</p>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="text-center flex-1">
              <TeamLogo team={match.team1} size="xxl" />
              <h2 className="text-xl font-bold text-white mt-3">{match.team1.name}</h2>
              <button
                onClick={() => handlePredict(true)}
                disabled={submitting}
                className="mt-4 px-8 py-3 bg-[#e94560] text-white rounded-lg font-semibold hover:bg-[#d63851] transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Predict Team 1'}
              </button>
            </div>

            <div className="text-center">
              <span className="text-gray-500 font-bold text-lg">VS</span>
            </div>

            <div className="text-center flex-1">
              <TeamLogo team={match.team2} size="xxl" />
              <h2 className="text-xl font-bold text-white mt-3">{match.team2.name}</h2>
              <button
                onClick={() => handlePredict(false)}
                disabled={submitting}
                className="mt-4 px-8 py-3 bg-[#00d4ff] text-white rounded-lg font-semibold hover:bg-[#00b8d9] transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Predict Team 2'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-center mb-4">{error}</p>
          )}

          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-500 text-center">
              Correct prediction = +10 points. Wrong prediction = -3 points.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
