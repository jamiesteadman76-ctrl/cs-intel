import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0a0d12] border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              <span className="text-white">CS</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b6b]">
                Intel
              </span>
            </h2>
            <p className="text-gray-400 text-sm">
              Community-driven Counter-Strike 2 analysis and betting intelligence platform.
            </p>
          </div>

          {/* Links column 1 */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/matches" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Matches
                </Link>
              </li>
              <li>
                <Link href="/predictions" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Predictions
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Schedule
                </Link>
              </li>
              <li>
                <Link href="/rankings" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Rankings
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Links column 2 */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Links column 3 */}
          <div>
            <h3 className="font-semibold text-white mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/profile" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Links column 4 */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="py-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 CS Intel. All rights reserved.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-gray-400 hover:text-[#e94560] transition-colors"
              title="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-[#e94560] transition-colors"
              title="Discord"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.222 3.127c-1.763-.992-3.631-.906-3.631-.906a15.76 15.76 0 00-3.658 1.847.093.093 0 00-.02.053c-.568 1.022-.91 2.196-.91 3.462 0 .027 0 .054.003.08 1.624.58 3.05 1.5 4.152 2.766.06-.051.12-.1.18-.15 1.574-1.376 3.164-2.37 4.884-2.158" />
                <path d="M3.778 3.127c1.763-.992 3.631-.906 3.631-.906a15.76 15.76 0 013.658 1.847.093.093 0 01.02.053c.568 1.022.91 2.196.91 3.462 0 .027 0 .054-.003.08-1.624.58-3.05 1.5-4.152 2.766-.06-.051-.12-.1-.18-.15-1.574-1.376-3.164-2.37-4.884-2.158" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-[#e94560] transition-colors"
              title="Reddit"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-[#e94560] transition-colors"
              title="YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 4.75a3 3 0 00-3-3H4a3 3 0 00-3 3v14.5a3 3 0 003 3h16a3 3 0 003-3V4.75zM9.5 16.5v-9l6 4.5-6 4.5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
