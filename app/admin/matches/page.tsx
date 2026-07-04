'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useModalA11y } from '../_hooks/useModalA11y'

interface TeamOption {
  id: string
  name: string
  logo: string | null
}

interface TournamentOption {
  id: string
  name: string
  slug?: string | null
}

interface AdminMatch {
  id: string
  team1_id: string
  team2_id: string
  tournament_id: string | null
  match_time: string | null
  status: 'upcoming' | 'live' | 'completed' | string
  result: 'team1_win' | 'team2_win' | 'draw' | null
  score1: number | null
  score2: number | null
  team1: { id: string; name: string; slug?: string; logo: string | null } | null
  team2: { id: string; name: string; slug?: string; logo: string | null } | null
  tournament: { id: string; name: string; slug?: string } | null
}

interface Toast {
  type: 'success' | 'error' | 'info'
  message: string
}

interface ResolveSummary {
  predictionsResolved?: number
  correctPredictions?: number
  incorrectPredictions?: number
  predictionStats?: {
    totalPredictions: number
    correctPredictions: number
    accuracy: number
    averageConfidence: number
  }
}

const emptyForm = {
  team1_id: '',
  team2_id: '',
  tournament_id: '',
  match_time: '',
  status: 'upcoming',
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [tournaments, setTournaments] = useState<TournamentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  // Resolve modal state
  const [resolveTarget, setResolveTarget] = useState<AdminMatch | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveSummary, setResolveSummary] = useState<ResolveSummary | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [matchesRes, teamsRes, tournamentsRes] = await Promise.all([
          fetch('/api/admin/matches', { cache: 'no-store' }),
          fetch('/api/admin/teams', { cache: 'no-store' }),
          fetch('/api/admin/tournaments', { cache: 'no-store' }),
        ])
        if (!matchesRes.ok) throw new Error(`Failed to load matches (${matchesRes.status})`)
        if (!teamsRes.ok) throw new Error(`Failed to load teams (${teamsRes.status})`)
        if (!tournamentsRes.ok) throw new Error(`Failed to load tournaments (${tournamentsRes.status})`)
        const [matchesData, teamsData, tournamentsData] = await Promise.all([
          matchesRes.json(),
          teamsRes.json(),
          tournamentsRes.json(),
        ])
        if (cancelled) return
        setMatches(matchesData.matches ?? [])
        setTeams(teamsData.teams ?? teamsData ?? [])
        setTournaments(tournamentsData.tournaments ?? tournamentsData ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load matches')
          setMatches([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useModalA11y(modalOpen, closeModal)
  useModalA11y(!!resolveTarget, closeResolve)

  const teamMap = useMemo(() => {
    const m = new Map<string, TeamOption>()
    for (const t of teams) m.set(t.id, t)
    return m
  }, [teams])

  function teamName(id: string | null | undefined, fallback?: string | null): string {
    if (!id) return fallback || 'TBD'
    return teamMap.get(id)?.name ?? fallback ?? 'TBD'
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(m: AdminMatch) {
    setEditingId(m.id)
    setForm({
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      tournament_id: m.tournament_id ?? '',
      match_time: toLocalInput(m.match_time),
      status: m.status ?? 'upcoming',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.team1_id || !form.team2_id) {
      setToast({ type: 'error', message: 'Team 1 and Team 2 are required.' })
      return
    }
    if (form.team1_id === form.team2_id) {
      setToast({ type: 'error', message: 'Team 1 and Team 2 must be different teams.' })
      return
    }

    setSaving(true)
    // Edit uses MatchUpdateInput (z.strictObject) — status/result are
    // REJECTED. They belong to /api/admin/matches/[id]/resolve.
    const body: Record<string, unknown> = {
      team1_id: form.team1_id,
      team2_id: form.team2_id,
      tournament_id: form.tournament_id || null,
      match_time: form.match_time ? new Date(form.match_time).toISOString() : null,
    }
    if (!editingId) {
      body.status = form.status
    }

    try {
      const url = editingId ? `/api/admin/matches/${editingId}` : '/api/admin/matches'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      if (editingId) {
        setMatches(prev => prev.map(m => (m.id === editingId ? (data.match as AdminMatch) : m)))
        setToast({ type: 'success', message: 'Match updated.' })
      } else {
        if (data.match) setMatches(prev => [data.match as AdminMatch, ...prev])
        setToast({ type: 'success', message: 'Match created.' })
      }
      closeModal()
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save match' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(m: AdminMatch) {
    const label = `${m.team1?.name || teamName(m.team1_id)} vs ${m.team2?.name || teamName(m.team2_id)}`
    if (!confirm(`Delete match "${label}"? This cannot be undone and will cascade to predictions/scoring events.`)) return
    try {
      const res = await fetch(`/api/admin/matches/${m.id}`, { method: 'DELETE', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`)
      setMatches(prev => prev.filter(x => x.id !== m.id))
      setToast({ type: 'success', message: 'Match deleted.' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete match' })
    }
  }

  function openResolve(m: AdminMatch) {
    setResolveTarget(m)
    setResolveSummary(null)
  }

  function closeResolve() {
    setResolveTarget(null)
    setResolveSummary(null)
  }

  async function handleResolve(result: 'team1_win' | 'team2_win' | 'draw') {
    if (!resolveTarget) return
    setResolving(true)
    try {
      const res = await fetch(`/api/admin/matches/${resolveTarget.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Resolve failed (${res.status})`)
      setResolveSummary({
        predictionsResolved: data.summary?.predictionsResolved ?? 0,
        correctPredictions: data.summary?.correctPredictions ?? 0,
        incorrectPredictions: data.summary?.incorrectPredictions ?? 0,
        predictionStats: data.predictionStats,
      })
      setToast({ type: 'success', message: 'Match resolved successfully.' })
      // Refresh list so the row reflects the new status/result.
      try {
        const matchesRes = await fetch('/api/admin/matches', { cache: 'no-store' })
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json()
          setMatches(matchesData.matches ?? [])
        }
      } catch {
        // best-effort refresh
      }
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to resolve match' })
    } finally {
      setResolving(false)
    }
  }

  return (
    <main>
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                <Link href="/admin" className="hover:text-white">Admin</Link> / Matches
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Matches Management</h1>
              <p className="text-gray-400 mt-1 text-sm">Schedule new fixtures, edit match details, and resolve results to score predictions.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="self-start sm:self-auto px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              + Add Match
            </button>
          </div>

          {toast && (
            <div
              role="status"
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                toast.type === 'success'
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : toast.type === 'info'
                    ? 'border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#7fe3ff]'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {toast.message}
            </div>
          )}

          {error && !loading && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Loading matches…</div>
          ) : matches.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No matches yet. Click <span className="text-white">+ Add Match</span> to schedule one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Match</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tournament</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Time</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {matches.map(m => (
                    <tr key={m.id} className="hover:bg-[#1a1f2e]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">
                          {m.team1?.name || teamName(m.team1_id)} vs {m.team2?.name || teamName(m.team2_id)}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">{m.tournament?.name ?? '—'}</p>
                        {m.result && (
                          <p className="text-xs mt-1">
                            <span className="text-gray-500">Result:</span>{' '}
                            <span className={m.result === 'draw' ? 'text-yellow-400' : 'text-green-400'}>
                              {m.result === 'team1_win' ? `${m.team1?.name ?? teamName(m.team1_id)} won`
                                : m.result === 'team2_win' ? `${m.team2?.name ?? teamName(m.team2_id)} won`
                                : 'Draw'}
                            </span>
                            {m.score1 != null && m.score2 != null && (
                              <span className="text-gray-400 ml-2">{m.score1}–{m.score2}</span>
                            )}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">{m.tournament?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">
                        {m.match_time ? new Date(m.match_time).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.status === 'live' ? 'bg-red-400/10 text-red-400 border border-red-400/20' :
                          m.status === 'completed' ? 'bg-gray-400/10 text-gray-400 border border-gray-400/20' :
                          'bg-green-400/10 text-green-400 border border-green-400/20'
                        }`}>{m.status || 'upcoming'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(m)}
                            className="text-xs font-medium text-[#00d4ff] hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openResolve(m)}
                            className="text-xs font-medium text-green-400 hover:text-white transition-colors"
                          >
                            {m.status === 'completed' ? 'Correct' : 'Resolve'}
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
                            className="text-xs font-medium text-[#e94560] hover:text-white transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#1a1f2e] border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Match' : 'Add Match'}</h3>
              <button type="button" onClick={closeModal} className="text-sm text-gray-400 hover:text-white">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Team 1 *</label>
                  <select
                    value={form.team1_id}
                    onChange={e => setForm(f => ({ ...f, team1_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    required
                  >
                    <option value="">Select team…</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Team 2 *</label>
                  <select
                    value={form.team2_id}
                    onChange={e => setForm(f => ({ ...f, team2_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    required
                  >
                    <option value="">Select team…</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tournament</label>
                  <select
                    value={form.tournament_id}
                    onChange={e => setForm(f => ({ ...f, tournament_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  >
                    <option value="">None / Optional</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Match time</label>
                  <input
                    type="datetime-local"
                    value={form.match_time}
                    onChange={e => setForm(f => ({ ...f, match_time: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">
                      <code>completed</code> is set by the resolve flow only.
                    </p>
                  </div>
                )}
                {editingId && (
                  <div className="sm:col-span-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    Status and result are not editable here. Use <strong>Resolve</strong> on the row to set the outcome.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-300 border border-gray-700 rounded-lg hover:bg-[#0f1419] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.team1_id || !form.team2_id}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingId ? 'Update Match' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resolveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) closeResolve() }}
        >
          <div className="w-full max-w-lg rounded-xl bg-[#1a1f2e] border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">
                {resolveTarget.status === 'completed' ? 'Correct Result' : 'Resolve Match'}
              </h3>
              <button type="button" onClick={closeResolve} className="text-sm text-gray-400 hover:text-white">Close</button>
            </div>

            <div className="rounded-lg border border-gray-700 bg-[#0f1419] p-4 mb-4 text-center">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">{resolveTarget.tournament?.name ?? 'No tournament'}</p>
              <p className="text-lg font-bold text-white">
                {resolveTarget.team1?.name || teamName(resolveTarget.team1_id)}
                <span className="mx-2 text-gray-500 font-normal">vs</span>
                {resolveTarget.team2?.name || teamName(resolveTarget.team2_id)}
              </p>
              {resolveTarget.match_time && (
                <p className="text-xs text-gray-500 mt-1">{new Date(resolveTarget.match_time).toLocaleString()}</p>
              )}
            </div>

            {resolveTarget.status === 'completed' && (
              <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                This match is already resolved. Re-resolving will reverse all prior scoring_events and apply the new outcome.
              </div>
            )}

            {resolveSummary ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
                  <p className="font-semibold mb-2">Result applied.</p>
                  <ul className="space-y-1 text-xs">
                    <li>Predictions scored: <span className="font-bold">{resolveSummary.predictionsResolved ?? 0}</span></li>
                    <li>Correct: <span className="text-green-300 font-bold">{resolveSummary.correctPredictions ?? 0}</span></li>
                    <li>Incorrect: <span className="text-red-300 font-bold">{resolveSummary.incorrectPredictions ?? 0}</span></li>
                    {resolveSummary.predictionStats && (
                      <li>Accuracy: <span className="font-bold">{resolveSummary.predictionStats.accuracy}%</span> (avg confidence {resolveSummary.predictionStats.averageConfidence})</li>
                    )}
                  </ul>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeResolve}
                    className="px-4 py-2 text-sm text-gray-300 border border-gray-700 rounded-lg hover:bg-[#0f1419] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => handleResolve('team1_win')}
                  className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {resolveTarget.team1?.name || teamName(resolveTarget.team1_id)}
                  <span className="block text-[10px] uppercase tracking-widest opacity-80 mt-1">Team 1 Wins</span>
                </button>
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => handleResolve('team2_win')}
                  className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {resolveTarget.team2?.name || teamName(resolveTarget.team2_id)}
                  <span className="block text-[10px] uppercase tracking-widest opacity-80 mt-1">Team 2 Wins</span>
                </button>
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => handleResolve('draw')}
                  className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Draw
                  <span className="block text-[10px] uppercase tracking-widest opacity-80 mt-1">Void scoring</span>
                </button>
              </div>
            )}

            {resolving && (
              <p className="mt-3 text-xs text-gray-400 text-center">Resolving…</p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
