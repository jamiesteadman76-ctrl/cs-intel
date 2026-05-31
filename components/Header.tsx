'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Matches', href: '/matches' },
    { label: 'Predictions', href: '/predictions' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Rankings', href: '/rankings' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Community', href: '/community' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#0a0d12] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="text-white">CS</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">
                {' '}Intel
              </span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/profile" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors">
              Profile
            </Link>
            <Link href="/blog" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors">
              Blog
            </Link>
            <Link href="/login" className="px-6 py-2 text-sm font-medium text-white border border-gray-600 rounded hover:border-gray-400 hover:bg-[#1a1f2e] transition-colors">
              Login
            </Link>
            <Link href="/signup" className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded hover:shadow-lg hover:shadow-[#e94560]/50 transition-all">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-[#1a1f2e] rounded"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile / Tablet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-800">
            <nav className="flex flex-col gap-1 mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-800 my-2"></div>
              <Link href="/blog" className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
              <Link href="/about" className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/contact" className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              <Link href="/profile" className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#1a1f2e] rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
            </nav>
            <div className="flex flex-col gap-3 mt-4">
              <Link href="/login" className="px-6 py-2.5 text-sm font-medium text-white border border-gray-600 rounded hover:border-gray-400 hover:bg-[#1a1f2e] transition-colors text-center" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link href="/signup" className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded hover:shadow-lg hover:shadow-[#e94560]/50 transition-all text-center" onClick={() => setMobileMenuOpen(false)}>
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
