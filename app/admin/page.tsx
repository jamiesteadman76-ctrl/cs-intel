'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getAdminDashboardStats } from '@/lib/api'
import { analyticsData, adminNotes, platformStatus, recentAlerts } from '@/lib/data'
import type {
  AdminStat,
  AdminActivity,
  AdminBlogPost,
  AdminIntelPost,
  AdminNote,
  PlatformStatus,
  Alert,
  AnalyticsCard
} from '@/lib/types'

interface AdminDiscussionRow {
  id: string
  title: string
  author: string
  created_at: string | null
  status: string
  reply_count: number
}

interface ReportRow {
  id: string
  type: string
  content_excerpt: string
  reason: string
  reporter: string
  created_at: string | null
  status: 'pending' | 'resolved' | 'dismissed'
}

interface ActivityItem {
  id: string
  action: string
  user: string
  timestamp: string
  icon: string
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0 || diff < 60_000) return 'just now'
  const min = Math.floor(diff / 60_000)
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return `${days}d ago`
}

const quickActionCards = [
  { title: 'Manage Teams', description: 'Add or edit CS2 teams', icon: '🛡️', href: '/admin/teams' },
  { title: 'Manage Tournaments', description: 'Create or update events', icon: '🏆', href: '/admin/tournaments' },
  { title: 'Add Match', description: 'Schedule new fixture', icon: '⚔️', href: '/admin/matches' },
  { title: 'Resolve Matches', description: 'Record results & score', icon: '🎯', href: '/admin/matches' },
  { title: 'Moderate Community', description: 'Review flagged posts', icon: '🛡️', href: '/admin' },
  { title: 'Site Analytics', description: 'View platform metrics', icon: '📈', href: '/admin' },
]

export default function AdminPage() {
  const [adminStats, setAdminStats] = useState<AdminStat[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [blogPosts, setBlogPosts] = useState<AdminBlogPost[]>([])
  const [blogLoading, setBlogLoading] = useState(true)
  const [intelPosts, setIntelPosts] = useState<AdminIntelPost[]>([])
  const [intelLoading, setIntelLoading] = useState(true)
  const [discussions, setDiscussions] = useState<AdminDiscussionRow[]>([])
  const [discussionsLoading, setDiscussionsLoading] = useState(true)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  // Map admin stat labels to their management page so cards become links.
  const statHref: Record<string, string> = {
    'Total Users': '/admin',
    'Total Teams': '/admin/teams',
    'Total Tournaments': '/admin/tournaments',
    'Total Matches': '/admin/matches',
    'Total Predictions': '/admin',
    'Total Posts': '/admin',
  }

  useEffect(() => {
    let cancelled = false

    async function loadStatsAndContent() {
      try {
        const [stats, blogRes, intelRes] = await Promise.all([
          getAdminDashboardStats(),
          supabase
            .from('blog_posts')
            .select('id, title, published, featured, views, preview, read_time, category, author_id, created_at, author:users!blog_posts_author_id_fkey(username)')
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .from('intel_posts')
            .select('id, title, category, published, featured, author_id, created_at, author:users!intel_posts_author_id_fkey(username)')
            .order('created_at', { ascending: false })
            .limit(20),
        ])

        if (cancelled) return

        setAdminStats([
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'Total Teams', value: stats.totalTeams },
          { label: 'Total Tournaments', value: stats.totalTournaments },
          { label: 'Total Matches', value: stats.totalMatches },
          { label: 'Total Predictions', value: stats.totalPredictions },
          { label: 'Total Posts', value: stats.totalPosts },
        ])
        setStatsLoading(false)

        const blogRows = blogRes.data ?? []
        setBlogPosts(
          blogRows.map((p: any) => ({
            id: p.id as string,
            title: (p.title as string) ?? 'Untitled',
            author: (p.author as { username?: string } | null)?.username ?? 'Unknown',
            date: p.created_at ? new Date(p.created_at as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
            status: p.published ? 'published' : 'draft',
            views: (p.views as number | null) ?? 0,
            featured: (p.featured as boolean | null) ?? false,
            preview: (p.preview as string | null) ?? undefined,
            readTime: (p.read_time as string | null) ?? undefined,
            category: (p.category as string | null) ?? undefined,
          })),
        )
        setBlogLoading(false)

        const intelRows = intelRes.data ?? []
        setIntelPosts(
          intelRows
            .filter((p: any) => p.published === true)
            .map((p: any) => ({
              id: p.id as string,
              title: (p.title as string) ?? 'Untitled',
              author: (p.author as { username?: string } | null)?.username ?? 'Unknown',
              date: p.created_at ? new Date(p.created_at as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
              status: p.featured ? 'featured' : 'published',
              category: (p.category as string | null) || 'General',
            })),
        )
        setIntelLoading(false)
      } catch (err) {
        if (!cancelled) {
          console.error('[admin stats/content load]', err)
        }
        if (!cancelled) {
          setStatsLoading(false)
          setBlogLoading(false)
          setIntelLoading(false)
        }
      }

      try {
        const [discussionsRes, flaggedRes] = await Promise.all([
          supabase
            .from('community_discussions')
            .select('id, title, status, reply_count, created_at, author_id, author:users!community_discussions_author_id_fkey(username)')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('community_posts')
            .select('id, content, created_at')
            .eq('flagged', true)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (cancelled) return

        const discussionRows = discussionsRes.data ?? []
        if (discussionsRes.error) {
          setDiscussions([])
        } else {
          setDiscussions(
            discussionRows.map((d: any) => ({
              id: d.id as string,
              title: (d.title as string) ?? 'Untitled',
              author: (d.author as { username?: string } | null)?.username ?? 'Unknown',
              created_at: d.created_at as string | null,
              status: (d.status as string) ?? 'active',
              reply_count: (d.reply_count as number | null) ?? 0,
            })),
          )
        }
        setDiscussionsLoading(false)

        const flaggedRows = flaggedRes.data ?? []
        if (flaggedRes.error) {
          setReports([])
        } else {
          setReports(
            flaggedRows.map((row: any) => ({
              id: row.id as string,
              type: 'Community Post',
              content_excerpt: ((row.content as string | null) ?? '').slice(0, 80),
              reason: 'Flagged',
              reporter: 'AutoMod',
              created_at: row.created_at as string | null,
              status: 'pending' as const,
            })),
          )
        }
        setReportsLoading(false)
      } catch {
        if (!cancelled) {
          setDiscussions([])
          setReports([])
          setDiscussionsLoading(false)
          setReportsLoading(false)
        }
      }
    }

    loadStatsAndContent()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadActivity() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id, result, status, match_time, team1:teams!matches_team1_id_fkey(name), team2:teams!matches_team2_id_fkey(name)')
          .eq('status', 'completed')
          .order('match_time', { ascending: false })
          .limit(6)
        if (cancelled) return
        if (error || !data) {
          setActivity([])
        } else {
          setActivity(
            data.map((m: any) => {
              const t1 = m.team1?.name ?? 'TBD'
              const t2 = m.team2?.name ?? 'TBD'
              let action: string
              let icon: string
              if (m.result === 'team1_win') {
                action = `${t1} defeated ${t2}`
                icon = '🏆'
              } else if (m.result === 'team2_win') {
                action = `${t2} defeated ${t1}`
                icon = '🏆'
              } else if (m.result === 'draw') {
                action = `${t1} drew with ${t2}`
                icon = '🤝'
              } else {
                action = `${t1} vs ${t2} (resolved)`
                icon = '✅'
              }
              return {
                id: m.id as string,
                action,
                user: 'System',
                timestamp: m.match_time ?? '',
                icon,
              }
            }),
          )
        }
      } catch (err) {
        if (!cancelled) console.error('[admin activity load]', err)
      } finally {
        if (!cancelled) setActivityLoading(false)
      }
    }
    loadActivity()
    return () => { cancelled = true }
  }, [])

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 via-transparent to-[#0f3460]/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage community content, matches and platform activity.</p>
            </div>
            <div className="text-sm text-gray-500">Last updated: Just now</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            {statsLoading ? (
              <div className="col-span-full text-xs text-gray-500">Loading stats...</div>
            ) : adminStats.length === 0 ? (
              <div className="col-span-full text-xs text-gray-500">No stats available yet.</div>
            ) : (
              adminStats.map((stat: AdminStat) => {
                const href = statHref[stat.label]
                const card = (
                  <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/40 transition-all h-full">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                  </div>
                )
                return href ? (
                  <Link key={stat.label} href={href} className="block">
                    {card}
                  </Link>
                ) : (
                  <div key={stat.label}>{card}</div>
                )
              })
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickActionCards.map(action => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/40 transition-all group"
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <p className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors">{action.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                {activityLoading ? (
                  <div className="text-sm text-gray-400 py-2">Loading activity…</div>
                ) : activity.length === 0 ? (
                  <div className="text-sm text-gray-400 py-2">No resolved matches yet.</div>
                ) : (
                  <div className="space-y-4">
                    {activity.map(item => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0f1419] border border-gray-700 flex items-center justify-center text-sm flex-shrink-0">{item.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate">{item.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.user} • {formatRelative(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">Content Management</h2>
              <div className="flex gap-2 mb-4">
                {['Blog Posts', 'Intel Posts', 'Discussions'].map(tab => (
                  <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'Blog Posts' ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white' : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:text-white'}`}>{tab}</button>
                ))}
              </div>
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Author</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {blogLoading ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Loading blog posts...</td>
                        </tr>
                      ) : blogPosts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No blog posts yet.</td>
                        </tr>
                      ) : blogPosts.map(post => (
                        <tr key={post.id} className="hover:bg-[#1a1f2e]/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-white truncate max-w-[200px]">{post.title}</p>
                            <p className="text-xs text-gray-500 md:hidden">{post.author} • {post.date}</p>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">{post.author}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{post.date}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              post.status === 'published' ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
                              post.status === 'draft' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' :
                              'bg-[#e94560]/10 text-[#e94560] border border-[#e94560]/20'
                            }`}>{post.status.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button className="text-xs font-medium text-[#00d4ff] hover:text-white transition-colors">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">Community Moderation</h2>
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-800">
                  {reportsLoading ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">Loading flagged content...</div>
                  ) : reports.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">No flagged content. Community is clean ✓</div>
                  ) : reports.map(report => (
                    <div key={report.id} className="px-5 py-4 hover:bg-[#1a1f2e]/60 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{report.type}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              report.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                              report.status === 'resolved' ? 'bg-green-400/10 text-green-400' :
                              'bg-gray-400/10 text-gray-400'
                            }`}>{report.status}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{report.content_excerpt}</p>
                          <p className="text-xs text-gray-500 mt-1">Reason: {report.reason} • Reported by {report.reporter} • {report.created_at ? new Date(report.created_at).toLocaleString() : '—'}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button className="px-3 py-1.5 text-xs font-medium text-green-400 border border-green-400/30 rounded hover:bg-green-400/10 transition-colors">Approve</button>
                          <button className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 transition-colors">Remove</button>
                          <button className="px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-700 rounded hover:bg-[#1a1f2e] transition-colors">Review</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">Analytics Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analyticsData.map((card: AnalyticsCard) => (
                    <div key={card.title} className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5 hover:border-[#e94560]/30 transition-all">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">{card.title}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-white">{card.value}{card.unit || ''}</p>
                          <p className={`text-xs font-medium mt-1 ${card.change > 0 ? 'text-green-400' : card.change < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {card.change > 0 ? '+' : ''}{card.change}% from last week
                          </p>
                        </div>
                        <div className={`text-lg ${card.chart === 'up' ? 'text-green-400' : card.chart === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                          {card.chart === 'up' ? '📈' : card.chart === 'down' ? '📉' : '➡️'}
                        </div>
                      </div>
                      <div className="flex items-end gap-1 mt-3 h-8">
                        {[40, 65, 45, 80, 55, 70, 60, 85, 50, 75, 90, 68].map((h, i) => (
                          <div key={i} className="flex-1 bg-[#e94560]/20 rounded-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-bold text-white mb-4">Admin Notes</h3>
              <div className="space-y-4">
                {adminNotes.map((note: AdminNote) => (
                  <div key={note.title} className="border-l-2 border-[#e94560] pl-3">
                    <p className="text-sm font-medium text-white">{note.title}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{note.content}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{note.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-bold text-white mb-4">Platform Status</h3>
              <div className="space-y-3">
                {platformStatus.map((item: PlatformStatus) => (
                  <div key={item.service} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{item.service}</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'operational' ? 'bg-green-400' : item.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                      <span className="text-xs text-gray-500">{item.uptime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-bold text-white mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {recentAlerts.map((alert: Alert) => (
                  <div key={alert.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-400' :
                      alert.severity === 'warning' ? 'bg-yellow-400' : 'bg-[#00d4ff]'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-300">{alert.message}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{alert.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <Link href="/admin/teams" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">🛡️ Teams</Link>
                <Link href="/admin/tournaments" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">🏆 Tournaments</Link>
                <Link href="/admin/matches" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">⚔️ Matches</Link>
                <Link href="/community" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Community</Link>
                <Link href="/matches" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">View Site →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
