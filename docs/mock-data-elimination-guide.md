# CS Intel - Mock Data Elimination Implementation Guide

**Date:** June 1, 2026  
**Purpose:** Step-by-step guide to replace ALL mock data with database-backed queries  
**Target:** Zero mock data in production

---

## Part 1: Complete Mock Data Audit & Replacement Map

### Section A: Match-Related Mock Data (lib/data.ts)

#### Mock: matches[]
```typescript
// BEFORE (lib/data.ts)
export const matches = [ ... ] // 1 hardcoded match

// AFTER (app/page.tsx or component)
import { getMatches } from '@/lib/api/matches'

export default async function HomePage() {
  const matches = await getMatches({ 
    status: 'upcoming', 
    limit: 10 
  })
  // Renders real matches from database
}
```

**Migration:**
- [ ] Create `matches` table with foreign keys to teams, tournaments
- [ ] Seed 50-100 test matches from HLTV data
- [ ] Create `getMatches()` API function
- [ ] Update HomePage component to use async API call
- [ ] Delete `matches` from lib/data.ts

---

#### Mock: featuredMatch
```typescript
// BEFORE
export const featuredMatch = { ... }

// AFTER
export async function getFeaturedMatch(): Promise<Match> {
  const { data } = await supabase
    .from('matches')
    .select(`
      *,
      teams!team1_id(*),
      teams!team2_id(*)
    `)
    .eq('featured', true)
    .eq('status', 'upcoming')
    .single()
  return data
}
```

**Migration:**
- [ ] Add `featured` boolean column to matches table
- [ ] Mark 2-3 matches as featured
- [ ] Create `getFeaturedMatch()` function
- [ ] Update Matches page to fetch featured match
- [ ] Delete `featuredMatch` from lib/data.ts

---

#### Mock: relatedMatches[]
```typescript
// BEFORE
export const relatedMatches = [ ... ]

// AFTER
export async function getRelatedMatches(
  currentMatchId: string,
  limit: number = 4
): Promise<Match[]> {
  const { data: current } = await supabase
    .from('matches')
    .select('tournament_id, team1_id, team2_id')
    .eq('id', currentMatchId)
    .single()
  
  const { data } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', current.tournament_id)
    .neq('id', currentMatchId)
    .order('match_time', { ascending: true })
    .limit(limit)
  
  return data
}
```

**Migration:**
- [ ] Create relational query function
- [ ] Ensure matches table has tournament_id FK
- [ ] Update Matches detail page
- [ ] Delete `relatedMatches` from lib/data.ts

---

#### Mock: scheduleMatches[]
```typescript
// BEFORE
export const scheduleMatches = [ ... ]

// AFTER
export async function getScheduleMatches(
  daysAhead: number = 30
): Promise<Match[]> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const futureDate = new Date(tomorrow)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  const { data } = await supabase
    .from('matches')
    .select(`
      *,
      team1:teams!team1_id(*),
      team2:teams!team2_id(*),
      tournament:tournaments(*)
    `)
    .gte('match_time', tomorrow.toISOString())
    .lte('match_time', futureDate.toISOString())
    .order('match_time', { ascending: true })
  
  return data
}
```

**Migration:**
- [ ] Create date-filtered query function
- [ ] Update Schedule page component
- [ ] Delete `scheduleMatches` from lib/data.ts

---

#### Mock: matchTournament, tournaments[]

```typescript
// BEFORE
export const matchTournament = { ... }
export const tournaments = [ ... ]

// AFTER
export async function getTournaments(): Promise<Tournament[]> {
  const { data } = await supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: false })
  
  return data
}

export async function getTournamentMatches(
  tournamentId: string
): Promise<Match[]> {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('match_time', { ascending: true })
  
  return data
}
```

**Migration:**
- [ ] Create `tournaments` table
- [ ] Seed 5-10 tournaments (PGL Major, ESL Pro League, etc.)
- [ ] Update matches to reference tournament_id
- [ ] Create API functions
- [ ] Update Tournament view component
- [ ] Delete `tournaments` from lib/data.ts

---

### Section B: Community-Related Mock Data

#### Mock: communityComments[]
```typescript
// BEFORE
export const communityComments = [ ... ]

// AFTER
export async function getMatchComments(
  matchId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(id, username, avatar)
    `)
    .eq('parent_type', 'match')
    .eq('match_id', matchId)
    .is('parent_post_id', null) // Only root comments
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)
  
  return data
}

export async function getCommentReplies(
  commentId: string
): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(id, username, avatar)
    `)
    .eq('parent_post_id', commentId)
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true })
  
  return data
}
```

**Migration:**
- [ ] Rename `comments` table to `posts`
- [ ] Add columns: parent_type, discussion_id, parent_post_id
- [ ] Create query functions for match and discussion comments
- [ ] Update MatchDiscussionFeed component
- [ ] Delete `communityComments` from lib/data.ts

---

#### Mock: communityPredictions[]
```typescript
// BEFORE
export const communityPredictions = [ ... ]

// AFTER
export async function getCommunityPredictions(
  matchId: string,
  limit: number = 10
): Promise<Prediction[]> {
  const { data } = await supabase
    .from('predictions')
    .select(`
      *,
      user:users(id, username, avatar, accuracy_percentage),
      predictedTeam:teams!predicted_team(id, name, logo)
    `)
    .eq('match_id', matchId)
    .eq('result', 'pending')
    .order('confidence', { ascending: false })
    .limit(limit)
  
  return data
}

export async function getPredictionConsensus(
  matchId: string
): Promise<{
  total: number,
  team1_votes: number,
  team2_votes: number,
  team1_percentage: number,
  team2_percentage: number,
  average_confidence: number
}> {
  // Get match teams
  const { data: match } = await supabase
    .from('matches')
    .select('team1_id, team2_id')
    .eq('id', matchId)
    .single()
  
  // Aggregate predictions
  const { data } = await supabase
    .from('predictions')
    .select('predicted_team, confidence')
    .eq('match_id', matchId)
  
  const total = data.length
  const team1_votes = data.filter(p => p.predicted_team === match.team1_id).length
  const team2_votes = total - team1_votes
  const avg_confidence = data.reduce((sum, p) => sum + p.confidence, 0) / total
  
  return {
    total,
    team1_votes,
    team2_votes,
    team1_percentage: (team1_votes / total) * 100,
    team2_percentage: (team2_votes / total) * 100,
    average_confidence: avg_confidence
  }
}
```

**Migration:**
- [ ] Ensure `predictions` table is properly structured
- [ ] Create `getCommunityPredictions()` function
- [ ] Create `getPredictionConsensus()` function
- [ ] Update CommunityPredictionsWidget component
- [ ] Delete `communityPredictions` from lib/data.ts

---

#### Mock: communityDiscussions[]
```typescript
// BEFORE
export const communityDiscussions = [ ... ]

// AFTER
export async function getCommunityDiscussions(
  category?: string,
  limit: number = 20,
  offset: number = 0
): Promise<CommunityDiscussion[]> {
  let query = supabase
    .from('community_discussions')
    .select(`
      *,
      author:users(id, username, avatar)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)
  
  if (category) {
    query = query.eq('category', category)
  }
  
  const { data } = await query
  return data
}

export async function getTrendingDiscussions(
  limit: number = 10
): Promise<CommunityDiscussion[]> {
  const { data } = await supabase
    .from('community_discussions')
    .select('*')
    .eq('featured', true)
    .order('upvote_count', { ascending: false })
    .limit(limit)
  
  return data
}
```

**Migration:**
- [ ] Create `community_discussions` table
- [ ] Add `featured`, `pinned` columns
- [ ] Seed 20-30 discussions
- [ ] Create query functions
- [ ] Update CommunityPage component
- [ ] Delete `communityDiscussions` from lib/data.ts

---

#### Mock: communityStats
```typescript
// BEFORE
export const communityStats = {
  members: 48750,
  activeNow: 1243,
  posts: 348,
  comments: 2891
}

// AFTER
export async function getCommunityStats(): Promise<{
  members: number,
  activeNow: number,
  posts: number,
  comments: number
}> {
  const thirtyMinsAgo = new Date()
  thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30)
  
  const [
    { count: members },
    { count: activeNow },
    { count: posts },
    { count: comments }
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users')
      .select('id', { count: 'exact', head: true })
      .gte('last_activity', thirtyMinsAgo.toISOString()),
    supabase.from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('parent_type', 'discussion'),
    supabase.from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('parent_type', 'match')
  ])
  
  return {
    members: members || 0,
    activeNow: activeNow || 0,
    posts: posts || 0,
    comments: comments || 0
  }
}
```

**Migration:**
- [ ] Create computed query function (no table needed)
- [ ] Add `last_activity` column to users table
- [ ] Update on user login or activity
- [ ] Update CommunityStatsWidget component
- [ ] Delete `communityStats` from lib/data.ts

---

### Section C: Rankings & Leaderboard Mock Data

#### Mock: rankings[], rankingTeams[]
```typescript
// BEFORE
export const rankings = [ ... ]
export const rankingTeams = [ ... ]

// AFTER
export async function getTeamRankings(
  limit: number = 100
): Promise<Team[]> {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .order('rating', { ascending: false })
    .limit(limit)
  
  return data
}

export async function getTeamRankingWithHistory(
  teamId: string
): Promise<{
  team: Team,
  ratingHistory: { date: string, rating: number }[]
}> {
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()
  
  // Query snapshots if available, otherwise just return current
  const { data: snapshots } = await supabase
    .from('user_stats_snapshots')
    .select('snapshot_date, rating')
    .eq('team_id', teamId)
    .order('snapshot_date', { ascending: false })
    .limit(30)
  
  return {
    team,
    ratingHistory: snapshots || []
  }
}
```

**Migration:**
- [ ] Create `teams` table with rating, win_rate, recent_form
- [ ] Seed 10+ professional teams
- [ ] Create ranking query function
- [ ] Update RankingPage and RankingCard components
- [ ] Delete `rankings`, `rankingTeams` from lib/data.ts

---

#### Mock: leaderboardUsers[], leaderboardStats
```typescript
// BEFORE
export const leaderboardUsers = [ ... ]
export const leaderboardStats = { ... }

// AFTER
export async function getLeaderboard(
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  const { data: users } = await supabase
    .from('users')
    .select(`
      id, username, avatar,
      intel_score, accuracy_percentage,
      total_predictions, correct_predictions,
      current_streak, best_streak
    `)
    .order('intel_score', { ascending: false })
    .range(offset, offset + limit)
  
  // Calculate rank for each user
  return users.map((user, idx) => ({
    ...user,
    rank: offset + idx + 1
  }))
}

export async function getUserLeaderboardRank(
  userId: string
): Promise<number> {
  const { data: user } = await supabase
    .from('users')
    .select('intel_score')
    .eq('id', userId)
    .single()
  
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gt('intel_score', user.intel_score)
  
  return (count || 0) + 1
}

export async function getLeaderboardStats(): Promise<{
  totalMembers: number,
  totalPredictions: number,
  averageAccuracy: number,
  activeAnalysts: number
}> {
  const { data: userStats } = await supabase
    .from('users')
    .select('total_predictions, accuracy_percentage')
  
  const totalMembers = userStats.length
  const totalPredictions = userStats.reduce((sum, u) => sum + (u.total_predictions || 0), 0)
  const averageAccuracy = userStats.reduce((sum, u) => sum + (u.accuracy_percentage || 0), 0) / totalMembers
  const activeAnalysts = userStats.filter(u => u.total_predictions > 0).length
  
  return {
    totalMembers,
    totalPredictions,
    averageAccuracy,
    activeAnalysts
  }
}
```

**Migration:**
- [ ] Ensure users table has all denormalised stats
- [ ] Create ranking calculation functions
- [ ] Add computed stats (accuracy_percentage, etc.)
- [ ] Create triggers to update stats on prediction evaluation
- [ ] Update LeaderboardPage component
- [ ] Delete `leaderboardUsers`, `leaderboardStats` from lib/data.ts

---

### Section D: Content Mock Data

#### Mock: intelPosts[]
```typescript
// BEFORE
export const intelPosts = [ ... ]

// AFTER
export async function getIntelPosts(
  limit: number = 10,
  offset: number = 0
): Promise<ContentPost[]> {
  const { data } = await supabase
    .from('content_posts')
    .select(`
      *,
      author:users(id, username, avatar),
      match:matches(id, team1_id, team2_id)
    `)
    .eq('type', 'intel')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)
  
  return data
}

export async function getFeaturedIntelPosts(
  limit: number = 3
): Promise<ContentPost[]> {
  const { data } = await supabase
    .from('content_posts')
    .select('*')
    .eq('type', 'intel')
    .eq('featured', true)
    .eq('published', true)
    .limit(limit)
  
  return data
}
```

**Migration:**
- [ ] Create `content_posts` table with type='intel'
- [ ] Seed 15-20 intel posts
- [ ] Create query functions
- [ ] Update IntelFeed and HomePage components
- [ ] Delete `intelPosts` from lib/data.ts

---

#### Mock: blogPosts[]
```typescript
// BEFORE
export const blogPosts = [ ... ]

// AFTER
export async function getBlogPosts(
  limit: number = 10,
  offset: number = 0
): Promise<ContentPost[]> {
  const { data } = await supabase
    .from('content_posts')
    .select(`
      *,
      author:users(id, username, avatar)
    `)
    .eq('type', 'article')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit)
  
  return data
}

export async function getBlogPostBySlug(
  slug: string
): Promise<ContentPost> {
  const { data } = await supabase
    .from('content_posts')
    .select(`
      *,
      author:users(id, username, avatar)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  return data
}
```

**Migration:**
- [ ] Create `content_posts` table with type='article'
- [ ] Add slug column for URL-friendly links
- [ ] Seed 8-12 blog articles
- [ ] Create query functions
- [ ] Update BlogPage and ArticleDetail components
- [ ] Delete `blogPosts` from lib/data.ts

---

### Section E: Activity & Notifications Mock Data

#### Mock: communityActivity[]
```typescript
// BEFORE
export const communityActivity = [ ... ]

// AFTER
export async function getUserActivity(
  userId: string,
  limit: number = 20
): Promise<ActivityFeedItem[]> {
  // UNION query - no table needed
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      id, created_at, confidence,
      user:users(username, avatar),
      match:matches(team1_id, team2_id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, created_at, content,
      author:users(username, avatar)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Merge and sort
  const activities = [
    ...predictions.map(p => ({
      type: 'prediction',
      timestamp: p.created_at,
      description: `${p.user.username} predicted with ${p.confidence}% confidence`,
      icon: '🎯'
    })),
    ...posts.map(p => ({
      type: 'post',
      timestamp: p.created_at,
      description: `${p.author.username} posted: "${p.content.substring(0, 50)}..."`,
      icon: '💬'
    }))
  ]
  
  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

export async function getCommunityActivityFeed(
  limit: number = 20
): Promise<ActivityFeedItem[]> {
  // Latest community predictions, posts, discussions
  // Similar UNION query as above but for all users
}
```

**Migration:**
- [ ] Create UNION query function (no table needed)
- [ ] Update CommunityActivityItem component
- [ ] Delete `communityActivity` from lib/data.ts

---

#### Mock: adminStats[]
```typescript
// BEFORE
export const adminStats = [ ... ]

// AFTER
export async function getAdminStats(): Promise<{
  activeUsers: number,
  newMembers: number,
  totalPredictions: number,
  avgAccuracy: number,
  platformHealth: string
}> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: activeUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('last_login', thirtyDaysAgo.toISOString())
  
  const { count: newMembers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  const { data: users } = await supabase
    .from('users')
    .select('total_predictions, accuracy_percentage')
  
  const totalPredictions = users.reduce((sum, u) => sum + (u.total_predictions || 0), 0)
  const avgAccuracy = users.length > 0
    ? users.reduce((sum, u) => sum + (u.accuracy_percentage || 0), 0) / users.length
    : 0
  
  return {
    activeUsers: activeUsers || 0,
    newMembers: newMembers || 0,
    totalPredictions,
    avgAccuracy,
    platformHealth: 'operational' // Or check actual service status
  }
}
```

**Migration:**
- [ ] Create computed admin stats function
- [ ] Update AdminDashboard component
- [ ] Delete `adminStats` from lib/data.ts

---

## Part 2: File-by-File Migration Checklist

### Homepage (app/page.tsx)

```typescript
// OLD IMPORTS
- import { matches, featuredMatch, intelPosts, communityActivity, rankings } from '@/lib/data'

// NEW IMPORTS
+ import { getMatches, getFeaturedMatch } from '@/lib/api/matches'
+ import { getIntelPosts } from '@/lib/api/content'
+ import { getUserActivity } from '@/lib/api/activity'
+ import { getTeamRankings } from '@/lib/api/teams'

export default async function Home() {
  // OLD
  - const matches_data = matches
  - const featured = featuredMatch
  
  // NEW
  + const matches_data = await getMatches({ limit: 6 })
  + const featured = await getFeaturedMatch()
  + const intel = await getIntelPosts(limit: 4)
  + const activity = await getUserActivity(userId, limit: 4)
  + const rankings = await getTeamRankings(limit: 5)
}
```

**Checklist:**
- [ ] Replace all static imports with API calls
- [ ] Add `async` keyword to component
- [ ] Update component to render with real data
- [ ] Test with actual database
- [ ] Verify no mock data is used

---

### Matches Page (app/matches/page.tsx)

```typescript
// OLD
import { featuredMatch, communityComments, communityPredictions, intelUpdates, relatedMatches } from '@/lib/data'

// NEW
import { getFeaturedMatch, getRelatedMatches } from '@/lib/api/matches'
import { getMatchComments } from '@/lib/api/community'
import { getCommunityPredictions } from '@/lib/api/predictions'
import { getIntelPostsForMatch } from '@/lib/api/content'
```

**Checklist:**
- [ ] Fetch featured match from database
- [ ] Fetch related matches by tournament
- [ ] Fetch comments for match
- [ ] Fetch predictions for match
- [ ] Fetch intel posts linked to match
- [ ] Remove all mock imports

---

### Community Page (app/community/page.tsx)

```typescript
// OLD
import { communityDiscussions, communityStats, trendingMatches, topContributors } from '@/lib/data'

// NEW
import { getCommunityDiscussions, getTrendingDiscussions } from '@/lib/api/community'
import { getCommunityStats } from '@/lib/api/stats'
import { getTrendingMatches } from '@/lib/api/matches'
import { getTopContributors } from '@/lib/api/users'
```

**Checklist:**
- [ ] Fetch discussions by category
- [ ] Fetch community stats (members, posts, etc.)
- [ ] Fetch trending matches
- [ ] Fetch top contributors by posts/accuracy
- [ ] Remove all mock imports

---

### Rankings Page (app/rankings/page.tsx)

```typescript
// OLD
import { rankingTeams, rankingMovers } from '@/lib/data'

// NEW
import { getTeamRankings } from '@/lib/api/teams'
import { getTeamRankingMovers } from '@/lib/api/teams'
```

**Checklist:**
- [ ] Fetch team rankings by rating
- [ ] Compute ranking movers (calculate difference from previous period)
- [ ] Remove mock imports

---

### Leaderboard Page (app/leaderboard/page.tsx)

```typescript
// OLD
import { leaderboardUsers, leaderboardStats } from '@/lib/data'

// NEW
import { getLeaderboard, getLeaderboardStats } from '@/lib/api/leaderboard'
```

**Checklist:**
- [ ] Fetch real leaderboard from users table
- [ ] Fetch real leaderboard statistics
- [ ] Remove mock imports

---

### Profile Page (app/profile/page.tsx)

```typescript
// OLD
import { profileStats, profileActivities, predictionHistory } from '@/lib/data'

// NEW
import { getUserStats, getUserActivity, getUserPredictions } from '@/lib/api/users'
```

**Checklist:**
- [ ] Fetch authenticated user's data
- [ ] Fetch user's predictions
- [ ] Fetch user's activities
- [ ] Show real stats computed from predictions
- [ ] Remove mock imports

---

### Blog Page (app/blog/page.tsx)

```typescript
// OLD
import { blogPosts } from '@/lib/data'

// NEW
import { getBlogPosts } from '@/lib/api/content'
```

**Checklist:**
- [ ] Fetch published blog posts from database
- [ ] Add pagination support
- [ ] Remove mock imports

---

### Schedule Page (app/schedule/page.tsx)

```typescript
// OLD
import { scheduleMatches } from '@/lib/data'

// NEW
import { getScheduleMatches } from '@/lib/api/matches'
```

**Checklist:**
- [ ] Fetch matches ordered by match_time
- [ ] Filter by tournament if needed
- [ ] Remove mock imports

---

### Admin Page (app/admin/page.tsx)

```typescript
// OLD
import { adminStats, adminMatches, adminUsers, adminDiscussions } from '@/lib/data'

// NEW
import { getAdminStats } from '@/lib/api/admin'
import { getMatches, setMatchResult } from '@/lib/api/matches'
import { getUsers } from '@/lib/api/users'
import { getCommunityDiscussions } from '@/lib/api/community'
import { getReports } from '@/lib/api/reports'
```

**Checklist:**
- [ ] Fetch real admin statistics
- [ ] Fetch matches for result setting
- [ ] Fetch users for management
- [ ] Fetch pending reports
- [ ] Fetch discussions for moderation
- [ ] Remove all mock imports

---

## Part 3: Remaining Mock Data to Remove

After all components are updated, **completely delete** from lib/data.ts:

```typescript
// DELETE THESE EXPORTS:
export const matches = [ ... ]
export const featuredMatch = { ... }
export const relatedMatches = [ ... ]
export const matchTournament = { ... }
export const scheduleMatches = [ ... ]
export const tournaments = [ ... ]
export const quickStats = { ... }

export const communityStats = { ... }
export const communityDiscussions = [ ... ]
export const communityComments = [ ... ]
export const communityPredictions = [ ... ]
export const communityPosts = [ ... ]
export const communityActivity = [ ... }
export const communityCategories = [ ... ]
export const communityTags = [ ... ]
export const trendingMatches = [ ... ]
export const topContributors = [ ... ]
export const newestMembers = [ ... ]

export const rankings = [ ... ]
export const rankingTeams = [ ... ]
export const rankingMovers = [ ... ]
export const rankingUpcoming = [ ... ]

export const leaderboardUsers = [ ... ]
export const leaderboardStats = { ... }

export const intelPosts = [ ... ]
export const blogPosts = [ ... ]

export const adminStats = [ ... ]
export const adminMatches = [ ... ]
export const adminUsers = [ ... ]
export const adminDiscussions = [ ... ]
export const adminBlogs = [ ... ]
export const adminIntel = [ ... ]
export const recentAlerts = [ ... ]
export const platformStatus = [ ... ]

// Keep only type definitions and constants
```

**After cleanup:** lib/data.ts should only contain TypeScript types and constants (category lists, etc.)

---

## Part 4: Testing Strategy

### Test Each Component

```typescript
describe('HomePage', () => {
  it('should fetch and display real matches', async () => {
    const page = render(<HomePage />)
    await waitFor(() => {
      expect(page.getByText(/Spirit vs FaZe/)).toBeInTheDocument()
    })
  })

  it('should fetch and display featured match', async () => {
    const page = render(<HomePage />)
    expect(page.getByText(/Featured Match/)).toBeInTheDocument()
  })

  it('should not render mock data', async () => {
    const page = render(<HomePage />)
    expect(page.queryByText(/Mock Match/)).not.toBeInTheDocument()
  })
})
```

### End-to-End Test

```typescript
it('full user journey: predict → evaluate → see on leaderboard', async () => {
  // 1. User logs in
  await login('testuser@example.com')
  
  // 2. User makes a prediction (from real database)
  await navigate('/matches')
  await submitPrediction(matchId, team1_id, 75)
  
  // 3. Admin sets match result (database update)
  await setMatchResult(matchId, 'team1_win')
  
  // 4. Prediction is evaluated (trigger updates user score)
  // 5. User appears on real leaderboard
  await navigate('/leaderboard')
  expect(page.getByText('testuser')).toBeInTheDocument()
})
```

---

## Part 5: Deployment Checklist

- [ ] All database migrations executed (schema created)
- [ ] 50+ test matches seeded
- [ ] 10+ tournaments seeded
- [ ] 100+ test users seeded
- [ ] All API functions tested with real data
- [ ] All components updated to fetch from database
- [ ] No static imports from lib/data.ts for data (only types)
- [ ] All mock data deleted from lib/data.ts
- [ ] RLS policies tested
- [ ] Admin functions tested
- [ ] Leaderboard computation verified
- [ ] Prediction evaluation verified
- [ ] Search/filter queries tested
- [ ] Performance benchmarks passed (queries < 100ms)
- [ ] Error handling tested (missing data, network failures)
- [ ] Production environment tested

---

## Part 6: Success Criteria

✅ **Zero hardcoded mock data** in production UI  
✅ **All homepage sections** pull from real database  
✅ **All community features** powered by real tables  
✅ **Leaderboard computed** from real user predictions  
✅ **Rankings computed** from real team performance  
✅ **Admin dashboard** shows real statistics  
✅ **All searches/filters** query the database  
✅ **User activity** tracked in real time  
✅ **Notifications** sent for real events  
✅ **Reports** filed against real content  

---

**END OF IMPLEMENTATION GUIDE**

All mock data has been mapped to database sources. Follow this guide to complete the elimination.
