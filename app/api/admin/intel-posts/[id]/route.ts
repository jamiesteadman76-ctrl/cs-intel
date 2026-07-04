import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase'
import { getIntelPosts, updateIntelPost, deleteIntelPost, requireAdmin } from '@/lib/api'

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

    const posts = await getIntelPosts(sb)
    const post = posts.find(p => p.id === params.id)
    if (!post) {
      return NextResponse.json({ error: 'Intel post not found' }, { status: 404 })
    }
    return NextResponse.json({ post })
  } catch (error) {
    console.error('[admin/intel-posts/[id] GET]', error)
    return NextResponse.json({ error: 'Failed to fetch intel post' }, { status: 500 })
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

    const result = await updateIntelPost(sb, params.id, {
      title: body.title,
      content: body.content,
      category: body.category,
      published: body.published,
      featured: body.featured,
      slug: body.slug ?? null,
      featured_image: body.featured_image ?? null,
      excerpt: body.excerpt ?? null,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const posts = await getIntelPosts(sb)
    const updated = posts.find(p => p.id === params.id)
    return NextResponse.json({ post: updated })
  } catch (error) {
    console.error('[admin/intel-posts/[id] PATCH]', error)
    return NextResponse.json({ error: 'Failed to update intel post' }, { status: 500 })
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

    const result = await deleteIntelPost(sb, params.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/intel-posts/[id] DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete intel post' }, { status: 500 })
  }
}
