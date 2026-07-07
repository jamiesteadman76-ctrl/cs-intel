'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function DebugPage() {
  // ── env state ──────────────────────────────────────────────────────────
  const [envUrl, setEnvUrl] = useState<string | null>(null)
  const [envKey, setEnvKey] = useState<string | null>(null)
  const [envError, setEnvError] = useState<string | null>(null)

  // ── session & login state ──────────────────────────────────────────────
  const [sessionUser, setSessionUser] = useState<User | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginResult, setLoginResult] = useState<{
    ok: boolean
    message: string
    user?: User
    isAdmin?: boolean
  } | null>(null)

  // ── Read env vars on mount ─────────────────────────────────────────────
  useEffect(() => {
    // We read these at runtime so the page can show exactly what the client
    // sees, regardless of what was inlined during the build.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null

    setEnvUrl(url)
    setEnvKey(key)

    if (!url || !key) {
      setEnvError(
        !url && !key
          ? 'Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.'
          : !url
            ? 'NEXT_PUBLIC_SUPABASE_URL is missing.'
            : 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.'
      )
    }

    // Check if we already have a session
    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: any } }) => {
        setSessionUser(session?.user ?? null)
        setSessionLoading(false)
      })
      .catch(() => {
        setSessionLoading(false)
      })
  }, [])

  // ── Test login handler ─────────────────────────────────────────────────
  async function handleTestLogin() {
    setLoginLoading(true)
    setLoginResult(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoginResult({
          ok: false,
          message: `❌  ${error.name}: ${error.message}`,
        })
        return
      }

      if (!data.user) {
        setLoginResult({
          ok: false,
          message: '⚠️  API returned success but no user object.',
        })
        return
      }

      // Check if this user is an admin
      let isAdmin = false
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', data.user.id)
          .maybeSingle()
        isAdmin = profile?.is_admin ?? false
      } catch {
        // Non-critical — admin check might fail if RLS blocks it
      }

      setSessionUser(data.user)
      setLoginResult({
        ok: true,
        message: `✅  Login successful!`,
        user: data.user,
        isAdmin,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setLoginResult({ ok: false, message: `💥  Unexpected error: ${msg}` })
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1419] text-gray-100 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white">🧪 Auth Debug Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            This page is intentionally unauthenticated. It shows raw values the
            browser sees at runtime.
          </p>
        </div>

        {/* ── Environment Variables ─────────────────────────────────────── */}
        <section className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white mb-3">
            Environment Variables
          </h2>

          {envError && (
            <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ❌  {envError}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500 font-mono">
                NEXT_PUBLIC_SUPABASE_URL
              </span>
              <div
                className={`mt-1 px-3 py-2 rounded font-mono text-xs break-all ${
                  envUrl
                    ? 'bg-green-400/5 text-green-300 border border-green-400/20'
                    : 'bg-red-400/5 text-red-300 border border-red-400/20'
                }`}
              >
                {envUrl
                  ? envUrl.length > 30
                    ? envUrl.slice(0, 30) + '...'
                    : envUrl
                  : '(undefined)'}
              </div>
              {envUrl && (
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Full length: {envUrl.length} chars
                </p>
              )}
            </div>

            <div>
              <span className="text-gray-500 font-mono">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>
              <div
                className={`mt-1 px-3 py-2 rounded font-mono text-xs break-all ${
                  envKey
                    ? 'bg-green-400/5 text-green-300 border border-green-400/20'
                    : 'bg-red-400/5 text-red-300 border border-red-400/20'
                }`}
              >
                {envKey
                  ? envKey.slice(0, 10) + '...' + envKey.slice(-6)
                  : '(undefined)'}
              </div>
              {envKey && (
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Full length: {envKey.length} chars
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Existing Session ──────────────────────────────────────────── */}
        <section className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white mb-3">
            Existing Session
          </h2>

          {sessionLoading ? (
            <p className="text-sm text-gray-500">Checking session…</p>
          ) : sessionUser ? (
            <div className="text-sm text-green-300">
              <p>✅  Logged in as <strong>{sessionUser.email}</strong></p>
              <p className="text-gray-500 text-xs mt-1">
                User ID: {sessionUser.id}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              ⚪  No active session.
            </p>
          )}
        </section>

        {/* ── Test Login Form ───────────────────────────────────────────── */}
        <section className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white mb-3">
            Test Login
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white focus:border-[#e94560] focus:outline-none text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white focus:border-[#e94560] focus:outline-none text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="button"
              disabled={loginLoading || !email || !password}
              onClick={handleTestLogin}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                loginLoading || !email || !password
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white hover:shadow-lg hover:shadow-[#e94560]/50'
              }`}
            >
              {loginLoading ? 'Testing…' : 'Test Login'}
            </button>
          </div>

          {/* ── Login Result ────────────────────────────────────────────── */}
          {loginResult && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                loginResult.ok
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              <p className="font-semibold">{loginResult.message}</p>

              {loginResult.ok && loginResult.user && (
                <div className="mt-2 space-y-1 text-xs">
                  <p>User ID: <span className="font-mono">{loginResult.user.id}</span></p>
                  <p>Email: {loginResult.user.email}</p>
                  <p>
                    Admin:{' '}
                    {loginResult.isAdmin === undefined
                      ? '(check skipped)'
                      : loginResult.isAdmin
                        ? '✅ Yes'
                        : '❌ No'}
                  </p>
                  <p className="text-gray-500">
                    Created:{' '}
                    {loginResult.user.created_at
                      ? new Date(loginResult.user.created_at).toISOString()
                      : '(unknown)'}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Supabase Client Check ─────────────────────────────────────── */}
        <section className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white mb-3">
            Supabase Client Health
          </h2>
          <p className="text-sm text-gray-400">
            <span className="text-green-400">●</span>{' '}
            Client initialized:{' '}
            <span className="text-white font-mono">
              {typeof supabase === 'object' && supabase?.auth !== undefined
                ? 'supabase.auth is available'
                : 'NOT AVAILABLE'}
            </span>
          </p>
        </section>

      </div>
    </div>
  )
}
