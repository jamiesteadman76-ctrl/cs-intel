'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { communityStats, intelPosts, trendingMatches } from '@/lib/data'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2">

          {/* ========== LEFT: LOGIN FORM ========== */}
          <div className="flex items-center justify-center px-4 py-12 md:py-16">
            <div className="w-full max-w-md">
              {/* Logo */}
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  <span className="text-white">CS</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">
                    Intel
                  </span>
                </h1>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Welcome back
                </h2>
                <p className="text-gray-400 text-sm md:text-base">
                  Sign in to access match intel, community predictions, and live discussion.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 md:p-8">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email or Username
                    </label>
                    <input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.293-4.293M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.543 7-4.477 0-8.268-2.943-9.543-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          remember
                            ? 'bg-[#e94560] border-[#e94560]'
                            : 'border-gray-600 group-hover:border-gray-500'
                        }`}>
                          {remember && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        Remember me
                      </span>
                    </label>
                    <button className="text-sm text-[#00d4ff] hover:text-[#00d4ff]/80 transition-colors font-medium">
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign In
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                      <span className="bg-[#1a1f2e] px-4 text-gray-500">or continue with</span>
                    </div>
                  </div>

                  {/* Google Button */}
                  <button
                    type="button"
                    className="w-full py-3.5 bg-[#0f1419] border-2 border-gray-700 text-white font-semibold rounded-lg hover:border-gray-500 hover:bg-[#1a1f2e] transition-all flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 11v2.4h3.97c-.16 1.03-1.2 3.02-3.97 3.02-2.39 0-4.34-1.98-4.34-4.42S9.61 7.58 12 7.58c1.36 0 2.27.58 2.79 1.08l1.9-1.83C15.47 5.69 13.89 5 12 5 8.13 5 5 8.13 5 12s3.13 7 7 7c4.04 0 6.72-2.84 6.72-6.84 0-.46-.05-.81-.11-1.16H12z" />
                      <path fill="#4285F4" d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.16-2.43c-.89.6-2.04.95-3.45.95-2.64 0-4.88-1.79-5.68-4.21H3.21v2.76C4.9 19.92 8.18 22 12 22z" />
                      <path fill="#FBBC05" d="M6.32 13.79A6.98 6.98 0 016 12c0-.68.12-1.33.32-1.95V7.29H3.21C2.29 9.36 2 10.63 2 12s.29 2.64.21 3.71l3.11-1.92z" />
                      <path fill="#34A853" d="M12 5.75c1.48 0 2.82.51 3.87 1.51l2.87-2.87C16.46 2.61 14.43 1.75 12 1.75 8.18 1.75 4.9 3.83 3.21 7.29l3.11 2.44c.8-2.42 3.04-3.98 5.68-3.98z" />
                    </svg>
                    Continue with Google
                  </button>
                </form>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-gray-500 mt-6">
                  Don&apos;t have an account?{' '}
                  <button className="text-[#e94560] font-semibold hover:text-[#ff6b6b] transition-colors">
                    Sign up free
                  </button>
                </p>
              </div>

              {/* Subtle footer note */}
              <p className="text-center text-xs text-gray-600 mt-6">
                Protected by enterprise-grade security. Your data is encrypted end-to-end.
              </p>
            </div>
          </div>

          {/* ========== RIGHT: INFO PANEL ========== */}
          <div className="hidden lg:flex flex-col border-l border-gray-800 bg-[#0a0d12]">
            {/* Top: Community Stats */}
            <div className="p-8 border-b border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Community Stats
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-800">
                  <p className="text-2xl font-bold text-white">{communityStats.totalMembers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Members</p>
                </div>
                <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-800">
                  <p className="text-2xl font-bold text-green-400">{communityStats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Active Now</p>
                </div>
                <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-800">
                  <p className="text-2xl font-bold text-[#00d4ff]">{communityStats.postsToday}</p>
                  <p className="text-xs text-gray-500 mt-1">Posts Today</p>
                </div>
                <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-800">
                  <p className="text-2xl font-bold text-[#e94560]">{communityStats.commentsToday.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Comments Today</p>
                </div>
              </div>
            </div>

            {/* Middle: Trending Match */}
            <div className="p-8 border-b border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Trending Match of the Day
              </p>
              {trendingMatches.length > 0 && (
                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{trendingMatches[0].logo1}</span>
                      <span className="text-sm font-bold text-white">{trendingMatches[0].team1}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-bold uppercase">VS</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{trendingMatches[0].team2}</span>
                      <span className="text-2xl">{trendingMatches[0].logo2}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{trendingMatches[0].tournament}</span>
                    <span className="text-[#00d4ff] font-medium">{trendingMatches[0].time}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#0f1419] rounded-md p-2 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Prediction</p>
                      <p className="text-sm font-bold text-[#e94560]">42%</p>
                    </div>
                    <div className="flex-1 bg-[#0f1419] rounded-md p-2 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Community</p>
                      <p className="text-sm font-bold text-[#00d4ff]">58%</p>
                    </div>
                    <div className="flex-1 bg-[#0f1419] rounded-md p-2 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Comments</p>
                      <p className="text-sm font-bold text-white">847</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Latest Intel */}
            <div className="p-8 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Latest Intel
              </p>
              <div className="space-y-4">
                {intelPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="group cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#e94560] mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors leading-snug mb-1">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-600">
                          <span className="uppercase tracking-wider font-medium">{post.category}</span>
                          <span>{post.timestamp}</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            {post.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decorative bottom */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-xs text-gray-500">
                    <span className="text-green-400 font-semibold">{communityStats.activeUsers.toLocaleString()}</span> members online now
                  </p>
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