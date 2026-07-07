import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, requireAdmin } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await getBlogPosts(sb)
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('[admin/blog-posts GET]', error)
    return NextResponse.json({ posts: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const required = ['title', 'content', 'category', 'author_id']
    for (const field of required) {
      if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const result = await createBlogPost(sb, {
      title: body.title.trim(),
      content: body.content,
      category: body.category,
      author_id: body.author_id,
      preview: body.preview || null,
      slug: body.slug || null,
      read_time: body.read_time || null,
      published: body.published ?? false,
      featured: body.featured ?? false,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const posts = await getBlogPosts(sb)
    const created = posts.find(p => p.id === result.id)
    return NextResponse.json({ post: created }, { status: 201 })
  } catch (error) {
    console.error('[admin/blog-posts POST]', error)
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
  }
}
