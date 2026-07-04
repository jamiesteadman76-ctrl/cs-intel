import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { searchUsers, updateUserAdminStatus, suspendUser, updateUserProfile, getUsersWithStats, requireAdmin, toggleAdminRole } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || undefined
    const sort = (searchParams.get('sort') || 'intel_score') as any
    const filter = (searchParams.get('filter') || 'all') as any
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (query && query.trim().length > 0) {
      const result = await searchUsers({ query, sort, filter, limit, offset })
      return NextResponse.json(result)
    }

    const users = await getUsersWithStats(sb)
    return NextResponse.json({ users, total: users.length })
  } catch (error) {
    console.error('[admin/users GET]', error)
    return NextResponse.json({ users: [], total: 0 }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (body.is_admin !== undefined && 'userId' in body) {
      const result = await updateUserAdminStatus(sb, body.userId, body.is_admin)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if ('userId' in body) {
      const result = await updateUserProfile(sb, body.userId, body)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[admin/users PATCH]', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await suspendUser(sb, body.userId)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/users DELETE]', error)
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
  }
}
