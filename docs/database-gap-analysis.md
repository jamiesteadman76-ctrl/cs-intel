# Database Gap Analysis - Phase 3

**Date:** June 1, 2026  
**Project:** CS Intel

---

## Overview

Current schema has 4 tables. Analysis identifies 10 additional tables needed, with 15+ missing columns in existing tables.

---

## Part 1: Existing Table Schema Gaps

### TABLE: users

**Current State:**
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- username (TEXT, UNIQUE)
- avatar (TEXT)
- intel_score (INTEGER, DEFAULT 0)
- is_admin (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMPTZ, DEFAULT now())
```

**Missing Columns:**

| Column | Type | Purpose | Priority |
|--------|------|---------|----------|
| `bio` | TEXT | User profile description | MEDIUM |
| `country` | CHAR(2) | User country code | LOW |
| `website` | TEXT | User's website link | LOW |
| `verified` | BOOLEAN DEFAULT FALSE | Email verification status | HIGH |
| `last_login` | TIMESTAMPTZ | Track active users | MEDIUM |
| `total_predictions` | INTEGER DEFAULT 0 | Denormalised count | MEDIUM |
| `accuracy_percentage` | DECIMAL(5,2) | Denormalised accuracy | MEDIUM |
| `current_streak` | INTEGER DEFAULT 0 | Prediction streak | LOW |
| `updated_at` | TIMESTAMPTZ DEFAULT now() | Last profile update | HIGH |

**Missing Indexes:**
- `idx_users_created_at` - For sorting new members
- `idx_users_verified` - For filtering verified users
- `idx_users_last_login` - For activity tracking

**Missing Constraints:**
- `CHECK (intel_score >= 0)` - Not enforced
- `CHECK (accuracy_percentage BETWEEN 0 AND 100)` - Missing
- `CHECK (current_streak >= 0)` - Missing

**RLS Gaps:**
- Users can view profiles but no control over who can follow/unfollow
- Admin checks exist but no fine-grained permissions

**Migration:** `08_enhance_users_schema.sql` (execute after reviewing)

---

### TABLE: matches

**Current State:**
```sql
- id (UUID, PK)
- team1 (TEXT, NOT NULL)
- team2 (TEXT, NOT NULL)
- match_time (TIMESTAMPTZ)
- tournament (TEXT)
- status (TEXT, CHECK IN upcoming/live/completed)
- result (TEXT, CHECK IN team1_win/team2_win/draw)
```

**Missing Columns:**

| Column | Type | Purpose | Priority |
|--------|------|---------|----------|
| `team1_id` | UUID REFERENCES teams(id) | Foreign key to teams table | CRITICAL |
| `team2_id` | UUID REFERENCES teams(id) | Foreign key to teams table | CRITICAL |
| `tournament_id` | UUID REFERENCES tournaments(id) | Foreign key to tournaments table | CRITICAL |
| `map_pool` | TEXT[] | Active map pool for match | HIGH |
| `best_of` | INTEGER DEFAULT 3 | BO1/BO3/BO5 | HIGH |
| `veto_data` | JSONB | Map veto information | MEDIUM |
| `head_to_head_team1_wins` | INTEGER DEFAULT 0 | H2H record | MEDIUM |
| `head_to_head_team2_wins` | INTEGER DEFAULT 0 | H2H record | MEDIUM |
| `map_pool_advantage` | TEXT | Advantage summary | LOW |
| `featured` | BOOLEAN DEFAULT FALSE | Homepage featuring | MEDIUM |
| `live_score_team1` | INTEGER DEFAULT 0 | Live score tracking | MEDIUM |
| `live_score_team2` | INTEGER DEFAULT 0 | Live score tracking | MEDIUM |
| `prediction_count` | INTEGER DEFAULT 0 | Denormalised | MEDIUM |
| `comment_count` | INTEGER DEFAULT 0 | Denormalised | MEDIUM |
| `created_at` | TIMESTAMPTZ DEFAULT now() | Creation timestamp | HIGH |
| `updated_at` | TIMESTAMPTZ DEFAULT now() | Last update | HIGH |
| `completed_at` | TIMESTAMPTZ | When result was set | MEDIUM |

**Missing Indexes:**
- `idx_matches_team1_id` - For team queries
- `idx_matches_team2_id` - For team queries
- `idx_matches_tournament_id` - For tournament queries
- `idx_matches_match_time` - For sorting (NEEDS DESC)
- `idx_matches_status` - For filtering (NEEDS DESC on created_at)
- `idx_matches_featured` - For homepage featuring
- `idx_matches_created_at` - For latest matches

**Missing Constraints:**
- `CHECK (best_of IN (1, 3, 5))`
- `CHECK (live_score_team1 >= 0 AND live_score_team2 >= 0)`
- `CHECK (prediction_count >= 0 AND comment_count >= 0)`
- `CHECK (result IS NULL OR status = 'completed')`

**Migration:** `09_enhance_matches_schema.sql`

---

### TABLE: predictions

**Current State:**
```sql
- id (UUID, PK)
- user_id (UUID, NOT NULL)
- match_id (UUID, NOT NULL)
- prediction (BOOLEAN)
- confidence (INTEGER, DEFAULT 70)
- result (TEXT, DEFAULT 'pending')
- is_correct (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMPTZ, DEFAULT now())
```

**Missing Columns:**

| Column | Type | Purpose | Priority |
|--------|------|---------|----------|
| `user_id` | UUID REFERENCES users(id) | Foreign key (missing) | CRITICAL |
| `match_id` | UUID REFERENCES matches(id) | Foreign key (missing) | CRITICAL |
| `score_earned` | INTEGER DEFAULT 0 | Points from this prediction | HIGH |
| `streak_multiplier` | DECIMAL(2,1) DEFAULT 1.0 | Streak bonus applied | MEDIUM |
| `confidence` | INTEGER CHECK (confidence BETWEEN 50 AND 100) | Should be validated | HIGH |
| `updated_at` | TIMESTAMPTZ DEFAULT now() | Edit tracking | MEDIUM |
| `evaluated_at` | TIMESTAMPTZ | When result was computed | MEDIUM |
| `match_result` | TEXT | Cached match result | LOW |

**Missing Indexes:**
- `idx_predictions_user_id` - For user queries
- `idx_predictions_match_id` - For match queries
- `idx_predictions_result` - For pending/correct/incorrect queries
- `UNIQUE (user_id, match_id)` - Already exists, good

**Missing Constraints:**
- `CHECK (confidence BETWEEN 50 AND 100)`
- `CHECK (score_earned >= 0)`
- `CHECK (streak_multiplier > 0)`

**RLS Gaps:**
- Users can see others' predictions, which is correct
- No row-level access control needed (public data)

**Migration:** `10_enhance_predictions_schema.sql`

---

### TABLE: comments

**Current State:**
```sql
- id (UUID, PK)
- user_id (UUID, NOT NULL)
- match_id (UUID, NOT NULL)
- content (TEXT)
- upvotes (INTEGER, DEFAULT 0)
- created_at (TIMESTAMPTZ, DEFAULT now())
```

**Missing Columns:**

| Column | Type | Purpose | Priority |
|--------|------|---------|----------|
| `user_id` | UUID REFERENCES users(id) | Foreign key (missing) | CRITICAL |
| `match_id` | UUID REFERENCES matches(id) | Foreign key (missing) | CRITICAL |
| `parent_comment_id` | UUID REFERENCES comments(id) | For nested replies | MEDIUM |
| `reply_count` | INTEGER DEFAULT 0 | Denormalised | LOW |
| `content_length` | INTEGER | Store content length | LOW |
| `edited` | BOOLEAN DEFAULT FALSE | Edit tracking | MEDIUM |
| `edited_at` | TIMESTAMPTZ | When edited | MEDIUM |
| `is_deleted` | BOOLEAN DEFAULT FALSE | Soft delete | MEDIUM |
| `flagged` | BOOLEAN DEFAULT FALSE | Moderation flag | HIGH |
| `flagged_reason` | TEXT | Why flagged | HIGH |
| `updated_at` | TIMESTAMPTZ DEFAULT now() | Last update | HIGH |

**Missing Indexes:**
- `idx_comments_user_id` - For user queries
- `idx_comments_match_id` - For match queries
- `idx_comments_created_at` - For sorting
- `idx_comments_flagged` - For moderation
- `idx_comments_parent_comment_id` - For nested queries

**Missing Constraints:**
- `CHECK (upvotes >= 0)`
- `CHECK (reply_count >= 0)`
- `CHECK (content IS NOT NULL AND LENGTH(content) > 0)`

**Migration:** `11_enhance_comments_schema.sql`

---

## Part 2: New Tables Required

### TABLE 1: teams (CRITICAL)

**Purpose:** Centralized team data instead of hardcoded in matches

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  country TEXT,
  founded_year INTEGER,
  website TEXT,
  rating INTEGER DEFAULT 2000,
  win_rate DECIMAL(5,2) DEFAULT 50,
  last_match_time TIMESTAMPTZ,
  total_matches INTEGER DEFAULT 0,
  recent_form TEXT DEFAULT 'LLLLL',
  best_map TEXT,
  worst_map TEXT,
  key_player TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_teams_rating,
  INDEX idx_teams_win_rate,
  INDEX idx_teams_name
);
```

**Usage:** Replace hardcoded team names with team_id references, populate from real team data
**Migration:** `09_create_teams.sql`
**Priority:** CRITICAL

---

### TABLE 2: tournaments (CRITICAL)

**Purpose:** Tournament information instead of hardcoded text

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  prize_pool TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  organizer TEXT,
  location TEXT,
  country TEXT,
  match_count INTEGER DEFAULT 0,
  team_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  featured BOOLEAN DEFAULT FALSE,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_tournaments_start_date,
  INDEX idx_tournaments_status,
  INDEX idx_tournaments_featured
);
```

**Usage:** Join with matches, replace tournament hardcoded text
**Migration:** `10_create_tournaments.sql`
**Priority:** CRITICAL

---

### TABLE 3: intel_posts (HIGH)

**Purpose:** User-submitted or admin-created analysis posts

```sql
CREATE TABLE intel_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL CHECK (category IN ('team-form', 'roster-change', 'tournament', 'betting', 'meta', 'general')),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_intel_posts_author_id,
  INDEX idx_intel_posts_featured,
  INDEX idx_intel_posts_published,
  INDEX idx_intel_posts_created_at DESC,
  INDEX idx_intel_posts_category
);
```

**RLS:**
```sql
- Users can view all published intel posts
- Users can create own intel posts
- Admins can feature/unpublish
```

**Migration:** `11_create_intel_posts.sql`
**Priority:** HIGH

---

### TABLE 4: blog_posts (HIGH)

**Purpose:** Long-form analysis and news articles

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preview TEXT,
  category TEXT NOT NULL CHECK (category IN ('Analysis', 'Betting', 'Teams', 'Meta', 'Tournament')),
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  read_time INTEGER,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_blog_posts_author_id,
  INDEX idx_blog_posts_published,
  INDEX idx_blog_posts_featured,
  INDEX idx_blog_posts_created_at DESC,
  INDEX idx_blog_posts_category
);
```

**RLS:**
```sql
- Users can view published posts
- Authors can edit own posts
- Admins can publish/feature
```

**Migration:** `12_create_blog_posts.sql`
**Priority:** HIGH

---

### TABLE 5: community_categories (HIGH)

**Purpose:** Organize community discussions

```sql
CREATE TABLE community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  discussion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_community_categories_name
);
```

**RLS:** Public read, admin create/update
**Migration:** `13_create_community_categories.sql`
**Priority:** HIGH

---

### TABLE 6: community_discussions (HIGH)

**Purpose:** Match and topic discussions

```sql
CREATE TABLE community_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES community_categories(id) ON DELETE RESTRICT,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'flagged', 'closed')),
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_community_discussions_category_id,
  INDEX idx_community_discussions_author_id,
  INDEX idx_community_discussions_status,
  INDEX idx_community_discussions_created_at DESC
);
```

**RLS:**
```sql
- Users can view active/open discussions
- Users can create new discussions
- Authors can edit own discussions
- Moderators can flag/lock
```

**Migration:** `14_create_community_discussions.sql`
**Priority:** HIGH

---

### TABLE 7: community_posts (HIGH)

**Purpose:** User posts in discussions or community

```sql
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES community_discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('Match Discussion', 'Betting Discussion', 'Tournament Discussion', 'Team Analysis', 'Roster Changes', 'Predictions')),
  views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_community_posts_discussion_id,
  INDEX idx_community_posts_author_id,
  INDEX idx_community_posts_created_at DESC
);
```

**Migration:** `15_create_community_posts.sql`
**Priority:** HIGH

---

### TABLE 8: activity_feed (MEDIUM)

**Purpose:** Track user activities

```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('prediction', 'comment', 'post', 'upvote', 'discussion', 'achievement')),
  subject_id UUID,
  subject_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_activity_feed_user_id,
  INDEX idx_activity_feed_created_at DESC
);
```

**Migration:** `16_create_activity_feed.sql`
**Priority:** MEDIUM

---

### TABLE 9: user_stats_snapshots (MEDIUM)

**Purpose:** Daily snapshots for analytics

```sql
CREATE TABLE user_stats_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  intel_score INTEGER,
  accuracy_percentage DECIMAL(5,2),
  prediction_count INTEGER,
  post_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, snapshot_date),
  
  -- Indexes
  INDEX idx_user_stats_snapshots_user_id,
  INDEX idx_user_stats_snapshots_snapshot_date
);
```

**Migration:** `17_create_user_stats_snapshots.sql`
**Priority:** MEDIUM

---

### TABLE 10: match_predictions_aggregate (MEDIUM)

**Purpose:** Denormalised predictions for fast read access

```sql
CREATE TABLE match_predictions_aggregate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  total_predictions INTEGER DEFAULT 0,
  team1_votes INTEGER DEFAULT 0,
  team2_votes INTEGER DEFAULT 0,
  team1_percentage DECIMAL(5,2) DEFAULT 50,
  team2_percentage DECIMAL(5,2) DEFAULT 50,
  average_confidence DECIMAL(5,2),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  INDEX idx_match_predictions_aggregate_match_id
);
```

**Maintenance:** Triggers to auto-update when predictions inserted/updated
**Migration:** `18_create_match_predictions_aggregate.sql`
**Priority:** MEDIUM

---

## Part 3: Gap Summary Table

| Gap Type | Count | Critical | Items |
|----------|-------|----------|-------|
| **Missing Table** | 10 | 4 | teams, tournaments, intel_posts, blog_posts, community_discussions, community_categories, community_posts, activity_feed, user_stats_snapshots, match_predictions_aggregate |
| **Missing Column** | 30+ | 8 | Foreign keys in existing tables, timestamps, validation columns |
| **Missing Index** | 25+ | 10 | Performance-critical indexes for filtering/sorting |
| **Missing Constraint** | 15+ | 8 | Value validation, uniqueness, referential integrity |
| **Missing RLS Policy** | 20+ | 10 | Row-level security for new tables |
| **Existing Function Gap** | 24 | 10 | New API functions needed |

**Total Implementation Work:** 50-60 hours
- **Schema (Phase 4):** 6-8 hours (migrations)
- **Data Layer (Phase 5):** 15-20 hours (API functions)
- **Frontend (Phase 5):** 20-25 hours (component updates)
- **Testing:** 5-10 hours

---

## Conclusion

The gaps are significant but manageable. All critical items can be completed in 2-3 weeks with focused effort. No architectural changes needed - just schema expansion and new API functions.

