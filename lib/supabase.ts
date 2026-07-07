import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient, createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Runtime guard — NEXT_PUBLIC_* are inlined at build time. If they are
// empty here, the env vars were missing during the Vercel build.
if (typeof window !== 'undefined') {
  if (!supabaseUrl || supabaseUrl === 'undefined' || !supabaseAnonKey || supabaseAnonKey === 'undefined') {
    console.error(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing!\n' +
      '  URL:  ' + supabaseUrl + '\n' +
      '  Key:  ' + (supabaseAnonKey ? supabaseAnonKey.slice(0, 8) + '...' : '(empty)')
    )
  }
}

/**
 * Lazily-initialized browser client.
 *
 * IMPORTANT: We use a lazy Proxy instead of a module-level `createBrowserClient()`
 * call so that this module can be safely imported at build time (e.g., during
 * static generation / `next build`). NEXT_PUBLIC_* env vars are only available
 * at request time in the deployed environment, not during the build phase.
 */
let _browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Get or create the browser-side Supabase client.
 * The client is created once on first access and cached for the lifetime of
 * the page. On the server side (SSR / build), this throws with a clear
 * instruction to use `createSupabaseServer()` instead.
 */
export function getBrowserClient(): ReturnType<typeof createBrowserClient> {
  if (!_browserClient) {
    if (typeof window === 'undefined') {
      throw new Error(
        'getBrowserClient() was called on the server. Use createSupabaseServer() ' +
        'from @/lib/supabase with a cookie store for server-side Supabase access.'
      )
    }
    _browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _browserClient
}

// Backward-compatible Proxy — existing code that imports `{ supabase }` from
// `@/lib/supabase` continues to work without changes. The client is NOT
// created at module level; it is deferred until first property access.
export const supabase = new Proxy(
  {} as ReturnType<typeof createBrowserClient>,
  {
    get(_target, prop) {
      return Reflect.get(getBrowserClient(), prop, getBrowserClient())
    },
  }
)

/**
 * Build a service_role Supabase client for server-only use (cron routes,
 * admin resolve flow, integrity RPC). NEVER import this client into a module
 * that is reachable from the browser bundle — `SUPABASE_SERVICE_ROLE_KEY`
 * is intentionally non-`NEXT_PUBLIC_` so Next.js will not inline it into JS.
 *
 * Throws if the env var is missing so misconfigurations fail loudly at boot
 * rather than silently writing with the anon key.
 */
export function createSupabaseAdmin(): SupabaseClient {
  if (!supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (server-side only). ' +
        'Never expose this variable to the browser.'
    )
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createSupabaseServer(cookieStore: {
  getAll: () => { name: string; value: string }[]
  set: (name: string, value: string, options?: any) => void
}): SupabaseClient {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = cookieStore.getAll()
        return cookies.map(c => ({ name: c.name, value: c.value }))
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch (error) {
          console.error('Error setting cookies:', error)
        }
      },
    },
  })
}

export async function getUserProfile(
  sb: SupabaseClient | undefined,
  userId: string
): Promise<{ is_admin: boolean } | null> {
  // Falls back to the global browser client for backward compatibility with
  // any callers that don't have a request-scoped client. Server-side callers
  // (e.g. requireAdmin) MUST pass their cookie-bound server client so the
  // read runs under the request's authenticated RLS context.
  const client = sb ?? supabase
  const { data, error } = await client
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST116') {
      console.warn(`User profile not found for user ${userId}`)
      return { is_admin: false }
    }
    console.error('Error fetching user profile:', error)
    return null
  }
  if (!data) {
    console.warn(`User profile not found for user ${userId}`)
    return { is_admin: false }
  }
  return data
}
