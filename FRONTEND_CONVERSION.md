# CS INTEL — FRONTEND MIGRATION GUIDE

**Date:** June 2, 2026  
**Purpose:** Safe, staged replacement of mock data with real database queries  
**Philosophy:** Additive, never destructive. Each replacement only after DB is ready.

---

## CONVERSION ROADMAP

### Week 1 (Post-Phase 1): Replace Match Data
**Goal:** Show real matches instead of mocked

### Week 2 (Post-Phase 2): Add Content Systems
**Goal:** Enable blog and intel posts

### Week 3-4 (Post-Phase 3): Enable Community
**Goal:** Allow discussions and posts

### Week 5+ (Post-Phase 4): Analytics
**Goal:** Activity feed and user stats

---

## WEEK 1: MATCH DATA CONVERSION

### Current State
- Homepage shows 6 mocked matches from `lib/data.ts`
- Matches page shows `featuredMatch` (hardcoded)
- Rankings page shows mocked teams
- Schedule page shows mocked matches
- API has `getMatches()` but matches table is empty

### Target State
- Homepage shows real matches from DB
- Matches page dynamic (can load any match)
- Rankings computed from real data
- Schedule queries upcoming matches
- Real match data drives all displays

---

### Step 1: Verify matches table has data

**Before proceeding, confirm:**
```sql
SELECT COUNT(*) FROM teams;
-- Should be: >= 100

SELECT COUNT(*) FROM tournaments;
-- Should be: >= 8

SELECT COUNT(*) FROM matches;
-- Should be: >= 50 (seeded as part of Phase 1)
```

If matches table is still empty:
- You need to seed matches data first
- Run: `npm run seed:matches` (or manual SQL)
- Continue only after matches exist

---

### Step 2: Update Homepage Match Display

**File:** `app/page.tsx`

**Current Code:**
```typescript
import { matches } from '@/lib/data'

export default function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getMatches } from '@/lib/api'
import type { Match } from '@/lib/api'

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await getMatches()
        // Filter to upcoming/today's matches
        const upcomingMatches = data
          .filter(m => m.status === 'upcoming' || m.status === 'live')
          .slice(0, 6) // Show top 6
        setMatches(upcomingMatches)
      } catch (error) {
        console.error('Failed to load matches:', error)
        // Fall back to empty for now, can add mock data fallback if needed
      } finally {
        setLoading(false)
      }
    }
    loadMatches()
  }, [])

  if (loading) {
    return <div className="p-8 text-gray-400">Loading matches...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.length > 0 ? (
        matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))
      ) : (
        <div className="col-span-full text-gray-400 text-center p-8">
          No upcoming matches at this time
        </div>
      )}
    </div>
  )
}
```

**Key Changes:**
- ✅ Import from `@/lib/api` instead of `@/lib/data`
- ✅ Use `useEffect` to load data on mount
- ✅ Add loading state
- ✅ Add error handling
- ✅ Filter to upcoming matches only
- ✅ Handle empty state gracefully

**Testing:**
```
After deploy:
☐ Homepage loads without errors
☐ Matches display from real DB
☐ 6 or fewer matches shown (if seeded)
☐ Loading state shows briefly
☐ Error handling works if API fails
☐ Can still click on match cards
```

---

### Step 3: Update Featured Match Section

**File:** `app/page.tsx` (same file, second section)

**Current Code:**
```typescript
import { featuredMatch } from '@/lib/data'

// In render section:
<FeaturedMatch match={featuredMatch} />
```

**Replace With:**
```typescript
// At top:
'use client'

import { useEffect, useState } from 'react'
import { getMatches } from '@/lib/api'
import type { Match } from '@/lib/api'

// In render section:
{matches.length > 0 && (
  <FeaturedMatch match={matches[0]} /> // Use first match as featured
)}
```

**Testing:**
```
☐ Featured match section shows real data
☐ Displays first upcoming match
☐ All match fields display correctly
☐ No console errors
```

---

### Step 4: Update Intel Feed (News Section)

**File:** `app/page.tsx`

**Current Code:**
```typescript
import { intelPosts } from '@/lib/data'

// Later posts aren't populated until Phase 2
// For now, show empty state
```

**For Week 1 (Before Phase 2):**
```typescript
// Temporarily hide this section
{/* <section>
  <h2>Latest Intel</h2>
  {intelPosts.map(...)}
</section> */}

// Or show "Coming Soon"
<section className="bg-gray-900 rounded-lg p-8 text-center">
  <h2 className="text-xl font-bold mb-2">Latest Intel</h2>
  <p className="text-gray-400">Coming soon with real analysis posts</p>
</section>
```

**Re-enable in Week 2:** After migrations 11-12 execute, update to query intel_posts table.

---

### Step 5: Update Community Activity Feed

**File:** `app/page.tsx`

**Current Code:**
```typescript
import { communityActivity } from '@/lib/data'

// Shows mocked activities
{communityActivity.map((activity) => (
  <CommunityActivityItem key={activity.id} activity={activity} />
))}
```

**For Week 1:**
```typescript
// Show "Coming Soon" or temporarily disable
<section className="bg-gray-900 rounded-lg p-8 text-center">
  <h2 className="text-xl font-bold mb-2">Community Activity</h2>
  <p className="text-gray-400">Activity feed coming in next update</p>
</section>
```

**Re-enable in Week 5:** After migration 16 (activity_feed table), implement real queries.

---

### Step 6: Update Rankings Section

**File:** `app/page.tsx` and `app/rankings/page.tsx`

**Current Code:**
```typescript
import { rankings, rankingTeams } from '@/lib/data'

// Shows mocked rankings
{rankings.slice(0, 5).map((team) => (
  <RankingItem key={team.rank} team={team} />
))}
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getUsers } from '@/lib/api'
import type { User } from '@/lib/api'

// Convert users to team-like display
// (for now, using user leaderboard as placeholder)
// Later will compute actual team rankings from matches

export default function Rankings() {
  const [topTeams, setTopTeams] = useState<any[]>([])

  useEffect(() => {
    async function loadTeams() {
      try {
        // Temporary: show top users as "teams"
        const users = await getUsers()
        setTopTeams(users.slice(0, 5))
      } catch (error) {
        console.error('Failed to load rankings:', error)
      }
    }
    loadTeams()
  }, [])

  return (
    <div>
      {topTeams.map((team) => (
        <RankingItem key={team.id} team={team} />
      ))}
    </div>
  )
}
```

**Better Solution (Week 2+):**
```typescript
// After teams table is seeded, query teams directly

async function loadTeams() {
  try {
    const teamsData = await supabase
      .from('teams')
      .select('*')
      .order('rating', { ascending: false })
      .limit(10)
    setTopTeams(teamsData.data || [])
  } catch (error) {
    console.error('Failed to load teams:', error)
  }
}
```

**Testing:**
```
☐ Rankings page loads
☐ Top 5 teams/users display
☐ Sorted by rating/intel_score
☐ No errors
```

---

### Step 7: Update Schedule Page

**File:** `app/schedule/page.tsx`

**Current Code:**
```typescript
import { scheduleMatches } from '@/lib/data'

// Shows hardcoded schedule
{scheduleMatches.map((match) => (
  <div key={match.id}>{match.team1} vs {match.team2}</div>
))}
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getMatches } from '@/lib/api'
import type { Match } from '@/lib/api'

export default function Schedule() {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])

  useEffect(() => {
    async function loadSchedule() {
      try {
        const matches = await getMatches()
        const upcoming = matches
          .filter(m => m.status === 'upcoming')
          .sort((a, b) => {
            // Sort by match_time
            const aTime = new Date(a.time).getTime()
            const bTime = new Date(b.time).getTime()
            return aTime - bTime
          })
        setUpcomingMatches(upcoming)
      } catch (error) {
        console.error('Failed to load schedule:', error)
      }
    }
    loadSchedule()
  }, [])

  return (
    <div>
      {upcomingMatches.map((match) => (
        <div key={match.id}>
          {match.team1} vs {match.team2} — {match.time}
        </div>
      ))}
    </div>
  )
}
```

**Testing:**
```
☐ Schedule shows real upcoming matches
☐ Sorted chronologically
☐ All matches have valid times
☐ No duplicate entries
```

---

## WEEK 2: CONTENT SYSTEMS CONVERSION

### Prerequisites
- ✅ Phase 2 migrations complete (migrations 11-12)
- ✅ 20+ intel posts seeded
- ✅ 10+ blog posts seeded

---

### Step 8: Enable Intel Posts (Latest Intel section)

**File:** `app/page.tsx`

**Previous State:** Was hidden/disabled in Week 1

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { IntelPost } from '@/lib/types'

export default function Home() {
  const [intelPosts, setIntelPosts] = useState<IntelPost[]>([])

  useEffect(() => {
    async function loadIntelPosts() {
      try {
        const { data, error } = await supabase
          .from('intel_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(4)

        if (error) throw error
        setIntelPosts(data || [])
      } catch (error) {
        console.error('Failed to load intel posts:', error)
      }
    }
    loadIntelPosts()
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4">
      <h2 className="text-3xl font-bold mb-6">Latest Intel</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {intelPosts.map((post) => (
          <IntelPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
```

**Key Points:**
- ✅ Query intel_posts table (not mock data)
- ✅ Filter to published=true
- ✅ Sort by newest first
- ✅ Show 4 latest posts
- ✅ Error handling fallback

**Testing:**
```
☐ Intel posts section shows real data
☐ Only published posts shown
☐ Newest posts first
☐ Max 4 posts displayed
☐ Can't see draft posts (unpublished=false)
```

---

### Step 9: Enable Blog Page

**File:** `app/blog/page.tsx`

**Current Code:**
```typescript
import { blogPosts } from '@/lib/data'

// Hardcoded blog posts
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/lib/types'

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [featured, setFeatured] = useState<BlogPost | null>(null)

  useEffect(() => {
    async function loadBlogPosts() {
      try {
        // Load featured post
        const { data: featuredData } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .eq('featured', true)
          .limit(1)
          .single()

        setFeatured(featuredData || null)

        // Load all published posts
        const { data: allPosts } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(20)

        setBlogPosts(allPosts || [])
      } catch (error) {
        console.error('Failed to load blog posts:', error)
      }
    }
    loadBlogPosts()
  }, [])

  return (
    <div>
      {featured && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Featured Article</h2>
          <BlogCard post={featured} featured={true} />
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-4">All Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
```

**Key Points:**
- ✅ Featured article shown separately
- ✅ All published posts in grid
- ✅ Sorted by publication date
- ✅ Draft posts hidden from public

**Testing:**
```
☐ Blog page shows real articles
☐ Featured article displayed
☐ All articles in grid
☐ Only published articles visible
☐ Sorted correctly
☐ Can read full articles
```

---

### Step 10: Update Matches Page with Intel Posts

**File:** `app/matches/page.tsx`

**Current Code:**
```typescript
import { intelUpdates } from '@/lib/data'

// Shows mocked intel updates
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { IntelPost } from '@/lib/types'

// In component where intel updates shown:

const [intelUpdates, setIntelUpdates] = useState<IntelPost[]>([])

useEffect(() => {
  async function loadIntel() {
    try {
      const { data } = await supabase
        .from('intel_posts')
        .select('*')
        .eq('published', true)
        // Optionally filter to matchId if available
        .order('created_at', { ascending: false })
        .limit(5)

      setIntelUpdates(data || [])
    } catch (error) {
      console.error('Failed to load intel:', error)
    }
  }
  loadIntel()
}, [])

// In render:
{intelUpdates.map((post) => (
  <IntelFeed key={post.id} post={post} />
))}
```

**Testing:**
```
☐ Matches page shows real intel posts
☐ Newest posts first
☐ Only published posts
☐ Max 5 shown
```

---

## WEEK 3-4: COMMUNITY SYSTEMS CONVERSION

### Prerequisites
- ✅ Phase 3 migrations complete (migrations 13-15)
- ✅ 6 categories seeded
- ✅ 30+ discussions seeded
- ✅ 100+ community posts seeded

---

### Step 11: Enable Community Discussions

**File:** `app/community/page.tsx`

**Current Code:**
```typescript
import { communityDiscussions } from '@/lib/data'

// Shows hardcoded discussions
{communityDiscussions.slice(0, 4).map((discussion) => (
  <DiscussionCard key={discussion.id} discussion={discussion} />
))}
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CommunityDiscussion } from '@/lib/types'

export default function CommunityPage() {
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([])

  useEffect(() => {
    async function loadDiscussions() {
      try {
        const { data } = await supabase
          .from('community_discussions')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10)

        setDiscussions(data || [])
      } catch (error) {
        console.error('Failed to load discussions:', error)
      }
    }
    loadDiscussions()
  }, [])

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Trending Discussions</h2>
      <div className="space-y-4">
        {discussions.slice(0, 4).map((discussion) => (
          <DiscussionCard 
            key={discussion.id} 
            discussion={discussion}
            onReply={() => { /* handle reply */ }}
          />
        ))}
      </div>
    </section>
  )
}
```

**Key Changes:**
- ✅ Query community_discussions table
- ✅ Filter to active discussions only
- ✅ Sort by newest first
- ✅ Handle RLS (user can only see non-flagged)

**Testing:**
```
☐ Community page shows real discussions
☐ Only active discussions shown
☐ Newest discussions first
☐ Can click into discussion
☐ Can see posts in discussion
```

---

### Step 12: Enable Community Posts in Discussions

**File:** `components/CommunityDiscussionFeed.tsx`

**Current Code:**
```typescript
import { communityComments } from '@/lib/data'

// Shows hardcoded comments
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CommunityPost } from '@/lib/types'

interface CommunityDiscussionFeedProps {
  discussionId: string
}

export default function CommunityDiscussionFeed({ discussionId }: CommunityDiscussionFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPosts() {
      try {
        const { data } = await supabase
          .from('community_posts')
          .select(`
            *,
            users:author_id (username, avatar)
          `)
          .eq('discussion_id', discussionId)
          .eq('flagged', false)
          .order('created_at', { ascending: true })

        setPosts(data || [])
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoading(false)
      }
    }

    if (discussionId) {
      loadPosts()
    }
  }, [discussionId])

  if (loading) {
    return <div>Loading discussion...</div>
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span>{post.users?.avatar || '👤'}</span>
            <strong>{post.users?.username || 'Unknown'}</strong>
          </div>
          <p>{post.content}</p>
          <div className="mt-2 text-sm text-gray-400">
            {post.upvotes} upvotes
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Key Points:**
- ✅ Query posts by discussion_id
- ✅ Join with users table for usernames
- ✅ Filter to non-flagged posts
- ✅ Chronological order (oldest first in thread)
- ✅ Display upvote count

**Testing:**
```
☐ Discussion shows real posts
☐ All posts visible
☐ Only non-flagged posts shown
☐ Chronological order
☐ User info displays
☐ Upvote counts show
```

---

### Step 13: Add Post Creation UI

**File:** `app/community/page.tsx` or new `components/DiscussionDetail.tsx`

**Add This Feature:**
```typescript
'use client'

import { useState } from 'react'
import { useUser } from '@/lib/auth/useUser'
import { supabase } from '@/lib/supabase'

interface PostCreationProps {
  discussionId: string
  onPostCreated: () => void
}

export default function PostCreation({ discussionId, onPostCreated }: PostCreationProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('Please log in to post')
      return
    }

    if (!content.trim()) {
      alert('Post cannot be empty')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('community_posts')
        .insert({
          discussion_id: discussionId,
          author_id: user.id,
          content: content.trim(),
          upvotes: 0,
          reply_count: 0,
          flagged: false,
        })

      if (error) throw error

      setContent('')
      onPostCreated() // Refresh parent
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <p className="text-gray-400">Log in to join the discussion</p>
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
        rows={3}
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-semibold"
      >
        {loading ? 'Posting...' : 'Post'}
      </button>
    </form>
  )
}
```

**Key Points:**
- ✅ Requires authentication
- ✅ Validates non-empty content
- ✅ Inserts to community_posts table
- ✅ RLS policy ensures user_id matches
- ✅ Refreshes discussion after posting

**Testing:**
```
☐ Can't post when not logged in (shows message)
☐ Can't submit empty posts
☐ Post appears immediately after submit
☐ New post shows current user as author
☐ Post count increments
☐ Loading state works
```

---

## WEEK 5+: ANALYTICS CONVERSION

### Prerequisites
- ✅ Phase 4 migrations complete (migrations 16-18)
- ✅ Activity feed table ready
- ✅ Predictions aggregate table ready
- ✅ Snapshot job set up

---

### Step 14: Enable Activity Feed

**File:** `app/page.tsx` (Community Activity section)

**Current Code:**
```typescript
import { communityActivity } from '@/lib/data'

// Shows hardcoded activities
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityFeed } from '@/lib/types'

export default function Home() {
  const [activities, setActivities] = useState<ActivityFeed[]>([])

  useEffect(() => {
    async function loadActivities() {
      try {
        const { data } = await supabase
          .from('activity_feed')
          .select(`
            *,
            users:user_id (username, avatar)
          `)
          .order('created_at', { ascending: false })
          .limit(8)

        setActivities(data || [])
      } catch (error) {
        console.error('Failed to load activities:', error)
      }
    }
    loadActivities()
  }, [])

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Community Activity</h2>
      <div className="space-y-2">
        {activities.map((activity) => (
          <CommunityActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  )
}
```

**Testing:**
```
☐ Activity feed shows real activities
☐ Newest activities first
☐ Shows user avatars and names
☐ Different activity types displayed
☐ Limits to 8 activities
```

---

### Step 15: Update Admin Dashboard with Real Stats

**File:** `app/admin/page.tsx`

**Current Code:**
```typescript
import { adminStats, platformStatus, recentAlerts } from '@/lib/data'

// Shows hardcoded stats
```

**Replace With:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPredictions: 0,
    totalMatches: 0,
    totalDiscussions: 0,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        // Get user count
        const { count: userCount } = await supabase
          .from('users')
          .select('id', { count: 'exact' })

        // Get prediction count
        const { count: predCount } = await supabase
          .from('predictions')
          .select('id', { count: 'exact' })

        // Get match count
        const { count: matchCount } = await supabase
          .from('matches')
          .select('id', { count: 'exact' })

        // Get active users (predicted in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: recentPredictions } = await supabase
          .from('predictions')
          .select('user_id', { count: 'exact' })
          .gte('created_at', sevenDaysAgo)

        const activeUserSet = new Set(recentPredictions?.map(p => p.user_id) || [])

        // Get discussion count
        const { count: discussionCount } = await supabase
          .from('community_discussions')
          .select('id', { count: 'exact' })

        setStats({
          totalUsers: userCount || 0,
          activeUsers: activeUserSet.size,
          totalPredictions: predCount || 0,
          totalMatches: matchCount || 0,
          totalDiscussions: discussionCount || 0,
        })
      } catch (error) {
        console.error('Failed to load admin stats:', error)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Total Users" value={stats.totalUsers} />
      <StatCard label="Active (7d)" value={stats.activeUsers} />
      <StatCard label="Total Predictions" value={stats.totalPredictions} />
      <StatCard label="Total Matches" value={stats.totalMatches} />
      <StatCard label="Community Discussions" value={stats.totalDiscussions} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
```

**Testing:**
```
☐ Stats show real data
☐ User count accurate
☐ Active users calculated correctly
☐ Prediction count matches DB
☐ Stats update on page load
☐ No console errors
```

---

## TESTING CHECKLIST FOR EACH PHASE

### Phase 1 Testing
```
☐ Homepage shows real matches
☐ Matches from teams table
☐ FeaturedMatch component works
☐ Rankings show teams from DB
☐ Schedule page works
☐ No mock data visible (except where explicitly cached)
☐ All existing features still work
☐ Leaderboard unchanged
☐ Profile page unchanged
☐ Predictions still work
☐ Admin functions still work
```

### Phase 2 Testing
```
☐ Intel posts display on homepage
☐ Blog page shows real articles
☐ Featured blog post shows
☐ Only published posts visible
☐ Draft posts hidden from public
☐ Matches page shows intel posts
☐ No errors fetching data
☐ Proper error handling if API fails
```

### Phase 3 Testing
```
☐ Community discussions show real data
☐ Posts within discussions display
☐ Only non-flagged posts visible
☐ Can create new discussion (if admin)
☐ Can post in discussion (if logged in)
☐ Upvotes display
☐ User names/avatars show
☐ Chronological order correct
```

### Phase 4 Testing
```
☐ Activity feed shows real activities
☐ Admin stats are real (not mocked)
☐ User counts accurate
☐ Prediction counts accurate
☐ No performance degradation
☐ Trigger works for predictions aggregate
```

---

## SAFETY PROCEDURES

### Before Each Phase:
```
☐ Database phase complete and verified
☐ Data seeded and validated
☐ RLS policies tested
☐ All indexes created
☐ No pending migrations
☐ Team notified of changes
☐ Monitoring enabled
```

### During Frontend Conversion:
```
☐ One page/component at a time
☐ Test after each change
☐ Verify existing functionality not broken
☐ Check for console errors
☐ Verify API calls work
☐ Monitor database queries
```

### After Frontend Conversion:
```
☐ Full regression test
☐ All pages load without errors
☐ All features work as expected
☐ No console errors
☐ Performance acceptable
☐ Rollback procedures ready (if needed)
```

---

## ROLLBACK PROCEDURES

### If Frontend Change Breaks Existing Feature:

**Git rollback (simplest):**
```bash
git revert <commit-hash>  # Revert to before the change
git push origin main
```

**Or manual revert:**
1. Restore file to previous version
2. Restart server: `npm run dev`
3. Verify functionality restored
4. Diagnose issue
5. Re-attempt conversion with fix

### If Mock Data Needed During Testing:

**Temporarily keep mock fallback:**
```typescript
const [data, setData] = useState(mockData) // Start with mock

useEffect(() => {
  async function loadData() {
    try {
      const result = await fetchFromDB()
      setData(result) // Update with real data
    } catch (error) {
      console.error('Failed to load real data, using mock')
      // Keep mock data if DB fails
    }
  }
  loadData()
}, [])
```

---

## NEXT STEPS

1. **Start Week 1:** Execute Phase 1 database migrations
2. **After Phase 1 Succeeds:** Convert Homepage match display
3. **After Each Phase:** Verify tests pass before moving to next
4. **Weekly Reviews:** Check for performance issues, user feedback
5. **Post-Launch:** Monitor real data quality, adjust as needed

---

**Document Status:** Ready for Week 1 frontend conversion  
**Lead Engineer:** Reference this guide for safe, staged implementation

