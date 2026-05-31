'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2">

          {/* ========== LEFT: SIGNUP FORM ========== */}
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
                  Create your account
                </h2>
                <p className="text-gray-400 text-sm md:text-base">
                  Join the community. Start predicting, discussing, and climbing the leaderboard.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 md:p-8">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ClutchKing"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
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
                        placeholder="Min. 8 characters"
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

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all"
                    />
                  </div>

                  {/* Terms Checkbox */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          agreed
                            ? 'bg-[#e94560] border-[#e94560]'
                            : 'border-gray-600 group-hover:border-gray-500'
                        }`}>
                          {agreed && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                        I agree to the{' '}
                        <button className="text-[#00d4ff] hover:underline">Terms of Service</button>
                        {' '}and{' '}
                        <button className="text-[#00d4ff] hover:underline">Privacy Policy</button>
                      </span>
                    </label>
                  </div>

                  {/* Create Account Button */}
                  <button
                    type="submit"
                    disabled={!agreed}
                    className={`w-full py-3.5 rounded-lg font-bold transition-all ${
                      agreed
                        ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white hover:shadow-lg hover:shadow-[#e94560]/50 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Create Account
                  </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-500 mt-6">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#e94560] font-semibold hover:text-[#ff6b6b] transition-colors">
                    Login
                  </Link>
                </p>
              </div>

              {/* Subtle footer note */}
              <p className="text-center text-xs text-gray-600 mt-6">
                Protected by enterprise-grade security. Your data is encrypted end-to-end.
              </p>
            </div>
          </div>

          {/* ========== RIGHT: BENEFITS PANEL ========== */}
          <div className="hidden lg:flex flex-col border-l border-gray-800 bg-[#0a0d12]">
            {/* Top: Benefits */}
            <div className="p-8 border-b border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">
                Why join CS Intel?
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: '💬',
                    title: 'Join Community Discussions',
                    desc: 'Debate matches, teams, and betting markets with thousands of CS2 enthusiasts.',
                  },
                  {
                    icon: '🎯',
                    title: 'Make Predictions',
                    desc: 'Track your predictions, build your track record, and climb the ranks.',
                  },
                  {
                    icon: '⭐',
                    title: 'Build Your Intel Score',
                    desc: 'Earn reputation through quality analysis, accurate calls, and helpful contributions.',
                  },
                  {
                    icon: '📊',
                    title: 'Track Your Accuracy',
                    desc: 'See detailed stats on your predictions, upvotes, and community impact over time.',
                  },
                ].map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1f2e] border border-gray-800 flex items-center justify-center text-lg flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{benefit.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Leaderboard Preview */}
            <div className="p-8 border-b border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Example Leaderboard
              </p>

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-5">
                <div className="space-y-3">
                  {[
                    { rank: 1, name: 'ClutchKing', score: 12450, accent: true },
                    { rank: 2, name: 'BetAnalyzer', score: 11200, accent: false },
                    { rank: 3, name: 'MapVetoMaster', score: 9870, accent: false },
                    { rank: 4, name: 'You?', score: 0, accent: false, isPlaceholder: true },
                  ].map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-3 ${
                        entry.isPlaceholder ? 'opacity-60' : ''
                      }`}
                    >
                      <span className={`text-sm font-black w-5 ${
                        entry.accent ? 'text-[#e94560]' : 'text-gray-500'
                      }`}>
                        {entry.rank}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        entry.accent
                          ? 'bg-gradient-to-br from-[#e94560] to-[#ff6b6b] text-white'
                          : entry.isPlaceholder
                            ? 'bg-gray-700 text-gray-500 border-2 border-dashed border-gray-600'
                            : 'bg-[#0f1419] border border-gray-700 text-gray-400'
                      }`}>
                        {entry.isPlaceholder ? '?' : '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          entry.isPlaceholder ? 'text-gray-400' : 'text-white'
                        }`}>
                          {entry.name}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${
                        entry.accent ? 'text-[#00d4ff]' : 'text-gray-500'
                      }`}>
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">pts</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-500">
                    Top contributors earn exclusive badges and recognition
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom: CTA */}
            <div className="p-8 flex-1 flex flex-col justify-end">
              <div className="bg-gradient-to-br from-[#e94560]/10 to-[#0f3460]/10 border border-[#e94560]/30 rounded-lg p-5">
                <p className="text-sm font-semibold text-white mb-2">
                  Ready to start your journey?
                </p>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Over 48,000 members already sharing intel, making predictions, and building their reputation.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['👤','👤','👤','👤'].map((avatar, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white text-xs border-2 border-[#0a0d12]">
                        {avatar}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    <span className="text-green-400 font-semibold">+1,243</span> joined this week
                  </span>
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