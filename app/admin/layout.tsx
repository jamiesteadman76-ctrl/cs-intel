'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface NavItem {
  label: string
  href: string
  icon: string
  description: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊', description: 'Overview & activity' },
  { label: 'Teams', href: '/admin/teams', icon: '🛡️', description: 'Manage CS2 teams' },
  { label: 'Tournaments', href: '/admin/tournaments', icon: '🏆', description: 'Manage events' },
  { label: 'Matches', href: '/admin/matches', icon: '⚔️', description: 'Schedule & resolve' },
]

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen flex flex-col">
      <Header />

      {/* Mobile horizontal nav (below header) */}
      <div className="lg:hidden sticky top-16 z-30 bg-[#0a0d12] border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            type="button"
            onClick={() => setMobileNavOpen(o => !o)}
            className="text-sm font-semibold text-gray-300 hover:text-white"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? '✕ Close' : '☰ Admin Menu'}
          </button>
          <span className="text-xs text-gray-500">
            {navItems.find(n => isItemActive(pathname, n.href))?.label ?? 'Admin'}
          </span>
        </div>
        {mobileNavOpen && (
          <nav className="flex flex-col border-t border-gray-800">
            {navItems.map(item => {
              const active = isItemActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`px-4 py-3 text-sm font-medium border-b border-gray-800 transition-colors ${
                    active
                      ? 'bg-gradient-to-r from-[#e94560]/20 to-transparent text-white border-l-2 border-l-[#e94560]'
                      : 'text-gray-300 hover:bg-[#1a1f2e]'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-gray-800 bg-[#0a0d12] sticky top-20 self-start h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="p-5 border-b border-gray-800">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Admin</p>
            <p className="text-base font-semibold text-white mt-1">Control Panel</p>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map(item => {
              const active = isItemActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#e94560]/15 to-transparent text-white border border-[#e94560]/30'
                      : 'text-gray-400 hover:bg-[#1a1f2e] hover:text-white border border-transparent'
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    <span className="block text-[11px] text-gray-500 group-hover:text-gray-400 truncate">
                      {item.description}
                    </span>
                  </span>
                </Link>
              )
            })}
          </nav>
          <div className="p-3 mt-2 border-t border-gray-800">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white transition-colors"
            >
              ← Back to site
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <Footer />
    </div>
  )
}
