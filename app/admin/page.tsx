'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  adminStats,
  quickActions,
  adminActivities,
  adminBlogPosts,
  adminIntelPosts,
  adminDiscussions,
  reportItems,
  adminMatches,
  analyticsData,
  adminNotes,
  platformStatus,
  recentAlerts
} from '@/lib/data'
import type {
  AdminStat,
  QuickAction,
  AdminActivity,
  AdminBlogPost,
  AdminIntelPost,
  AdminDiscussion,
  ReportItem,
  AdminMatch,
  AnalyticsCard,
  AdminNote,
  PlatformStatus,
  Alert
} from '@/lib/types'

export default function AdminPage() {
  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />
      <main>
        {/* PAGE HEADER */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 via-transparent to-[#0f3460]/5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">Manage community content, matches and platform activity.</p>
              </div>
              <div className="text-sm text-gray-500">Last updated: Just now</div>
            </div>
            {/* 6 stat cards in 3x2 grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
              {adminStats.map((stat: AdminStat) => (
                <div key={stat.label} className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/40 transition-all">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN (2 cols) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* QUICK ACTIONS */}
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {quickActions.map(action => (
                    <a key={action.title} href={action.href} className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 hover:border-[#e94560]/40 transition-all group">
                      <div className="text-2xl mb-2">{action.icon}</div>
                      <p className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors">{action.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </a>
                  ))}
                </div>
              </section>

              {/* RECENT ACTIVITY */}
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                  <div className="space-y-4">
                    {adminActivities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0f1419] border border-gray-700 flex items-center justify-center text-sm flex-shrink-0">{activity.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-200">{activity.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{activity.user} • {activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* CONTENT MANAGEMENT */}
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Content Management</h2>
                
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  {['Blog Posts', 'Intel Posts', 'Discussions'].map(tab => (
                    <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'Blog Posts' ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white' : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:text-white'}`}>{tab}</button>
                  ))}
                </div>

                {/* Blog Posts Table */}
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
                        {adminBlogPosts.map(post => (
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
                              }`}>{post.status.replace('_', ' ')}</span>
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

              {/* COMMUNITY MODERATION */}
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Community Moderation</h2>
                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {reportItems.map(report => (
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
                            <p className="text-sm text-gray-400 truncate">{report.content}</p>
                            <p className="text-xs text-gray-500 mt-1">Reason: {report.reason} • Reported by {report.reporter} • {report.date}</p>
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

              {/* MATCH MANAGEMENT */}
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Match Management</h2>
                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Match</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tournament</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Time</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Featured</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {adminMatches.map(match => (
                          <tr key={match.id} className="hover:bg-[#1a1f2e]/60 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-medium text-white">{match.team1} vs {match.team2}</p>
                              <p className="text-xs text-gray-500 md:hidden">{match.tournament}</p>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">{match.tournament}</td>
                            <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{match.time}</td>
                            <td className="px-5 py-3.5">
                              {match.featured ? (
                                <span className="text-[#e94560]">⭐ Featured</span>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="text-xs font-medium text-[#00d4ff] hover:text-white transition-colors">Edit</button>
                                <button className="text-xs font-medium text-[#e94560] hover:text-white transition-colors">Feature</button>
                                <button className="text-xs font-medium text-gray-500 hover:text-white transition-colors">Archive</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ANALYTICS */}
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Analytics Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analyticsData.map(card => (
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
                      {/* Mini bar chart */}
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

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">
              
              {/* Admin Notes */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-bold text-white mb-4">Admin Notes</h3>
                <div className="space-y-4">
                  {adminNotes.map(note => (
                    <div key={note.title} className="border-l-2 border-[#e94560] pl-3">
                      <p className="text-sm font-medium text-white">{note.title}</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{note.content}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{note.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Status */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-bold text-white mb-4">Platform Status</h3>
                <div className="space-y-3">
                  {platformStatus.map(item => (
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

              {/* Recent Alerts */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-bold text-white mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {recentAlerts.map(alert => (
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

              {/* Quick Links */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <a href="/community" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Community</a>
                  <a href="/matches" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Matches</a>
                  <a href="/rankings" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Rankings</a>
                  <a href="/leaderboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Leaderboard</a>
                  <a href="/predictions" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Predictions</a>
                  <a href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">View Site →</a>
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
