'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useModalA11y } from '../_hooks/useModalA11y'

interface Tournament {
  id: string
  name: string
  slug: string
  description: string | null
  prize_pool: string | null
  start_date: string | null
  end_date: string | null
  organizer: string | null
  location: string | null
  country: string | null
  status: 'upcoming' | 'live' | 'completed' | null
  featured: boolean | null
  logo: string | null
  match_count: number | null
  team_count: number | null
  created_at?: string
  updated_at?: string
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  prize_pool: '',
  start_date: '',
  end_date: '',
  organizer: '',
  location: '',
  country: '',
  status: 'upcoming',
  featured: false,
  logo: '',
  match_count: '0',
  team_count: '0',
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/tournaments', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load tournaments (${res.status})`)
        const data = await res.json()
        if (!cancelled) setTournaments(data.tournaments ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tournaments')
          setTournaments([])
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

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(t: Tournament) {
    setEditingId(t.id)
    setForm({
      name: t.name ?? '',
      slug: t.slug ?? '',
      description: t.description ?? '',
      prize_pool: t.prize_pool ?? '',
      start_date: toLocalInput(t.start_date),
      end_date: toLocalInput(t.end_date),
      organizer: t.organizer ?? '',
      location: t.location ?? '',
      country: t.country ?? '',
      status: t.status ?? 'upcoming',
      featured: Boolean(t.featured),
      logo: t.logo ?? '',
      match_count: t.match_count != null ? String(t.match_count) : '0',
      team_count: t.team_count != null ? String(t.team_count) : '0',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setToast({ type: 'error', message: 'Tournament name is required.' })
      return
    }

    setSaving(true)
    const body: Record<string, unknown> = {
      name: form.name.trim(),
    }
    const slug = form.slug.trim() || slugify(form.name)
    body.slug = slug
    if (form.description.trim()) body.description = form.description.trim()
    if (form.prize_pool.trim()) body.prize_pool = form.prize_pool.trim()
    if (form.start_date) body.start_date = new Date(form.start_date).toISOString()
    if (form.end_date) body.end_date = new Date(form.end_date).toISOString()
    if (form.organizer.trim()) body.organizer = form.organizer.trim()
    if (form.location.trim()) body.location = form.location.trim()
    if (form.country.trim()) body.country = form.country.trim()
    body.status = form.status
    body.featured = form.featured
    if (form.logo.trim()) body.logo = form.logo.trim()
    if (form.match_count.trim()) {
      const n = Number(form.match_count)
      if (Number.isFinite(n)) body.match_count = Math.max(0, Math.trunc(n))
    }
    if (form.team_count.trim()) {
      const n = Number(form.team_count)
      if (Number.isFinite(n)) body.team_count = Math.max(0, Math.trunc(n))
    }

    try {
      const url = editingId ? `/api/admin/tournaments/${editingId}` : '/api/admin/tournaments'
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
        setTournaments(prev => prev.map(t => (t.id === editingId ? (data.tournament as Tournament) : t)))
        setToast({ type: 'success', message: 'Tournament updated.' })
      } else {
        if (data.tournament) setTournaments(prev => [data.tournament as Tournament, ...prev])
        setToast({ type: 'success', message: 'Tournament created.' })
      }
      closeModal()
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save tournament' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(t: Tournament) {
    if (!confirm(`Delete tournament "${t.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/tournaments/${t.id}`, { method: 'DELETE', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`)
      setTournaments(prev => prev.filter(x => x.id !== t.id))
      setToast({ type: 'success', message: 'Tournament deleted.' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete tournament' })
    }
  }

  return (
    <main>
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                <Link href="/admin" className="hover:text-white">Admin</Link> / Tournaments
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Tournaments Management</h1>
              <p className="text-gray-400 mt-1 text-sm">Create and update CS2 tournaments, including scheduling and prize pools.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="self-start sm:self-auto px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              + Add Tournament
            </button>
          </div>

          {toast && (
            <div
              role="status"
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                toast.type === 'success'
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
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
            <div className="px-5 py-10 text-center text-sm text-gray-400">Loading tournaments…</div>
          ) : tournaments.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No tournaments yet. Click <span className="text-white">+ Add Tournament</span> to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tournament</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Start</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">End</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Prize</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tournaments.map(t => (
                    <tr key={t.id} className="hover:bg-[#1a1f2e]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-xs text-gray-500">
                          {t.location ?? '—'}{t.country ? `, ${t.country}` : ''}
                          {t.featured ? <span className="ml-2 text-[#e94560]">★ Featured</span> : null}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'live' ? 'bg-red-400/10 text-red-400 border border-red-400/20' :
                          t.status === 'completed' ? 'bg-gray-400/10 text-gray-400 border border-gray-400/20' :
                          'bg-green-400/10 text-green-400 border border-green-400/20'
                        }`}>{t.status ?? 'upcoming'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden lg:table-cell">
                        {t.start_date ? new Date(t.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden lg:table-cell">
                        {t.end_date ? new Date(t.end_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden sm:table-cell">
                        {t.prize_pool ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(t)}
                            className="text-xs font-medium text-[#00d4ff] hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
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
              <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Tournament' : 'Add Tournament'}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder={slugify(form.name) || 'auto-from-name'}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Prize pool</label>
                  <input
                    value={form.prize_pool}
                    onChange={e => setForm(f => ({ ...f, prize_pool: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    maxLength={80}
                    placeholder="$100,000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start date</label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End date</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Organizer</label>
                  <input
                    value={form.organizer}
                    onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Location</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    maxLength={160}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Country</label>
                  <input
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={form.logo}
                    onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Match count</label>
                  <input
                    type="number"
                    min={0}
                    value={form.match_count}
                    onChange={e => setForm(f => ({ ...f, match_count: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Team count</label>
                  <input
                    type="number"
                    min={0}
                    value={form.team_count}
                    onChange={e => setForm(f => ({ ...f, team_count: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  maxLength={5000}
                  className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                  className="rounded border-gray-700 bg-[#0f1419] text-[#e94560] focus:ring-[#e94560]"
                />
                Feature this tournament
              </label>

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
                  disabled={saving || !form.name.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingId ? 'Update Tournament' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
