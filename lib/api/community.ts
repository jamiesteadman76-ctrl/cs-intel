import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CommunityStats = { totalMembers: number; activeUsers: number; postsToday: number; commentsToday: number }
export type CommunityPost = { id: string; username: string; avatar: string; title: string; preview: string; category: string; replies: number; views: number; upvotes: number; timestamp: string; tags: string[] }
export type CommunityCategory = { id: string; name: string; icon: string; posts: number; viewing: number }
export type CommunityTag = { name: string; posts: number }
export type NewestMember = { username: string; avatar: string; joinedDate: string }
export type CommunityActivity = { id: string; user: string; action: string; match?: string; timestamp: string; votes: number }

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const todayIso = todayStart.toISOString()

function handleSupabaseError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { message?: string; details?: string; hint?: string }
    return maybe.details || maybe.hint || maybe.message || 'Unknown Supabase error'
  }
  return 'Unknown error'
}

export async function getCommunityStats(sb: SupabaseClient = supabase): Promise<CommunityStats> {
  try {
    const [usersResult, activeResult, postsResult, commentsResult] = await Promise.all([
      sb.from('users').select('id', { count: 'exact', head: true }),
      sb.from('users').select('id', { count: 'exact', head: true }).gt('intel_score', 0),
      sb.from('community_activity').select('id', { count: 'exact', head: true }).in('type', ['post']).gte('created_at', todayIso),
      sb.from('community_activity').select('id', { count: 'exact', head: true }).eq('type', 'comment').gte('created_at', todayIso),
    ])

    if (usersResult.error) return { totalMembers: 0, activeUsers: 0, postsToday: 0, commentsToday: 0 }
    if (activeResult.error) return { totalMembers: 0, activeUsers: 0, postsToday: 0, commentsToday: 0 }
    if (postsResult.error) return { totalMembers: 0, activeUsers: 0, postsToday: 0, commentsToday: 0 }
    if (commentsResult.error) return { totalMembers: 0, activeUsers: 0, postsToday: 0, commentsToday: 0 }

    const totalMembers = usersResult.count ?? 0
    const activeUsers = activeResult.count ?? 0
    const postsToday = postsResult.count ?? 0
    const commentsToday = commentsResult.count ?? 0

    return { totalMembers, activeUsers, postsToday, commentsToday }
  } catch {
    return { totalMembers: 0, activeUsers: 0, postsToday: 0, commentsToday: 0 }
  }
}

export async function getCommunityPosts(sb: SupabaseClient = supabase): Promise<CommunityPost[]> {
  try {
    const { data, error } = await sb
      .from('community_posts')
      .select('*, user:users!author_id(id, username, avatar)')
      .order('created_at', { ascending: false })

    if (error) return []

    const posts = (data ?? []).map((row: any) => {
      const user = row.user as { id: string; username: string; avatar: string } | null
      const title = row.title || row.content?.slice(0, 80) || 'Untitled Post'
      const preview = row.content?.slice(0, 150) || ''
      const tags = Array.isArray(row.tags) ? row.tags : []
      return {
        id: String(row.id),
        username: user?.username ?? 'Anonymous',
        avatar: user?.avatar ?? '',
        title,
        preview,
        category: row.category ?? 'General',
        replies: 0,
        views: row.views ?? 0,
        upvotes: row.upvotes ?? 0,
        timestamp: row.created_at ?? '',
        tags,
      }
    })

    const postIds = posts.map((p: CommunityPost) => p.id)
    if (postIds.length > 0) {
      const { data: commentsData } = await sb
        .from('community_comments')
        .select('post_id')
        .in('post_id', postIds)

      const replyCounts: Record<string, number> = {}
      for (const row of commentsData ?? []) {
        replyCounts[row.post_id] = (replyCounts[row.post_id] ?? 0) + 1
      }
      for (const post of posts) {
        post.replies = replyCounts[post.id] ?? 0
      }
    }

    return posts
  } catch {
    return []
  }
}

export async function getCommunityCategories(sb: SupabaseClient = supabase): Promise<CommunityCategory[]> {
  try {
    const [categoriesResult, postsResult] = await Promise.all([
      sb.from('community_categories').select('id, name, icon'),
      sb.from('community_posts').select('category').not('category', 'is', null),
    ])

    if (categoriesResult.error) return []

    const categoryPostCounts: Record<string, number> = {}
    for (const row of postsResult?.data ?? []) {
      if (row.category) {
        categoryPostCounts[row.category] = (categoryPostCounts[row.category] ?? 0) + 1
      }
    }

    return (categoriesResult.data ?? []).map((row: any) => ({
      id: String(row.id),
      name: row.name ?? 'Uncategorized',
      icon: row.icon ?? '💬',
      posts: categoryPostCounts[row.name] ?? 0,
      viewing: 0,
    }))
  } catch {
    return []
  }
}

export async function getCommunityTags(sb: SupabaseClient = supabase): Promise<CommunityTag[]> {
  try {
    const { data, error } = await sb
      .from('community_posts')
      .select('tags')
      .not('tags', 'is', null)
      .neq('tags', '[]')

    if (error) return []

    const tagCounts: Record<string, number> = {}
    for (const row of data ?? []) {
      const tags = Array.isArray(row.tags) ? row.tags : []
      for (const tag of tags) {
        const name = typeof tag === 'string' ? tag.toLowerCase().trim() : String(tag).toLowerCase().trim()
        if (name) tagCounts[name] = (tagCounts[name] ?? 0) + 1
      }
    }

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, posts: count }))
  } catch {
    return []
  }
}

export async function getCommunityActivity(sb: SupabaseClient = supabase): Promise<CommunityActivity[]> {
  try {
    const { data, error } = await sb
      .from('community_activity')
      .select('*, user:users!user_id(id, username)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return []

    return (data ?? []).map((row: any) => ({
      id: String(row.id),
      user: row.user?.username ?? 'Anonymous',
      action: row.type === 'post' ? 'created a post' : row.type === 'comment' ? 'commented on a post' : String(row.type ?? ''),
      match: undefined,
      timestamp: row.created_at ?? '',
      votes: 0,
    }))
  } catch {
    return []
  }
}

export async function getNewestMembers(sb: SupabaseClient = supabase): Promise<NewestMember[]> {
  try {
    const { data, error } = await sb
      .from('users')
      .select('username, avatar, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) return []

    return (data ?? []).map((row: any) => ({
      username: row.username ?? 'Anonymous',
      avatar: row.avatar ?? '',
      joinedDate: row.created_at ?? '',
    }))
  } catch {
    return []
  }
}