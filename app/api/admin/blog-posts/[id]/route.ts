import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { getBlogPosts, updateBlogPost, deleteBlogPost, requireAdmin } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await getBlogPosts(sb)
    const post = posts.find(p => p.id === params.id)
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }
    return NextResponse.json({ post })
  } catch (error) {
    console.error('[admin/blog-posts/[id] GET]', error)
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const result = await updateBlogPost(sb, params.id, {
      title: body.title,
      content: body.content,
      category: body.category,
      preview: body.preview ?? null,
      slug: body.slug ?? null,
      read_time: body.read_time ?? null,
      published: body.published,
      featured: body.featured,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const posts = await getBlogPosts(sb)
    const updated = posts.find(p => p.id === params.id)
    return NextResponse.json({ post: updated })
  } catch (error) {
    console.error('[admin/blog-posts/[id] PATCH]', error)
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const sb = createSupabaseServer(cookieStore as any)
    const { authorized } = await requireAdmin(sb)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await deleteBlogPost(sb, params.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/blog-posts/[id] DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
  }
}
