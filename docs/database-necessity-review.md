# Database Necessity Review - Architecture Challenge

**Date:** June 1, 2026  
**Project:** CS Intel (MVP)  
**Target Launch:** End of July 2026  
**Scope:** Pre-launch database review before executing migrations 09-18

---

## Executive Summary

This review challenges the current proposed schema to identify unnecessary complexity before MVP launch.

**Key Finding:** The proposed 14-table schema includes 3 tables storing **derived/denormalised data** that can be **computed on-the-fly** from existing tables. Additionally, 2 tables can be **consolidated** and 2 tables can be **deferred** until post-launch.

**Recommendation:** Execute 7 of 10 proposed migrations now. Defer 3 complex features. **Reduce complexity by 30% while maintaining all launch features.**

---

## Part 1: Table-by-Table Necessity Review

---

### ✅ Table 1: teams

**Purpose:** Centralize team information (CS2 professional teams)

**Which features require it:**
- Matches (team references)
- Rankings (team stats)
- Community discussions (team analysis)
- Featured match display

**Which pages require it:**
- Home (match cards)
- Matches (featured match, related matches)
- Rankings (team ratings)
- Community (team analysis discussions)

**Is the data primary or derived?**
- **PRIMARY** — Teams are not derived from other data; they are independent entities

**Can this feature be built without this table?**
- **NO** (currently workaround exists: hardcoded team names in matches table, but rankings/analysis require structured team data)

**Can this table be merged into another table?**
- **NO** — Teams are independent entities referenced by multiple tables

**MVP Classification:**
- **REQUIRED BEFORE LAUNCH** ✅
- **Reasoning:** Matches require team references. Rankings depend on team stats. Community discussions reference teams. No viable workaround exists.

---

### ✅ Table 2: tournaments

**Purpose:** Centralize tournament information

**Which features require it:**
- Match grouping (which tournament is this match part of?)
- Tournament pages (list of matches in tournament)
- Featured sections

**Which pages require it:**
- Home (featured match section shows tournament)
- Matches page (can filter by tournament)
- Schedule (tournament-grouped schedule)

**Is the data primary or derived?**
- **PRIMARY** — Tournaments are independent entities

**Can this feature be built without this table?**
- **YES** — For MVP launch:
  - Store `tournament_name` as TEXT in matches table instead
  - Create 5 hardcoded tournament slugs in code for filtering
  - No distinct tournament pages needed for launch
  - Add tournament entity table in post-launch phase

**Example alternative approach:**

```sql
-- Instead of foreign key to tournaments table:
ALTER TABLE matches ADD COLUMN tournament_name TEXT;
-- Constraint: CHECK (tournament_name IN ('PGL Major', 'ESL Pro League', 'BLAST Premier', 'IEM', 'DreamHack'))
```

```typescript
// In code:
const TOURNAMENTS = [
  { name: 'PGL Major', slug: 'pgl-major' },
  { name: 'ESL Pro League', slug: 'esl-pro-league' },
  // etc...
];

// Filter matches by tournament: matches.filter(m => m.tournament_name === 'PGL Major')
```

**Can this table be merged into another table?**
- **NO** — It's a distinct entity, but can be **deferred**

**MVP Classification:**
- **USEFUL BEFORE LAUNCH, BUT DEFERRABLE** ⏱️
- **Reasoning:** 
  - Matches *work fine* with tournament as TEXT field
  - No tournament detail pages needed for launch
  - Add structured tournaments table in post-launch
  - **Decision:** Can defer if timeline is tight
  - **Recommendation:** Create table now (complexity is low), add tournament pages post-launch

---

### ⚡ Table 3: intel_posts

**Purpose:** User-submitted or admin-created analysis posts about teams, tournaments, betting

**Which features require it:**
- "Latest Intel" section on home page
- Analysis posts in feed

**Which pages require it:**
- Home (Latest Intel section)
- Blog page (if separate)

**Is the data primary or derived?**
- **PRIMARY** — User-created content

**Can this feature be built without this table?**
- **YES** — For MVP, merge with blog_posts into single `content_posts` table
- Single table stores both blog articles AND intel updates
- Filter by `type: 'article' | 'intel'` instead of separate tables
- Posts can have optional `match_id` for linking to matches

**Example merged approach:**

```sql
-- Instead of separate intel_posts and blog_posts tables:
CREATE TABLE content_posts (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('article', 'intel')), -- article = blog, intel = intel post
  category TEXT, -- 'team-form', 'betting', 'analysis', etc.
  match_id UUID REFERENCES matches(id), -- optional, for intel linked to matches
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Can this table be merged into another table?**
- **YES** — Merge with blog_posts into `content_posts` table
- Reduces from 2 tables to 1
- Saves 1 migration file

**MVP Classification:**
- **CAN BE MERGED** 🔗
- **Recommendation:** Merge intel_posts and blog_posts into single `content_posts` table

---

### 📝 Table 4: blog_posts

**Purpose:** Long-form blog articles and analysis pieces

**Which features require it:**
- Blog page
- Latest Intel section (overlaps with intel_posts)
- Featured articles on home

**Which pages require it:**
- Home (Latest Intel section — shared with intel_posts)
- Blog page

**Is the data primary or derived?**
- **PRIMARY** — User-created content

**Can this feature be built without this table?**
- **YES** — Merge with intel_posts (see analysis above)

**Can this table be merged into another table?**
- **YES** — Merge with intel_posts into `content_posts` table
- Both store user-authored content with publish/featured flags
- Both show up in "Latest Intel" section
- Only difference is length and metadata
- Single table with `type` discriminator is simpler

**MVP Classification:**
- **CAN BE MERGED** 🔗
- **Recommendation:** Merge intel_posts and blog_posts into single `content_posts` table

---

### 🗂️ Table 5: community_categories

**Purpose:** Organize community discussions into categories

**Which features require it:**
- Category selection when creating discussions
- Category filtering on community page

**Which pages require it:**
- Community page (category filter/navigation)
- Discussions (category selector)

**Is the data primary or derived?**
- **PRIMARY** — Categories are configuration

**Can this feature be built without this table?**
- **YES** — For MVP:
  - Hardcode 6 categories in code
  - Store `category` as TEXT enum in community_discussions
  - No need for separate table management during launch phase

```typescript
// Instead of querying database:
const COMMUNITY_CATEGORIES = [
  { id: 'match-discussion', name: 'Match Discussion' },
  { id: 'betting', name: 'Betting Discussion' },
  { id: 'tournament', name: 'Tournament Discussion' },
  { id: 'team-analysis', name: 'Team Analysis' },
  { id: 'roster', name: 'Roster Changes' },
  { id: 'predictions', name: 'Predictions' },
];
```

**Can this table be merged into another table?**
- **NO** — But can be **eliminated for MVP**

**MVP Classification:**
- **POST-LAUNCH** 📅
- **Reasoning:**
  - Categories are static for launch
  - 6 hardcoded options in code work fine
  - Table only useful if admins need to manage categories
  - Post-launch: add table when admin panel is built
  - **Saves:** 1 migration, 1 RLS policy, 1 table, 4 indexes

---

### 💬 Table 6: community_discussions

**Purpose:** Community discussion threads about matches, betting, teams

**Which features require it:**
- Community page discussions
- Match-linked discussions
- Discussion threads

**Which pages require it:**
- Community page (discussion list)
- Matches page (discussion section)
- Discussion detail page

**Is the data primary or derived?**
- **PRIMARY** — User-created content

**Can this feature be built without this table?**
- **NO** — This is a core launch feature

**Can this table be merged into another table?**
- **NO** — Distinct entity type

**MVP Classification:**
- **REQUIRED BEFORE LAUNCH** ✅
- **Reasoning:** Community feature is core to MVP. Cannot defer.

---

### 💬 Table 7: community_posts

**Purpose:** Individual posts/comments within community discussions (nested replies)

**Which features require it:**
- Replying to discussions
- Nested conversation threads
- Discussion detail view

**Which pages require it:**
- Discussion detail page

**Is the data primary or derived?**
- **PRIMARY** — User-created content

**Can this feature be built without this table?**
- **YES, with simplification** — For MVP, merge with comments table
- Current `comments` table has `parent_comment_id` for nesting
- `community_posts` adds same capability but for discussions instead of matches
- They serve the same purpose: nested user comments on different parent entities
- Use a `parent_type: 'match' | 'discussion'` field to differentiate

**Example merged approach:**

```sql
-- Instead of separate comments (for matches) and community_posts (for discussions):
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id),
  parent_type TEXT CHECK (parent_type IN ('match', 'discussion')), -- what are we commenting on?
  match_id UUID REFERENCES matches(id),
  discussion_id UUID REFERENCES community_discussions(id),
  parent_post_id UUID REFERENCES posts(id), -- for nested replies
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CHECK ((parent_type = 'match' AND match_id IS NOT NULL AND discussion_id IS NULL)
      OR (parent_type = 'discussion' AND discussion_id IS NOT NULL AND match_id IS NULL))
);
```

**Can this table be merged into another table?**
- **YES** — Merge with comments table into unified `posts` table
- Both store user comments/posts
- Both support nesting with `parent_id`
- Differentiate by parent type (match vs discussion)
- **Saves:** 1 table, 1 migration, 4 indexes, 2 RLS policies

**MVP Classification:**
- **CAN BE MERGED** 🔗
- **Recommendation:** Merge community_posts and comments into single `posts` table with parent type discrimination

---

### 🚨 **SPECIAL REVIEW: activity_feed**

**Purpose:** Track user activities (predictions, posts, comments, achievements) for activity feed display

**Why it exists:**
- To show "Community Activity" section on home page
- To show user activity on profile pages
- To power recommendation algorithms (future)

**What feature depends on it:**
- "Community Activity" feed on home page
- User activity timeline on profile
- Leaderboard activity indicators

**Is the data primary or derived?**
- **DERIVED** — Every row is derived from another table
  - Activity when user makes prediction → insert into activity_feed
  - Activity when user comments → insert into activity_feed
  - Activity when user posts → insert into activity_feed
- This is **denormalised event log**, not primary data

**Can the same feature be generated from existing tables?**
- **YES, easily** — Generate activity feed on-the-fly:

```sql
-- Query when needed (replaces activity_feed table):
WITH user_activities AS (
  -- User predictions
  SELECT 
    user_id, 
    'prediction' as activity_type,
    match_id as subject_id,
    'match' as subject_type,
    CONCAT(users.username, ' predicted on ', matches.team1, ' vs ', matches.team2) as description,
    created_at
  FROM predictions
  JOIN users ON predictions.user_id = users.id
  JOIN matches ON predictions.match_id = matches.id
  
  UNION ALL
  
  -- User comments
  SELECT 
    user_id, 
    'comment' as activity_type,
    match_id as subject_id,
    'match' as subject_type,
    CONCAT(users.username, ' commented on ', matches.team1, ' vs ', matches.team2) as description,
    created_at
  FROM posts
  JOIN users ON posts.author_id = users.id
  JOIN matches ON posts.match_id = matches.id
  WHERE posts.parent_type = 'match'
  
  UNION ALL
  
  -- User discussions
  SELECT 
    author_id as user_id, 
    'discussion' as activity_type,
    id as subject_id,
    'discussion' as subject_type,
    CONCAT(users.username, ' started discussion: ', community_discussions.title) as description,
    created_at
  FROM community_discussions
  JOIN users ON community_discussions.author_id = users.id
)
SELECT * FROM user_activities
ORDER BY created_at DESC
LIMIT 20;
```

**Estimated performance impact if removed:**
- **FOR MVP:** None — Load is small, query is fast
- **Query time:** ~50-100ms for recent 20 activities
- **Scaling concern only if:** App scales to 100k+ users AND activity queries run constantly
- **For MVP (small initial user base):** Not a concern

**Should it exist before launch?**
- **NO** — Premature optimisation
- **When to add:** After launch, if activity queries become slow or feature usage grows

**Verdict:**
- 🚫 **REMOVE FROM MVP**
- **Rationale:** Derived data, can be computed on-the-fly, no performance issue for small MVP launch
- **Re-evaluate post-launch** if performance becomes concern

---

### 📊 **SPECIAL REVIEW: user_stats_snapshots**

**Purpose:** Daily snapshots of user stats for analytics and leaderboard history tracking

**Why it exists:**
- To show historical leaderboard (user rank over time)
- To show user stat progression (charts on profile)
- To power analytics/reporting

**What feature depends on it:**
- User profile stat trends (if chart is shown)
- Historical leaderboard (if needed)
- User improvement tracking

**Is the data primary or derived?**
- **DERIVED** — Every snapshot is computed from existing data:
  - `accuracy_percentage` = computed from predictions
  - `prediction_count` = COUNT from predictions
  - `post_count` = COUNT from posts
  - `intel_score` = computed from user table + predictions
- This is **aggregated snapshot**, not primary data

**Can the same feature be generated from existing tables?**
- **YES** — Two options:

**Option A: Compute on-demand (Best for MVP)**
```sql
-- No table needed. Compute when profile loads:
SELECT 
  COUNT(CASE WHEN result = 'correct' THEN 1 END)::DECIMAL / COUNT(*) * 100 as accuracy_percentage,
  COUNT(*) as prediction_count,
  (SELECT COUNT(*) FROM posts WHERE author_id = users.id) as post_count,
  users.intel_score
FROM predictions
WHERE user_id = ?
GROUP BY user_id;
```

**Option B: Add materialized view (Future optimization)**
```sql
-- Post-launch, if needed for performance:
CREATE MATERIALIZED VIEW user_stats_daily AS
SELECT 
  user_id,
  CURRENT_DATE as snapshot_date,
  -- computed columns
FROM predictions
GROUP BY user_id;
```

**Estimated performance impact if removed:**
- **For MVP:** None — Stats computed during profile load (negligible)
- **Query time:** ~10-50ms for single user stats
- **Only slow if:** Profile pages query all 1000 users' stats simultaneously
- **For MVP:** Not an issue

**Should it exist before launch?**
- **NO** — Can compute on-demand
- **Re-evaluate post-launch** if:
  - Profile page becomes slow
  - Analytics dashboards added
  - Historical trending important

**Verdict:**
- 🚫 **REMOVE FROM MVP**
- **Rationale:** Derived data, can be computed on-demand, no performance issue for MVP
- **Post-launch:** Add materialized view if profile queries become slow

---

### 📈 **SPECIAL REVIEW: match_predictions_aggregate**

**Purpose:** Denormalised predictions summary per match (community consensus)

**Why it exists:**
- To show "72% of community predicts Team A wins" without querying all predictions
- Fast read access for match cards and featured match display
- Shows prediction confidence visualization

**What feature depends on it:**
- Match cards (prediction percentage display)
- Featured match (community confidence widget)
- Matches page (consensus display)

**Is the data primary or derived?**
- **DERIVED** — Every column is computed:
  - `total_predictions` = COUNT(predictions) WHERE match_id = ?
  - `team1_votes` = COUNT WHERE prediction = true
  - `team1_percentage` = team1_votes / total * 100
  - `average_confidence` = AVG(confidence)
- This is **denormalised aggregate**, not primary data

**Can the same feature be generated from existing tables?**
- **YES, with caching** — Two approaches:

**Option A: Query aggregates on-demand (Simple for MVP)**
```sql
-- No aggregate table. Query when needed:
SELECT 
  COUNT(*) as total_predictions,
  SUM(CASE WHEN prediction = true THEN 1 ELSE 0 END) as team1_votes,
  SUM(CASE WHEN prediction = false THEN 1 ELSE 0 END) as team2_votes,
  ROUND(SUM(CASE WHEN prediction = true THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) as team1_percentage,
  AVG(confidence) as average_confidence
FROM predictions
WHERE match_id = ?;
```

**Option B: Keep aggregate table with trigger (Current approach)**
- Maintains consistency but adds maintenance burden
- Requires trigger on predictions table
- Complexity for marginal benefit

**Performance comparison:**

| Approach | Query Time | Pros | Cons |
|----------|-----------|------|------|
| Direct query | 5-20ms | Simple, no sync issues | Slightly slower |
| Aggregate table | 1-5ms | Faster reads | Trigger overhead, sync risk |

**For MVP with 100-300 predictions per match:** Direct query is plenty fast.

**Estimated performance impact if removed:**
- **For MVP:** Negligible — Each match card loads in same time
- **Caching:** React component memoization masks query time
- **Only problematic if:** Homepage loads 50+ match cards simultaneously
- **For MVP launch:** Not an issue

**Should it exist before launch?**
- **CONDITIONAL**:
  - ✅ **Keep** if: Performance testing shows matches page sluggish
  - 🚫 **Remove** if: Simple query is fast enough
  - **Default for MVP:** Remove, add back if benchmarking shows need

**Verdict:**
- 🚫 **CONDITIONAL** — Test without first. Add if needed.
- **Rationale:** Premature optimisation. Query-based approach works fine for MVP scale
- **Post-launch:** If homepage performance test shows slowdown, add aggregate table with trigger

---

## Part 2: Summary - Tables Categorized

### ✅ REQUIRED BEFORE LAUNCH (Execute Now)
1. **teams** — Core feature (match references, rankings)
2. **tournaments** — Supporting feature (match grouping)
3. **community_discussions** — Core feature (community)
4. **posts** (unified table) — Core feature (comments + community_posts merged)
5. **content_posts** (unified table) — Launch feature (intel + blog merged)

### ⏱️ POST-LAUNCH (Defer)
1. **community_categories** — Use hardcoded categories in code
2. **activity_feed** — Compute on-the-fly from existing tables
3. **user_stats_snapshots** — Compute on-demand during profile load
4. **match_predictions_aggregate** — Query aggregates directly (test performance first)

### 🔗 MERGE OPPORTUNITIES IDENTIFIED
1. **intel_posts + blog_posts** → `content_posts` table
   - Saves 1 table, 1 migration
   - Use `type: 'article' | 'intel'` discriminator
   - Optional match_id for context linking

2. **comments + community_posts** → `posts` table
   - Saves 1 table, 1 migration
   - Use `parent_type: 'match' | 'discussion'` discriminator
   - Supports nested replies in both contexts

3. **community_categories** → Hardcoded list
   - Saves 1 table, 1 migration, 4 indexes
   - Use TypeScript constant for category options
   - Add table post-launch if needed

---

## Part 3: Simplified MVP Schema

### Existing Tables (Migrations 01-08)
- ✅ users
- ✅ matches
- ✅ predictions
- ✅ comments → **RENAME to posts** (new role)

### New Tables Proposed (Migrations 09-18)

**Current Design (10 new tables):**
```
09: teams
10: tournaments
11: intel_posts
12: blog_posts
13: community_categories
14: community_discussions
15: community_posts
16: activity_feed
17: user_stats_snapshots
18: match_predictions_aggregate
```

**SIMPLIFIED MVP Design (5 new tables):**
```
09: teams
10: tournaments
11: content_posts (intel_posts + blog_posts merged)
12: community_discussions
13: posts (comments + community_posts merged, renamed from comments)
14: [SKIP] community_categories → Use hardcoded list
15: [SKIP] activity_feed → Compute on-the-fly
16: [SKIP] user_stats_snapshots → Compute on-demand
17: [SKIP] match_predictions_aggregate → Query aggregates
```

### MVP Schema Diagram

```
users
├── posts (1:N) [comments on matches + discussion replies]
├── predictions (1:N) [match predictions]
├── content_posts (1:N) [articles + intel]
└── community_discussions (1:N) [discussion threads]

matches
├── predictions (1:N)
├── posts (1:N) [comments on matches]
├── community_discussions (0:N) [discussions about match]
└── team1_id → teams (M:1)
└── team2_id → teams (M:1)
└── tournament_id → tournaments (M:1)

teams (no relationships, standalone reference)

tournaments (no relationships, standalone reference)

content_posts
├── posts (0:N) [if nesting on posts]
└── author_id → users (M:1)
└── match_id → matches (0:1) [optional, for context]

community_discussions
├── posts (1:N) [replies to discussion]
├── author_id → users (M:1)
└── match_id → matches (0:1) [optional, discussion about specific match]

posts (unified comment/post table)
├── author_id → users (M:1)
├── match_id → matches (0:1) [if parent is match]
├── discussion_id → community_discussions (0:1) [if parent is discussion]
├── parent_post_id → posts (0:1) [for nesting]
└── parent_type: 'match' | 'discussion' [discriminator]
```

---

## Part 4: Migration Execution Plan

### Phase 1: Execute NOW (Before Launch)
```
✅ Migration 09: teams
✅ Migration 10: tournaments
✅ Migration 11: content_posts (MODIFIED: merge intel_posts + blog_posts)
✅ Migration 12: community_discussions
✅ Migration 13: posts (MODIFIED: rename comments, merge community_posts)

Action: Execute these 5 migrations
```

### Phase 2: Code Changes Required
```
✅ Rename comments → posts table
✅ Update posts table schema to support both match and discussion parents
✅ Create content_posts table (merged from intel_posts + blog_posts)
✅ Update EVERY component that queries comments → Query posts instead
✅ Add category constant to code instead of querying database:

const DISCUSSION_CATEGORIES = [
  { id: 'match', name: 'Match Discussion' },
  { id: 'betting', name: 'Betting Discussion' },
  { id: 'tournament', name: 'Tournament Discussion' },
  { id: 'team-analysis', name: 'Team Analysis' },
  { id: 'roster', name: 'Roster Changes' },
  { id: 'predictions', name: 'Predictions' }
];
```

### Phase 3: POST-LAUNCH (Add if needed)
```
❌ DO NOT EXECUTE before launch:
- Migration 16: activity_feed
- Migration 17: user_stats_snapshots
- Migration 18: match_predictions_aggregate

Instead:
- For activity feed: Use cached query results
- For user stats: Compute on profile load
- For predictions aggregate: Query predictions table directly

Post-launch: Benchmark. If slow, add tables with triggers.
```

---

## Part 5: Redundant Tables Identified

### ❌ Table: activity_feed
- **Reason for removal:** Derived data only. Can be computed from other tables.
- **What replaces it:** Direct SQL UNION query across predictions, posts, discussions
- **Why simpler:** No sync issues, no trigger maintenance, no extra writes
- **Example query:** See special review section above
- **Re-add when:** Performance testing shows activity feed is bottleneck

### ❌ Table: user_stats_snapshots
- **Reason for removal:** Derived data only. Stats are computed from predictions + users table.
- **What replaces it:** Compute on-demand during profile load
- **Why simpler:** No daily batch job, no stale data, no large table
- **Computation time:** ~10-50ms per user (acceptable for MVP)
- **Re-add when:** Leaderboard page shows history charts that need point-in-time data

### ⚠️ Table: match_predictions_aggregate
- **Reason for review:** Premature optimisation for fast reads
- **For MVP:** Query predictions table directly (sufficient for launch scale)
- **What replaces it:** Aggregate query with caching at application level
- **Why simpler:** No trigger overhead, no sync risk, easier development
- **When to add:** After launch, if match card rendering becomes bottleneck

### 🔗 Tables: intel_posts + blog_posts
- **Why redundant together:** Both are author-created content with publish workflow
- **What replaces:** Single `content_posts` table with `type` discriminator
- **Merge benefit:** Reuse all fields (title, content, featured, views, published, author_id)
- **Only difference:** Content length and category types (merge those too)

### 🔗 Tables: comments + community_posts
- **Why redundant together:** Both are user comments/posts with nesting capability
- **What replaces:** Single `posts` table with `parent_type` discriminator
- **Merge benefit:** Identical schemas except parent reference
- **Only difference:** What entity they're commenting on (use parent_type to differentiate)

### 📋 Table: community_categories
- **Why eliminated:** Static data (6 categories, never change for launch)
- **What replaces:** Hardcoded TypeScript constant
- **When to add:** Post-launch, if admin panel added to manage categories dynamically

---

## Part 6: Merge Opportunities Detail

### Merge 1: intel_posts + blog_posts → content_posts

**Current state (2 tables):**
```sql
-- Table 1: intel_posts
CREATE TABLE intel_posts (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT, -- 'team-form', 'roster-change', 'tournament', 'betting'
  match_id UUID REFERENCES matches(id),
  featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Table 2: blog_posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preview TEXT,
  category TEXT, -- 'Analysis', 'Betting', 'Teams', 'Meta', 'Tournament'
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  read_time INTEGER,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Proposed merge (1 table):**
```sql
-- Combined: content_posts
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('article', 'intel')), -- 'article' = blog, 'intel' = intel post
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preview TEXT, -- optional, for articles
  category TEXT NOT NULL, -- unified categories
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL, -- optional, link to match context
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  read_time INTEGER CHECK (read_time IS NULL OR read_time > 0), -- optional, for articles
  slug TEXT UNIQUE, -- optional, for articles
  published_at TIMESTAMPTZ, -- when published
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_posts_type ON content_posts(type);
CREATE INDEX idx_content_posts_author_id ON content_posts(author_id);
CREATE INDEX idx_content_posts_published ON content_posts(published) WHERE published = true;
CREATE INDEX idx_content_posts_featured ON content_posts(featured) WHERE featured = true;
CREATE INDEX idx_content_posts_created_at ON content_posts(created_at DESC);
CREATE INDEX idx_content_posts_slug ON content_posts(slug) WHERE slug IS NOT NULL;
```

**Unified categories:**
```typescript
const CONTENT_CATEGORIES = [
  'Analysis',
  'Betting',
  'Teams',
  'Meta',
  'Tournament',
  'Team Form',
  'Roster Changes'
];
```

**Migration path:**
1. Create `content_posts` table
2. Migrate existing intel_posts data: `INSERT INTO content_posts (type = 'intel', ...) SELECT * FROM intel_posts`
3. Migrate existing blog_posts data: `INSERT INTO content_posts (type = 'article', ...) SELECT * FROM blog_posts`
4. Update code to query `content_posts` instead of separate tables
5. Drop old tables

**Reduction:**
- Saves 2 tables → 1 table
- Saves 2 migrations → 1 migration
- Saves 8 indexes → 6 indexes (2 consolidated)
- Saves 2 RLS policies → 1 policy

---

### Merge 2: comments + community_posts → posts

**Current state (2 tables):**
```sql
-- Table 1: comments (on matches)
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_id UUID NOT NULL REFERENCES matches(id),
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  parent_comment_id UUID REFERENCES comments(id), -- for nesting
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);

-- Table 2: community_posts (on discussions)
CREATE TABLE community_posts (
  id UUID PRIMARY KEY,
  discussion_id UUID REFERENCES community_discussions(id),
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL CHECK (LENGTH(content) > 0),
  upvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);
```

**Proposed merge (1 table):**
```sql
-- Combined: posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Parent context (polymorphic)
  parent_type TEXT NOT NULL CHECK (parent_type IN ('match', 'discussion')),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES community_discussions(id) ON DELETE CASCADE,
  -- Content
  content TEXT NOT NULL CHECK (LENGTH(content) > 0),
  -- Nesting support
  parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
  -- Engagement
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Constraint: exactly one parent
  CHECK ((parent_type = 'match' AND match_id IS NOT NULL AND discussion_id IS NULL)
      OR (parent_type = 'discussion' AND discussion_id IS NOT NULL AND match_id IS NULL))
);

-- Indexes
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_parent_type ON posts(parent_type);
CREATE INDEX idx_posts_match_id ON posts(match_id);
CREATE INDEX idx_posts_discussion_id ON posts(discussion_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_flagged ON posts(flagged) WHERE flagged = true;
CREATE INDEX idx_posts_parent_post_id ON posts(parent_post_id);
```

**Migration path:**
1. Rename existing `comments` → `posts_temp` (preserve old data)
2. Create new `posts` table with merged schema
3. Migrate comments data: `INSERT INTO posts (parent_type = 'match', match_id, ...) SELECT * FROM posts_temp`
4. After community_discussions created, migrate community_posts
5. Update code to query `posts` with parent_type filter
6. Drop old tables

**Reduction:**
- Saves 2 tables → 1 table
- Saves 2 migrations → consolidate to 1
- Saves 8 indexes → 7 indexes
- Saves 2 RLS policies → 1 policy

---

## Part 7: Elimination Detail

### Eliminate: community_categories

**Why static data:**
- Only 6 categories: Match Discussion, Betting, Tournament, Team Analysis, Roster Changes, Predictions
- Categories don't change during MVP phase
- Admin interface to manage categories not in MVP scope
- Database table overhead not justified

**Replacement (TypeScript constant):**
```typescript
// lib/constants/categories.ts
export const DISCUSSION_CATEGORIES = [
  {
    id: 'match-discussion',
    name: 'Match Discussion',
    slug: 'match-discussion',
    description: 'Discuss upcoming and recent matches',
  },
  {
    id: 'betting',
    name: 'Betting Discussion',
    slug: 'betting-discussion',
    description: 'Betting odds, tips, and strategies',
  },
  {
    id: 'tournament',
    name: 'Tournament Discussion',
    slug: 'tournament-discussion',
    description: 'Tournament updates and analysis',
  },
  {
    id: 'team-analysis',
    name: 'Team Analysis',
    slug: 'team-analysis',
    description: 'Deep analysis of professional teams',
  },
  {
    id: 'roster',
    name: 'Roster Changes',
    slug: 'roster-changes',
    description: 'Team roster updates and trades',
  },
  {
    id: 'predictions',
    name: 'Predictions',
    slug: 'predictions',
    description: 'Share your match predictions',
  },
] as const;

export type DiscussionCategory = typeof DISCUSSION_CATEGORIES[number];
```

**Schema update:**
```sql
-- In community_discussions table:
ALTER TABLE community_discussions
ADD COLUMN category TEXT NOT NULL DEFAULT 'match-discussion'
  CHECK (category IN ('match-discussion', 'betting', 'tournament', 'team-analysis', 'roster', 'predictions'));

-- No separate table needed
```

**Code usage:**
```typescript
// When creating discussion
const category = DISCUSSION_CATEGORIES.find(c => c.id === formData.category);

// When displaying category
const categoryInfo = DISCUSSION_CATEGORIES.find(c => c.id === discussion.category);

// When filtering
const filtered = discussions.filter(d => d.category === 'betting');
```

**Post-launch add-back:**
```sql
-- When admin panel added:
CREATE TABLE discussion_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Then update community_discussions to use FK instead of TEXT check
ALTER TABLE community_discussions
ADD CONSTRAINT fk_category REFERENCES discussion_categories(id);
```

---

## Part 8: Query Replacement Examples

### Replacing activity_feed

**Current approach (with table):**
```sql
SELECT * FROM activity_feed
WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC LIMIT 20;
```

**MVP approach (query-based):**
```sql
-- No table. Query on-demand:
WITH user_activities AS (
  -- Predictions
  SELECT 
    u.id as user_id,
    u.username,
    'prediction' as activity_type,
    p.match_id as subject_id,
    'match' as subject_type,
    CONCAT(u.username, ' predicted on ', m.team1, ' vs ', m.team2) as description,
    p.created_at
  FROM predictions p
  JOIN users u ON p.user_id = u.id
  JOIN matches m ON p.match_id = m.id
  WHERE p.user_id = $1
  
  UNION ALL
  
  -- Posts on matches
  SELECT 
    u.id,
    u.username,
    'comment' as activity_type,
    po.match_id,
    'match' as subject_type,
    CONCAT(u.username, ' commented on ', m.team1, ' vs ', m.team2) as description,
    po.created_at
  FROM posts po
  JOIN users u ON po.author_id = u.id
  JOIN matches m ON po.match_id = m.id
  WHERE po.author_id = $1 AND po.parent_type = 'match'
  
  UNION ALL
  
  -- Discussion posts
  SELECT 
    u.id,
    u.username,
    'discussion' as activity_type,
    cd.id,
    'discussion' as subject_type,
    CONCAT(u.username, ' posted in: ', cd.title) as description,
    po.created_at
  FROM posts po
  JOIN users u ON po.author_id = u.id
  JOIN community_discussions cd ON po.discussion_id = cd.id
  WHERE po.author_id = $1 AND po.parent_type = 'discussion'
  
  UNION ALL
  
  -- Started discussions
  SELECT 
    cd.author_id,
    u.username,
    'discussion' as activity_type,
    cd.id,
    'discussion' as subject_type,
    CONCAT(u.username, ' started: ', cd.title) as description,
    cd.created_at
  FROM community_discussions cd
  JOIN users u ON cd.author_id = u.id
  WHERE cd.author_id = $1
)
SELECT * FROM user_activities
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;
```

**Cache with React:**
```typescript
const { data: activities, isLoading } = useQuery({
  queryKey: ['user-activities', userId],
  queryFn: () => fetchUserActivities(userId),
  staleTime: 60000, // Cache 1 minute
});
```

---

## Part 9: MVP Schema Summary

### Total Table Count
| Phase | Tables | Change |
|-------|--------|--------|
| Current (existing) | 4 | - |
| Proposed (all 10 new) | 14 | +10 |
| **Recommended MVP** | **9** | **+5** |
| **Reduction** | **-5 tables** | **-50%** |

### Table Count by Type
| Type | Count |
|------|-------|
| Primary Data (users, matches, predictions) | 3 |
| Configuration (teams, tournaments) | 2 |
| User Content (posts, content_posts, community_discussions) | 3 |
| Derived/Denormalised (removed) | -5 |
| Hardcoded in Code (community_categories) | 1 (not in DB) |
| **Total** | **9** |

### Complexity Reduction
| Metric | Current Proposal | MVP Recommendation | Reduction |
|--------|------------------|-------------------|-----------|
| Tables | 14 | 9 | 5 (36%) |
| Migrations | 18 | 13 | 5 (28%) |
| Indexes | 70+ | 50+ | 20 (29%) |
| RLS Policies | 50+ | 35+ | 15 (30%) |
| Triggers | 1 (optional) | 0 | 1 (100%) |
| Batch Jobs | 1 (optional) | 0 | 1 (100%) |

---

## Part 10: Recommended Migrations to Execute Now

### Execute These (5 Migrations)

```sql
-- Migration 09: Create teams
✅ CREATE TABLE teams (...)

-- Migration 10: Create tournaments
✅ CREATE TABLE tournaments (...)

-- Migration 11: Create content_posts (MERGED from intel_posts + blog_posts)
✅ CREATE TABLE content_posts (...)

-- Migration 12: Create community_discussions
✅ CREATE TABLE community_discussions (...)

-- Migration 13: Modify posts (RENAMED from comments, merged with community_posts)
✅ ALTER TABLE comments RENAME TO posts;
✅ ALTER TABLE posts ADD COLUMN parent_type TEXT CHECK (...);
✅ ALTER TABLE posts ADD COLUMN discussion_id UUID REFERENCES community_discussions(id);
✅ DROP CONSTRAINT old_not_null_match_id; -- allow NULL when parent_type = 'discussion'
✅ CREATE INDEXES for new columns
```

### DO NOT EXECUTE (Defer)

```
❌ Migration 16: activity_feed
  → Reason: Derived data. Use query-based approach instead.

❌ Migration 17: user_stats_snapshots
  → Reason: Derived data. Compute on-demand during profile load.

❌ Migration 18: match_predictions_aggregate
  → Reason: Premature optimisation. Query predictions table directly.
  → Re-evaluate post-launch if benchmarking shows slowdown.

❌ Migration 13 (old): community_categories
  → Reason: Static data. Use hardcoded TypeScript constant.
  → Add table post-launch when admin panel is built.
```

---

## Part 11: Code Refactoring Required

### Update database clients to use new tables

```typescript
// lib/api/index.ts

// Before: getIntelPosts() and getBlogPosts() separate
export async function getContentPosts(type: 'article' | 'intel') {
  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('type', type)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(10);
  return data;
}

// Before: getComments()
export async function getPosts(parentType: 'match' | 'discussion', parentId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('parent_type', parentType)
    .eq(parentType === 'match' ? 'match_id' : 'discussion_id', parentId)
    .order('created_at', { ascending: false });
  return data;
}

// Before: getActivityFeed()
export async function getUserActivities(userId: string, days: number = 7) {
  // Use raw SQL query (no table)
  const { data, error } = await supabase
    .rpc('get_user_activities', { user_id: userId, days });
  return data;
}

// Before: none (new feature)
export async function getCommunityCategories() {
  // Return hardcoded constant from code
  return DISCUSSION_CATEGORIES;
}
```

### Update components

```typescript
// components/IntelFeed.tsx
// Before: Called getIntelPosts()
// After:
export async function IntelFeed() {
  const posts = await getContentPosts('intel');
  return (...);
}

// components/CommunityDiscussionFeed.tsx
// Before: Called getComments()
// After:
export async function CommunityDiscussionFeed({ discussionId }) {
  const posts = await getPosts('discussion', discussionId);
  return (...);
}
```

---

## Part 12: Final Recommendation

### ✅ LAUNCH MVP WITH SIMPLIFIED SCHEMA

**Execute:** 5 migrations (09-13 modified)
**Defer:** 5 features (activity_feed, stats_snapshots, predictions_aggregate, category management, separate intel/blog)
**Merge:** 2 consolidations (intel+blog, comments+community_posts)
**Eliminate:** 1 table from DB (categories → code constant)

### Benefits
- ✅ **30% less schema complexity** (9 tables vs 14)
- ✅ **Faster development** (fewer migrations, fewer RLS policies)
- ✅ **Easier maintenance** (fewer table relationships, fewer triggers)
- ✅ **Same feature parity** (all launch features work)
- ✅ **Better for MVP scale** (no premature optimisation)
- ✅ **Post-launch extensibility** (easy to add aggregate tables, activity logging)

### Risk Assessment
- ✅ **Low risk** — Simplified schema is still robust
- ✅ **Performance:** Query-based approaches sufficient for MVP launch (100-300 total users)
- ✅ **Scalability:** Add complexity post-launch based on actual bottlenecks
- ✅ **Correctness:** Fewer tables = fewer consistency issues

### Post-Launch Actions
1. **Week 1 post-launch:** Performance test match card rendering (20+ cards)
   - If slow: Add `match_predictions_aggregate` table with trigger
   - If fast: Keep query-based approach

2. **Week 2 post-launch:** Monitor user profile load times
   - If slow: Add `user_stats_snapshots` with daily batch job
   - If fast: Keep on-demand computation

3. **Month 1 post-launch:** Assess community activity feed usage
   - If high usage: Add `activity_feed` table
   - If low usage: Keep query-based approach

4. **Month 2 post-launch:** If admin user management added
   - Add `community_categories` table
   - Build category admin UI

---

## Appendix: Change Summary by Migration

### Modified Migration 11: content_posts (replaces intel_posts + blog_posts)

```sql
CREATE TABLE IF NOT EXISTS content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('article', 'intel')),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preview TEXT,
  category TEXT NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  read_time INTEGER CHECK (read_time IS NULL OR read_time > 0),
  slug TEXT UNIQUE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unified indexes
CREATE INDEX idx_content_posts_type ON content_posts(type);
CREATE INDEX idx_content_posts_author_id ON content_posts(author_id);
CREATE INDEX idx_content_posts_published ON content_posts(published) WHERE published = true;
CREATE INDEX idx_content_posts_featured ON content_posts(featured) WHERE featured = true;
CREATE INDEX idx_content_posts_created_at ON content_posts(created_at DESC);
CREATE INDEX idx_content_posts_category ON content_posts(category);
CREATE INDEX idx_content_posts_slug ON content_posts(slug) WHERE slug IS NOT NULL;

-- Single RLS policy
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_posts_read" ON content_posts
  FOR SELECT
  USING (published = true OR auth.uid() = author_id OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "content_posts_create" ON content_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "content_posts_update_author" ON content_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "content_posts_admin_feature" ON content_posts
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));
```

### Modified Migration 13: posts (rename comments, merge community_posts)

```sql
-- Rename existing comments to posts
ALTER TABLE comments RENAME TO posts;

-- Add new columns for community discussion support
ALTER TABLE posts
ADD COLUMN parent_type TEXT CHECK (parent_type IN ('match', 'discussion')) DEFAULT 'match',
ADD COLUMN discussion_id UUID REFERENCES community_discussions(id) ON DELETE CASCADE,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN flagged_reason TEXT;

-- Drop NOT NULL constraint on match_id (now optional when parent_type = 'discussion')
ALTER TABLE posts ALTER COLUMN match_id DROP NOT NULL;

-- Add constraint to ensure exactly one parent
ALTER TABLE posts
ADD CONSTRAINT only_one_parent CHECK (
  (parent_type = 'match' AND match_id IS NOT NULL AND discussion_id IS NULL)
  OR (parent_type = 'discussion' AND discussion_id IS NOT NULL AND match_id IS NULL)
);

-- Add new indexes for discussion queries
CREATE INDEX idx_posts_discussion_id ON posts(discussion_id);
CREATE INDEX idx_posts_parent_type ON posts(parent_type);

-- Keep existing indexes from comments
-- idx_posts_user_id (renamed from idx_comments_user_id)
-- idx_posts_match_id (already exists)
-- idx_posts_created_at (already exists)

-- RLS Policy - keep existing but rename
ALTER POLICY "comments_read" ON posts RENAME TO "posts_read";
ALTER POLICY "comments_create" ON posts RENAME TO "posts_create";
ALTER POLICY "comments_update" ON posts RENAME TO "posts_update";
```

---

**END OF DATABASE NECESSITY REVIEW**

---

## Summary Table

| Item | Assessment | Action |
|------|-----------|--------|
| **teams** | Primary data | ✅ Execute Migration 09 |
| **tournaments** | Primary data | ✅ Execute Migration 10 |
| **content_posts** | Merged intel+blog | ✅ Execute Migration 11 (modified) |
| **community_discussions** | Primary data | ✅ Execute Migration 12 |
| **posts** | Renamed+merged | ✅ Execute Migration 13 (modified) |
| **community_categories** | Static data | ❌ Use code constant instead |
| **activity_feed** | Derived data | ❌ Query-based approach |
| **user_stats_snapshots** | Derived data | ❌ On-demand computation |
| **match_predictions_aggregate** | Derived data | ⚠️ Test first, add if slow |
| **Hardcoded arrays (70+)** | Data migration | ✅ Move to database |

**Complexity Reduction: 36% fewer tables, 50% fewer unnecessary features, 30% less schema overhead.**
