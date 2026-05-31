'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="max-w-2xl mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6f6b]">CS Intel</span>
            </h1>
            <p className="text-lg text-gray-400">
              Get in touch with the team. We read every message.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* ========== FORM (2 cols) ========== */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 md:p-8">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                    <textarea
                      id="message"
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/50 transition-all resize-y"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#e94560] to-[#ff6f6b] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#e94560]/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* ========== SIDE INFO ========== */}
            <div className="space-y-6">
              {/* Support */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Support</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#e94560] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-gray-400">Email us at</p>
                      <p className="text-white font-medium">support@csintel.gg</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00d4ff] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-400">Response time</p>
                      <p className="text-white font-medium">Within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.222 3.127c-1.763-.992-3.631-.906-3.631-.906a15.76 15.76 0 00-3.658 1.847.093.093 0 00-.02.053c-.568 1.022-.91 2.196-.91 3.462 0 .027 0 .054.003.08 1.624.58 3.05 1.5 4.152 2.766.06-.051.12-.1.18-.15 1.574-1.376 3.164-2.37 4.884-2.158" />
                      <path d="M3.778 3.127c1.763-.992 3.631-.906 3.631-.906a15.76 15.76 0 013.658 1.847.093.093 0 01.02.053c.568 1.022.91 2.196.91 3.462 0 .027 0 .054-.003.08-1.624.58-3.05 1.5-4.152 2.766-.06-.051-.12-.1-.18-.15-1.574-1.376-3.164-2.37-4.884-2.158" />
                    </svg>
                    <div>
                      <p className="text-gray-400">Community Discord</p>
                      <p className="text-white font-medium">discord.gg/csintel</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Frequently Asked Questions
                  </a>
                  <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Documentation & Guides
                  </a>
                  <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Terms of Service
                  </a>
                  <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Privacy Policy
                  </a>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-br from-[#e94560]/10 to-[#0f3460]/10 border border-[#e94560]/30 rounded-xl p-6">
                <p className="text-sm font-semibold text-white mb-2">Prefer faster help?</p>
                <p className="text-xs text-gray-400 mb-4">Join our Discord community — the team is active there most days.</p>
                <button className="w-full py-3 bg-[#0f1419] border border-gray-700 text-white font-semibold rounded-lg hover:border-[#e94560]/50 transition-all text-sm">
                  Join Discord
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}