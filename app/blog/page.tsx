'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getBlogPosts } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/lib/types'

const categories = ['Analysis', 'Betting', 'Teams', 'Meta'] as const

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const postsData = await getBlogPosts(supabase, true)

        const transformedPosts: BlogPost[] = postsData.map(post => ({
          id: post.id,
          title: post.title,
          category: post.category as BlogPost['category'],
          preview: post.preview || '',
          date: post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Recent',
          readTime: post.read_time ? `${post.read_time} min` : '5 min',
          featured: post.featured || false,
          views: post.views || 0
        }))

        setBlogPosts(transformedPosts)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch blog posts:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="bg-[#0f1419] text-gray-100 min-h-screen">
        <Header />
        <main>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Loading Blog...</h2>
              <p className="text-gray-400">Fetching latest articles...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const featured = blogPosts.find((p) => p.featured)
  const rest = blogPosts.filter((p) => !p.featured)

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

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-10 md:pb-14">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                CS Intel <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6f6b]">Blog</span>
              </h1>
              <p className="text-lg text-gray-400">
                Analysis, insights and CS2 esports breakdowns.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* MAIN CONTENT GRID                              */}
        {/* ============================================ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">

            {/* ========== LEFT COLUMN ========== */}
            <div className="lg:col-span-2 space-y-12">

              {/* -------------------------------------------- */}
              {/* FEATURED POST                                 */}
              {/* -------------------------------------------- */}
              {featured && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs font-semibold text-[#e94560] uppercase tracking-wider">Featured</span>
                    <span className="h-px flex-1 bg-gray-800"></span>
                  </div>

                  <article className="group bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl overflow-hidden hover:border-[#e94560]/40 transition-all">
                    <div className="p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <CategoryBadge category={featured.category} />
                        <span className="text-xs text-gray-500">{featured.date}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{featured.readTime}</span>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-[#e94560] transition-colors leading-tight">
                        {featured.title}
                      </h2>

                      <p className="text-gray-400 leading-relaxed mb-6">
                        {featured.preview}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6f6b] flex items-center justify-center text-white text-xs font-bold">
                            👤
                          </div>
                          <span className="text-sm text-gray-400">By CS Intel Team</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </section>
              )}

              {/* -------------------------------------------- */}
              {/* POSTS GRID                                   */}
              {/* -------------------------------------------- */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Latest Articles</span>
                  <span className="h-px flex-1 bg-gray-800"></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {rest.map((post) => (
                    <article
                      key={post.id}
                      className="group bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-5 md:p-6 hover:border-[#e94560]/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <CategoryBadge category={post.category} />
                      </div>

                      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#e94560] transition-colors leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">
                        {post.preview}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span>{post.date}</span>
                          <span>{post.readTime}</span>
                        </div>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {(post.views / 1000).toFixed(1)}k
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            {/* ========== RIGHT SIDEBAR ========== */}
            <div className="space-y-8">

              {/* Trending Posts */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#e94560]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Trending Posts
                </h3>
                <div className="space-y-4">
                  {blogPosts
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5)
                    .map((post, i) => (
                      <a
                        key={post.id}
                        href="#"
                        className="group block"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl font-black text-gray-700 leading-none mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-[#e94560] transition-colors leading-snug mb-1">
                              {post.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {(post.views / 1000).toFixed(1)}k views
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>

              {/* Popular Categories */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => {
                    const count = blogPosts.filter((p) => p.category === cat).length
                    return (
                      <button
                        key={cat}
                        className="w-full flex items-center justify-between p-3 bg-[#0f1419] rounded-lg border border-gray-800 hover:border-[#e94560]/30 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-300">{cat}</span>
                        <span className="text-xs font-bold text-[#00d4ff]">{count} articles</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Recent Updates */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-5 md:p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e94560] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e94560]"></span>
                  </span>
                  Recent Updates
                </h3>
                <div className="space-y-3">
                  {blogPosts.slice(0, 4).map((post) => (
                    <div key={post.id} className="group cursor-pointer">
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors leading-snug mb-1">
                        {post.title}
                      </p>
                      <span className="text-[10px] text-gray-600">{post.date} • {post.readTime}</span>
                    </div>
                  ))}
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
/* Reusable helpers                                                            */
/* ========================================================================== */

function CategoryBadge({ category }: { category: BlogPost['category'] }) {
  const styles: Record<string, string> = {
    Analysis: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20',
    Betting: 'bg-[#e94560]/10 text-[#e94560] border-[#e94560]/20',
    Teams: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    Meta: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  }

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[category]}`}>
      {category}
    </span>
  )
}