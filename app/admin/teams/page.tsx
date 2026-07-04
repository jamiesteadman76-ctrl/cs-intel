'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useModalA11y } from '../_hooks/useModalA11y'

interface Team {
  id: string
  name: string
  slug: string
  logo: string | null
  country: string | null
  founded_year: number | null
  website: string | null
  description: string | null
  rating: number | null
  win_rate: number | null
  recent_form: string | null
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
  logo: '',
  country: '',
  founded_year: '',
  website: '',
  rating: '2000',
  win_rate: '50',
  description: '',
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
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
        const res = await fetch('/api/admin/teams', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load teams (${res.status})`)
        const data = await res.json()
        if (!cancelled) setTeams(data.teams ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load teams')
          setTeams([])
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

  function openEdit(team: Team) {
    setEditingId(team.id)
    setForm({
      name: team.name ?? '',
      slug: team.slug ?? '',
      logo: team.logo ?? '',
      country: team.country ?? '',
      founded_year: team.founded_year != null ? String(team.founded_year) : '',
      website: team.website ?? '',
      rating: team.rating != null ? String(team.rating) : '2000',
      win_rate: team.win_rate != null ? String(team.win_rate) : '50',
      description: team.description ?? '',
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
      setToast({ type: 'error', message: 'Team name is required.' })
      return
    }

    setSaving(true)
    const body: Record<string, unknown> = {
      name: form.name.trim(),
    }
    const slug = form.slug.trim() || slugify(form.name)
    body.slug = slug
    if (form.logo.trim()) body.logo = form.logo.trim()
    if (form.country.trim()) body.country = form.country.trim()
    if (form.founded_year.trim()) {
      const n = Number(form.founded_year)
      if (Number.isFinite(n)) body.founded_year = Math.trunc(n)
    }
    if (form.website.trim()) body.website = form.website.trim()
    if (form.rating.trim()) {
      const n = Number(form.rating)
      if (Number.isFinite(n)) body.rating = Math.trunc(n)
    }
    if (form.win_rate.trim()) {
      const n = Number(form.win_rate)
      if (Number.isFinite(n)) body.win_rate = n
    }
    if (form.description.trim()) body.description = form.description.trim()

    try {
      const url = editingId ? `/api/admin/teams/${editingId}` : '/api/admin/teams'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      if (editingId) {
        setTeams(prev => prev.map(t => (t.id === editingId ? (data.team as Team) : t)))
        setToast({ type: 'success', message: 'Team updated.' })
      } else {
        if (data.team) setTeams(prev => [data.team as Team, ...prev])
        setToast({ type: 'success', message: 'Team created.' })
      }
      closeModal()
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save team' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(team: Team) {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/teams/${team.id}`, { method: 'DELETE', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`)
      setTeams(prev => prev.filter(t => t.id !== team.id))
      setToast({ type: 'success', message: 'Team deleted.' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete team' })
    }
  }

  return (
    <main>
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                <Link href="/admin" className="hover:text-white">Admin</Link> / Teams
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Teams Management</h1>
              <p className="text-gray-400 mt-1 text-sm">Add, edit, and remove CS2 teams used across matches and rankings.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="self-start sm:self-auto px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              + Add Team
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
            <div className="px-5 py-10 text-center text-sm text-gray-400">Loading teams…</div>
          ) : teams.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No teams yet. Click <span className="text-white">+ Add Team</span> to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Country</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Founded</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Rating</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Win %</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {teams.map(team => (
                    <tr key={team.id} className="hover:bg-[#1a1f2e]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{team.name}</p>
                        <p className="text-xs text-gray-500">{team.slug}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">{team.country ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden sm:table-cell">{team.founded_year ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden lg:table-cell">{team.rating ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden lg:table-cell">
                        {team.win_rate != null ? `${Number(team.win_rate).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(team)}
                            className="text-xs font-medium text-[#00d4ff] hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(team)}
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
              <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Team' : 'Add Team'}</h3>
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
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder={slugify(form.name) || 'auto-from-name'}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    maxLength={160}
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
                  <label className="block text-xs text-gray-400 mb-1">Country</label>
                  <input
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Founded year</label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={form.founded_year}
                    onChange={e => setForm(f => ({ ...f, founded_year: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Website</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rating (0–5000)</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={form.rating}
                    onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Win rate (0–100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.win_rate}
                    onChange={e => setForm(f => ({ ...f, win_rate: e.target.value }))}
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
                  maxLength={2000}
                  className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e94560]"
                />
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
                  disabled={saving || !form.name.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingId ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
