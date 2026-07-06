import { supabase } from '@/lib/supabase'

export async function signUp(email: string, password: string, username: string) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!username || !usernameRegex.test(username)) {
    throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores')
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (existingUser) {
    throw new Error('Username already exists. Please choose a different username.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  })

  if (error) throw error

  return { user: data.user, error: null }
}

export async function signIn(email: string, password: string) {
  // Runtime diagnostic: log the actual Supabase URL being used.
  // If this shows 'undefined' in production browser console, the env var is
  // missing in Vercel (Settings → Environment Variables → Production).
  console.log('[auth] supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[auth] signInWithPassword failed:', error)
    throw error
  }

  if (!data.user) {
    const msg = 'Login succeeded but no user was returned'
    console.error('[auth]', msg)
    throw new Error(msg)
  }

  return { user: data.user, error: null }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return { error: null }
}