# CS INTEL PLATFORM - SYSTEM INTELLIGENCE DOCUMENT

**Version:** 1.0  
**Last Updated:** June 1, 2026  
**Status:** Development-Ready (Frontend 80%, Backend 50%, Database 70% Complete)

---

## 📋 EXECUTIVE SUMMARY

**CS Intel** is a Counter-Strike 2 esports predictions and community intelligence platform. Users predict match outcomes, track their prediction accuracy through an "Intel Score" leaderboard system, engage in community discussions, and read professional analysis posts.

**Core Proposition:**
- **Predictions:** Users bet on CS2 match outcomes and build accuracy scores
- **Intelligence:** Community-driven consensus and expert analysis
- **Leaderboards:** Reputation system (Intel Score = correctness + confidence)
- **Community:** Discussions, posts, comments organized by category
- **Content:** Blog articles and analysis posts

**Current Production Readiness: 45%** (Database schema ready, auth working, frontend UI complete, backend queries largely functional but heavily dependent on mock data)

---

## 🏗️ CURRENT ARCHITECTURE OVERVIEW

### Technology Stack
```
Frontend:    Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:     Supabase (PostgreSQL + Auth + Row-Level Security)
Auth:        Supabase Auth (email/password)
Hosting:     Vercel (recommended) or Node.js hosting
Database:    PostgreSQL (Supabase managed)
API Layer:   Server-side functions in lib/api/index.ts
```

### Data Flow Architecture

```
User Browser
    ↓
Next.js App Router Page
    ↓
React Component (Client)
    ↓
API Function (lib/api/index.ts)
    ↓
Supabase Client
    ↓
PostgreSQL Database / Auth
    ↓
Response → Component State → Rendered UI
```

### Current Data Sources

| Data Type | Source | Status |
|-----------|--------|--------|
| Matches | Mock data (lib/data.ts) | ⚠️ MOCKED |
| Predictions | Real DB (predictions table) | ✅ REAL |
| Users & Profiles | Real DB (users table) | ✅ REAL |
| Comments | Real DB (comments table) | ✅ REAL |
| Teams | Real DB (teams table) | ✅ SCHEMA EXISTS, NO DATA |
| Tournaments | Real DB (tournaments table) | ✅ SCHEMA EXISTS, NO DATA |
| Intel Posts | Real DB (intel_posts table) | ✅ SCHEMA EXISTS, NO DATA |
| Blog Posts | Real DB (blog_posts table) | ✅ SCHEMA EXISTS, NO DATA |
| Community Discussions | Real DB (community_discussions table) | ✅ SCHEMA EXISTS, NO DATA |
| Community Posts | Real DB (community_posts table) | ✅ SCHEMA EXISTS, NO DATA |
| Activity Feed | Real DB (activity_feed table) | ✅ SCHEMA EXISTS, NO DATA |
| User Stats Snapshots | Real DB (user_stats_snapshots table) | ✅ SCHEMA EXISTS, NO DATA |
| Prediction Aggregates | Real DB (match_predictions_aggregate table) | ✅ SCHEMA EXISTS, AUTO-UPDATED |

---

## 📊 DATABASE ARCHITECTURE (CURRENT STATE)

### Core Tables (Production Ready)

#### 1. `auth.users` (Supabase Auth)
**Purpose:** Authentication credentials and session management

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PRIMARY KEY |
| email | TEXT | Unique email for login |
| encrypted_password | TEXT | Hashed password |
| email_confirmed_at | TIMESTAMPTZ | Verification status |
| raw_user_meta_data | JSONB | Custom metadata (username, etc.) |
| created_at | TIMESTAMPTZ | Account creation date |

**Indexes:** None (managed by Supabase)

**RLS Policies:**
- Users can view own auth data only
- Supabase manages this table

---

#### 2. `users` (User Profiles)
**Purpose:** Centralize user profile data and reputation system

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY, REFERENCES auth.users(id) |
| email | TEXT | NULL | Unique |
| username | TEXT | NULL | |
| avatar | TEXT | NULL | URL or emoji |
| intel_score | INTEGER | 0 | CHECK (intel_score >= 0) |
| is_admin | BOOLEAN | FALSE | |
| created_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_users_id (on id)
- idx_users_intel_score (on intel_score DESC)
- idx_users_is_admin (on is_admin)

**RLS Policies:**
- Users can view/update own profile
- Anyone can view public user data (leaderboard, predictions)
- Only admins can set is_admin flag

**Relationships:**
- ← predictions (user_id)
- ← comments (user_id)
- ← intel_posts (author_id)
- ← blog_posts (author_id)
- ← community_discussions (author_id)
- ← community_posts (author_id)
- ← activity_feed (user_id)
- ← user_stats_snapshots (user_id)

**Trigger:** `on_auth_user_created` - Auto-creates profile when user signs up

---

#### 3. `matches` (Match Information)
**Purpose:** CS2 match data including teams, timing, and results

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| team1 | TEXT | | NOT NULL |
| team2 | TEXT | | NOT NULL |
| match_time | TIMESTAMPTZ | | |
| tournament | TEXT | '' | |
| status | TEXT | 'upcoming' | CHECK (status IN ('upcoming', 'live', 'completed')) |
| result | TEXT | NULL | CHECK (result IN ('team1_win', 'team2_win', 'draw')) |
| created_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_matches_status (on status)
- idx_matches_match_time (on match_time)

**RLS Policies:**
- Anyone can read matches
- Only admins can create/update

**Relationships:**
- → predictions (match_id) one-to-many
- → comments (match_id) one-to-many
- → community_discussions (match_id) one-to-many
- → match_predictions_aggregate (match_id) one-to-one
- ← intel_posts (match_id) one-to-many

**⚠️ ISSUE:** Uses hardcoded team names (strings) instead of FKs to teams table. Should use team_id foreign keys.

---

#### 4. `predictions` (User Predictions)
**Purpose:** Track user predictions on match outcomes with confidence and accuracy

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | | NOT NULL, REFERENCES users(id) |
| match_id | UUID | | NOT NULL, REFERENCES matches(id) |
| prediction | BOOLEAN | | NOT NULL (true=team1, false=team2) |
| confidence | INTEGER | 70 | CHECK (confidence BETWEEN 50 AND 100) |
| result | TEXT | 'pending' | CHECK (result IN ('pending', 'correct', 'incorrect')) |
| is_correct | BOOLEAN | FALSE | Denormalised for fast reads |
| created_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_predictions_user_id (on user_id)
- idx_predictions_match_id (on match_id)
- idx_predictions_result (on result)
- predictions_user_match_unique (UNIQUE on user_id, match_id)

**RLS Policies:**
- Users can create own predictions
- Users can view own/public predictions
- Admins can update results

**Relationships:**
- → users (user_id) many-to-one
- → matches (match_id) many-to-one
- ← match_predictions_aggregate (updated via trigger)

**Triggers:**
- `trigger_update_match_predictions_aggregate` - Updates aggregate table on INSERT/UPDATE

**Scoring System:**
```
Correct + 90%+ confidence: +10 + 2 = +12 points
Correct + 70-89% confidence: +10 + 1 = +11 points
Correct + 50-69% confidence: +10 points
Incorrect prediction: -2 points
Pending: 0 points
```

---

#### 5. `comments` (Match Comments)
**Purpose:** User comments on matches (currently minimal schema)

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | | NOT NULL, REFERENCES users(id) |
| match_id | UUID | | NOT NULL, REFERENCES matches(id) |
| content | TEXT | | |
| upvotes | INTEGER | 0 | CHECK (upvotes >= 0) |
| created_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_comments_match_id (on match_id)
- idx_comments_user_id (on user_id)
- idx_comments_created_at (on created_at DESC)

**RLS Policies:**
- Users can create own comments
- Anyone can read comments
- Users can update own comments

**Relationships:**
- → users (user_id)
- → matches (match_id)

---

### Extended Tables (Mostly Schema, No Data)

#### 6. `teams` (Team Information)
**Purpose:** Centralize CS2 team data instead of hardcoding team names

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| name | TEXT | | NOT NULL, UNIQUE |
| slug | TEXT | | NOT NULL, UNIQUE |
| logo | TEXT | | Emoji or URL |
| country | TEXT | | |
| founded_year | INTEGER | | |
| website | TEXT | | |
| rating | INTEGER | 2000 | ELO rating system |
| win_rate | DECIMAL(5,2) | 50 | CHECK (0-100) |
| last_match_time | TIMESTAMPTZ | | |
| total_matches | INTEGER | 0 | CHECK (>= 0) |
| recent_form | TEXT | 'LLLLL' | Last 5 matches (W/L/D) |
| best_map | TEXT | | |
| worst_map | TEXT | | |
| key_player | TEXT | | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_teams_rating (on rating DESC)
- idx_teams_win_rate (on win_rate DESC)
- idx_teams_name (on name)

**RLS Policies:**
- Anyone can read teams
- Only admins can write/update

**Status:** ⚠️ SCHEMA EXISTS, NO DATA (needs seeding)

---

#### 7. `tournaments` (Tournament Data)
**Purpose:** CS2 tournament information

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| name | TEXT | | NOT NULL, UNIQUE |
| slug | TEXT | | NOT NULL, UNIQUE |
| description | TEXT | | |
| prize_pool | TEXT | | |
| start_date | TIMESTAMPTZ | | |
| end_date | TIMESTAMPTZ | | |
| organizer | TEXT | | |
| location | TEXT | | |
| country | TEXT | | |
| match_count | INTEGER | 0 | Denormalised |
| team_count | INTEGER | 0 | Denormalised |
| status | TEXT | 'upcoming' | CHECK (upcoming/live/completed) |
| featured | BOOLEAN | FALSE | |
| logo | TEXT | | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_tournaments_start_date (on start_date DESC)
- idx_tournaments_status (on status)
- idx_tournaments_featured (on featured)

**RLS Policies:**
- Anyone can read
- Only admins can write/update

**Status:** ⚠️ SCHEMA EXISTS, NO DATA (needs seeding)

---

#### 8. `intel_posts` (Analysis Posts)
**Purpose:** User or admin-created analysis posts about teams, rosters, tournaments, betting

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| author_id | UUID | | NOT NULL, REFERENCES users(id) |
| title | TEXT | | NOT NULL |
| content | TEXT | | |
| category | TEXT | | CHECK (team-form/roster-change/tournament/betting/meta/general) |
| match_id | UUID | | REFERENCES matches(id) ON DELETE SET NULL |
| featured | BOOLEAN | FALSE | |
| views | INTEGER | 0 | Denormalised |
| published | BOOLEAN | TRUE | Draft/published |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_intel_posts_author_id
- idx_intel_posts_featured (WHERE featured=true)
- idx_intel_posts_published (WHERE published=true)
- idx_intel_posts_created_at
- idx_intel_posts_category
- idx_intel_posts_match_id

**RLS Policies:**
- Read: Published posts OR author OR admin
- Create: Any authenticated user
- Update: Author or admin

**Status:** ⚠️ SCHEMA EXISTS, NO DATA

---

#### 9. `blog_posts` (Blog Articles)
**Purpose:** Long-form analysis and news articles

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| author_id | UUID | | NOT NULL, REFERENCES users(id) |
| title | TEXT | | NOT NULL |
| content | TEXT | | NOT NULL |
| preview | TEXT | | |
| category | TEXT | | CHECK (Analysis/Betting/Teams/Meta/Tournament) |
| featured | BOOLEAN | FALSE | |
| published | BOOLEAN | FALSE | |
| views | INTEGER | 0 | Denormalised |
| read_time | INTEGER | | Minutes |
| slug | TEXT | | UNIQUE, URL-friendly |
| created_at | TIMESTAMPTZ | NOW() | |
| published_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_blog_posts_author_id
- idx_blog_posts_published (WHERE published=true)
- idx_blog_posts_featured (WHERE featured=true)
- idx_blog_posts_created_at
- idx_blog_posts_slug

**RLS Policies:**
- Read: Published posts OR author OR admin
- Create: Any authenticated user
- Publish: Author or admin

**Status:** ⚠️ SCHEMA EXISTS, NO DATA

---

#### 10. `community_categories` (Discussion Categories)
**Purpose:** Organize community discussions

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| name | TEXT | | NOT NULL, UNIQUE |
| slug | TEXT | | NOT NULL, UNIQUE |
| description | TEXT | | |
| icon | TEXT | | Emoji |
| discussion_count | INTEGER | 0 | Denormalised |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_community_categories_name
- idx_community_categories_slug

**RLS Policies:**
- Anyone can read
- Only admins can write/update

**Status:** ⚠️ SCHEMA EXISTS, NO DATA

**Note:** Per database necessity review, consider hardcoding 6 categories in code instead of DB table.

---

#### 11. `community_discussions` (Discussion Threads)
**Purpose:** Topic discussions in community categories

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| title | TEXT | | NOT NULL |
| description | TEXT | | |
| category_id | UUID | | NOT NULL, REFERENCES community_categories(id) |
| match_id | UUID | | REFERENCES matches(id) ON DELETE SET NULL |
| author_id | UUID | | NOT NULL, REFERENCES users(id) |
| reply_count | INTEGER | 0 | Denormalised |
| view_count | INTEGER | 0 | Denormalised |
| upvote_count | INTEGER | 0 | Denormalised |
| status | TEXT | 'active' | CHECK (active/locked/flagged/closed) |
| pinned | BOOLEAN | FALSE | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_community_discussions_category_id
- idx_community_discussions_author_id
- idx_community_discussions_status
- idx_community_discussions_created_at (DESC)
- idx_community_discussions_match_id
- idx_community_discussions_pinned (WHERE pinned=true)

**RLS Policies:**
- Read: Non-flagged OR author OR admin
- Create: Any authenticated user
- Update: Author or admin

**Status:** ⚠️ SCHEMA EXISTS, NO DATA

---

#### 12. `community_posts` (Posts in Discussions)
**Purpose:** Individual posts within discussion threads

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| discussion_id | UUID | | REFERENCES community_discussions(id) ON DELETE CASCADE |
| author_id | UUID | | NOT NULL, REFERENCES users(id) |
| content | TEXT | | NOT NULL, CHECK (LENGTH > 0) |
| category | TEXT | | CHECK (Match/Betting/Tournament/Team/Roster/Predictions) |
| views | INTEGER | 0 | Denormalised |
| upvotes | INTEGER | 0 | Denormalised |
| reply_count | INTEGER | 0 | Denormalised |
| flagged | BOOLEAN | FALSE | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_community_posts_discussion_id
- idx_community_posts_author_id
- idx_community_posts_created_at
- idx_community_posts_flagged (WHERE flagged=true)

**RLS Policies:**
- Read: Non-flagged OR author OR admin
- Create: Any authenticated user
- Update: Author or admin

**Status:** ⚠️ SCHEMA EXISTS, NO DATA

---

#### 13. `activity_feed` (User Activity Log)
**Purpose:** Track user actions (predictions, posts, comments, upvotes, achievements)

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | | NOT NULL, REFERENCES users(id) |
| activity_type | TEXT | | CHECK (prediction/comment/post/upvote/discussion/achievement) |
| subject_id | UUID | | ID of related object |
| subject_type | TEXT | | Type of object (prediction, comment, post, etc.) |
| description | TEXT | | |
| created_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_activity_feed_user_id
- idx_activity_feed_created_at (DESC)
- idx_activity_feed_activity_type
- idx_activity_feed_user_created (user_id, created_at DESC)

**RLS Policies:**
- Read: Public activity feed
- Create: Only for own activities

**Status:** ⚠️ SCHEMA EXISTS, NO DATA

**Note:** Per database necessity review, consider using query-based approach (UNION across predictions/posts/discussions) instead of this table. Add post-launch if high community usage.

---

#### 14. `user_stats_snapshots` (Historical User Stats)
**Purpose:** Daily snapshots of user statistics for analytics and leaderboard history

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | | NOT NULL, REFERENCES users(id) |
| snapshot_date | DATE | | NOT NULL, UNIQUE(user_id, snapshot_date) |
| intel_score | INTEGER | | CHECK (>= 0) |
| accuracy_percentage | DECIMAL(5,2) | | CHECK (0-100) |
| prediction_count | INTEGER | | CHECK (>= 0) |
| post_count | INTEGER | | CHECK (>= 0) |
| comment_count | INTEGER | | CHECK (>= 0) |
| created_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_user_stats_snapshots_user_id
- idx_user_stats_snapshots_snapshot_date
- idx_user_stats_snapshots_user_date (user_id, snapshot_date DESC)

**RLS Policies:**
- Read: Own stats OR public stats
- Create: Only admins

**Status:** ⚠️ SCHEMA EXISTS, NO DATA

**Note:** Per database necessity review, consider computing stats on-demand instead of storing snapshots. Add post-launch if profile loads slow.

---

#### 15. `match_predictions_aggregate` (Prediction Consensus)
**Purpose:** Denormalised view of prediction consensus per match for fast reads

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PRIMARY KEY |
| match_id | UUID | | NOT NULL, UNIQUE, REFERENCES matches(id) |
| total_predictions | INTEGER | 0 | CHECK (>= 0) |
| team1_votes | INTEGER | 0 | CHECK (>= 0) |
| team2_votes | INTEGER | 0 | CHECK (>= 0) |
| team1_percentage | DECIMAL(5,2) | 50 | CHECK (0-100) |
| team2_percentage | DECIMAL(5,2) | 50 | CHECK (0-100) |
| average_confidence | DECIMAL(5,2) | | CHECK (50-100 or NULL) |
| updated_at | TIMESTAMPTZ | NOW() | |

**Indexes:**
- idx_match_predictions_aggregate_match_id

**RLS Policies:**
- Read: Public
- Update: Only admins

**Triggers:**
- `trigger_update_match_predictions_aggregate` - Auto-updates on predictions INSERT/UPDATE

**Status:** ✅ WORKING (Auto-populated by trigger)

**Note:** Per database necessity review, consider querying predictions table directly for MVP. Add this post-launch if match card rendering slows.

---

### Missing or Incomplete Database Structures

#### ❌ Critical Issues

1. **matches table missing foreign keys**
   - Uses hardcoded team1/team2 TEXT fields instead of team_id UUIDs
   - Should reference teams table
   - **Fix:** Add team1_id, team2_id UUIDs with FK constraints

2. **matches table missing player data**
   - No players or squad information
   - Current schema can't show which players played
   - **Fix:** Add player/squad table with relationships

3. **matches table missing map information**
   - No map veto or specific map data
   - **Fix:** Add maps table and match_maps junction table

4. **matches table missing detailed match stats**
   - Round scores, economy stats, clutch moments
   - **Fix:** Extend schema or create match_statistics table

#### ⚠️ Data Quality Issues

1. **teams table empty** - Needs seeding with real CS2 teams
2. **tournaments table empty** - Needs seeding with major tournaments
3. **No seed data scripts** - Manual data insertion required
4. **No API to fetch match data** - Matches hardcoded in mock data

#### 📋 Schema Improvements Needed (Post-MVP)

1. **Player stats table** - Track individual player performance
2. **Map stats table** - Track team performance by map
3. **Tournament brackets** - Track tournament structure and seeding
4. **Notifications table** - Track user notifications
5. **User follows table** - Track which users follow which teams/users
6. **Upvotes/reactions table** - Separate from denormalised counts

---

## 📝 MOCK DATA ANALYSIS

### Overview
The system relies heavily on mock data in [lib/data.ts](lib/data.ts) (~800+ lines). This file contains comprehensive test data but blocks real functionality.

### Mock Datasets Inventory

| Mock Dataset | Used By | Feature Powered | Classification | Real DB Equivalent |
|---|---|---|---|---|
| `matches` | MatchCard, Matches page, predictions | Today's matches display | **REMOVE** | Query real matches table |
| `featuredMatch` | FeaturedMatch, Match Hub page | Featured match display | **REMOVE** | Query matches with featured flag |
| `intelPosts` | IntelPostCard, Intel Feed | News/analysis posts | **REMOVE** | Query intel_posts table |
| `communityActivity` | CommunityActivityItem, Feed | Community activity stream | **COMPUTE** | Query activity_feed or UNION predictions/posts |
| `rankings` | RankingItem, Rankings page | Team rankings | **COMPUTE** | Compute from matches/predictions or teams table |
| `communityComments` | CommunityDiscussionFeed | Match comments | **REMOVE** | Query comments table |
| `communityPredictions` | CommunityPredictionsWidget | Predictions on match | **REMOVE** | Query predictions table |
| `intelUpdates` | IntelFeed | Match updates timeline | **REMOVE** | Create as separate posts or events |
| `relatedMatches` | RelatedMatchCard | Upcoming matches | **REMOVE** | Query matches with status filter |
| `matchTournament` | TournamentInfoWidget | Tournament info | **REMOVE** | Query tournaments table |
| `communityStats` | Community page header | Stats display | **COMPUTE** | Query counts on tables |
| `communityDiscussions` | CommunityPage, Community feed | Discussion threads | **REMOVE** | Query community_discussions |
| `communityCategories` | Community page sidebar | Category navigation | **MIGRATE** | Seed community_categories table |
| `communityPosts` | Community page | User posts in discussions | **REMOVE** | Query community_posts table |
| `topContributors` | Community page | Leaderboard of contributors | **COMPUTE** | Query users ordered by intel_score |
| `communityTags` | Community page | Discussion tags | **MIGRATE** | Create tags table |
| `trendingMatches` | Community page | Trending matches | **COMPUTE** | Query matches by discussion count |
| `newestMembers` | Community page | New user list | **COMPUTE** | Query users ordered by created_at |
| `rankingTeams` | Rankings page | Team rankings | **MIGRATE** | Seed teams table with ratings |
| `rankingMovers` | Rankings page | Team movement | **COMPUTE** | Compare snapshots |
| `rankingUpcoming` | Rankings page | Upcoming matches impact | **COMPUTE** | Query matches with team filters |
| `blogPosts` | Blog page | Blog articles | **REMOVE** | Query blog_posts table |
| `adminStats` | Admin page | Dashboard metrics | **COMPUTE** | Query system stats |
| `quickActions` | Admin page | Admin actions | **HARDCODE** | Hardcode as constants |
| `adminActivities` | Admin page | Admin activity log | **COMPUTE** | Query activity_feed filtered |
| `adminBlogPosts` | Admin page | Blog management | **REMOVE** | Query blog_posts |
| `adminIntelPosts` | Admin page | Intel post management | **REMOVE** | Query intel_posts |
| `adminDiscussions` | Admin page | Discussion moderation | **REMOVE** | Query community_discussions |
| `reportItems` | Admin page | Flagged content | **REMOVE** | Query community_posts/discussions with flagged=true |
| `adminMatches` | Admin page | Match management | **REMOVE** | Query matches table |
| `analyticsData` | Admin page | Analytics charts | **COMPUTE** | Run analytics queries |
| `adminNotes` | Admin page | Admin notes | **MIGRATE** | Create admin_notes table |
| `platformStatus` | Admin page | System status | **HARDCODE** | Use real monitoring |
| `recentAlerts` | Admin page | System alerts | **COMPUTE** | Query alerts table |

### Migration Priority

**PHASE 1 (Immediate - Before Real Data):**
```
1. Remove: matches, featuredMatch → Use getMatches() from DB
2. Remove: communityComments → Use getComments() from DB
3. Remove: communityPredictions → Use getPredictions() from DB
4. Remove: relatedMatches → Compute from matches query
```

**PHASE 2 (Before Launch):**
```
5. Migrate: rankingTeams → Seed teams table
6. Migrate: communityCategories → Seed community_categories table
7. Remove: intelPosts, blogPosts → Use DB tables
8. Remove: communityDiscussions, communityPosts → Use DB tables
```

**PHASE 3 (Post-MVP):**
```
9. Compute: rankings, stats, trending → Real calculations
10. Compute: activity feed, top contributors → Real queries
```

---

## 🎯 FEATURE → DATA MAPPING (CRITICAL SECTION)

### Comprehensive Feature Matrix

| Feature | Pages | Tables Used | API Functions | Data Status | Completeness | Notes |
|---------|-------|-------------|---------------|-------------|--------------|-------|
| **CORE PREDICTIONS** |
| Make Prediction | /predictions | predictions, matches, users | submitPrediction() | Real DB | ✅ 95% | Fully functional |
| View My Predictions | /profile | predictions, matches, users | getPredictions() | Real DB | ✅ 90% | Works, needs match details |
| Prediction History | /profile | predictions, matches | getPredictions() | Real DB | ✅ 85% | Missing match team info |
| Evaluate Predictions | /admin | predictions, matches | evaluatePredictions() | Real DB | ✅ 90% | Admin only, functional |
| **LEADERBOARDS** |
| Overall Leaderboard | /leaderboard | users, predictions | getLeaderboard() | Real DB | ✅ 85% | Functional, computed on-demand |
| Top Predictors Tab | /leaderboard | users, predictions | getLeaderboard() | Computed | ✅ 80% | Works but needs filtering |
| Rising Stars Tab | /leaderboard | users, predictions | getLeaderboard() | Computed | ⚠️ 60% | Shows new users with high accuracy |
| Leaderboard Stats | /leaderboard | users, predictions | getLeaderboard() | Computed | ✅ 85% | Overall stats displayed |
| **MATCHES** |
| Display Matches | / /matches | matches (MOCKED) | getMatches() | Mock DB* | ⚠️ 30% | Uses mocked matches |
| Match Details | /matches | matches, predictions, comments, tournaments | getMatches() | Mixed | ⚠️ 40% | Mixed mock/real data |
| Community Consensus | /matches | predictions, matches | getMatchPredictions() | Real DB | ✅ 85% | Works from predictions |
| Match Results | /admin | matches, predictions | setMatchResult() | Real DB | ✅ 90% | Admin can set results |
| **RANKINGS & TEAMS** |
| Global Rankings | /rankings | teams (MOCKED), rankings table | - | Mock DB* | ⚠️ 10% | Completely mocked |
| Team Info | /rankings | teams | - | Mock DB* | ❌ 0% | No real team data |
| Team Stats | /rankings | teams, matches | - | Mock DB* | ❌ 0% | No computation |
| **COMMUNITY** |
| Discussions | /community | community_discussions (empty), community_posts (empty) | - | Empty DB | ❌ 0% | Tables exist, no data |
| Trending Discussions | /community | community_discussions (MOCKED) | - | Mock DB* | ❌ 0% | Pure mock data |
| Community Posts | /community | community_posts (MOCKED) | - | Mock DB* | ❌ 0% | Pure mock data |
| Community Categories | /community | community_categories (empty) | - | Empty DB | ❌ 0% | Schema exists, no data |
| **CONTENT** |
| Intel Posts | /, /matches | intel_posts (empty) | - | Empty DB | ❌ 0% | Schema exists, no data |
| Blog Posts | /blog | blog_posts (empty) | - | Empty DB | ❌ 0% | Schema exists, no data |
| Blog Featured | /blog | blog_posts (MOCKED) | - | Mock DB* | ❌ 0% | Pure mock data |
| **USER PROFILES** |
| Profile View | /profile | users, predictions | getUserProfile(), getPredictions() | Real DB | ✅ 80% | Shows predictions and stats |
| Profile Stats | /profile | users, predictions | calculateIntelScore() | Real DB | ✅ 85% | Computed from predictions |
| Prediction History | /profile | predictions | getPredictions() | Real DB | ✅ 85% | Lists user predictions |
| **ADMIN** |
| Prediction Management | /admin | predictions | getAllPredictions() | Real DB | ✅ 90% | Can view, filter, stats |
| User Management | /admin | users, predictions | getUsersWithStats() | Real DB | ✅ 80% | View users with stats |
| Match Management | /admin | matches | setMatchResult() | Real DB | ✅ 85% | Can set results |
| System Status | /admin | - | - | Mock DB* | ❌ 0% | Pure mock data |
| Content Moderation | /admin | community_posts, community_discussions | - | Empty DB | ❌ 0% | No moderation tools |
| **ACTIVITY FEED** |
| Activity Feed | Community feed | activity_feed (empty) | - | Empty DB | ❌ 0% | Could use query-based approach |
| User Activity | /profile | activity_feed (empty) | - | Empty DB | ❌ 0% | Not implemented |

**\* MOCKED = Using lib/data.ts**

### Critical Implementation Gaps

**🔴 BLOCKER - Cannot show real matches:**
- Matches page shows mock matches, not real tournament data
- Need real match data source (API, manual entry, or automation)
- Admin match management UI exists but no match creation API

**🔴 BLOCKER - No team data:**
- Rankings page shows mock team data
- Teams table exists but is empty
- Need to seed ~20 major CS2 teams

**🔴 BLOCKER - No community features:**
- Community discussions table exists but has no data
- Blog and Intel posts tables exist but are empty
- Pages display mock data, not database queries

**🟡 HIGH PRIORITY - Incomplete features:**
- Match details page needs real player/squad data
- Predictions page references match details that don't exist
- Blog and Intel sections not connected to database

---

## 🔌 API LAYER ANALYSIS

### Current API Functions (lib/api/index.ts)

#### Data Fetching Functions

##### `getMatches()`
```typescript
Purpose: Fetch all matches with aggregated prediction data
Tables Used: matches, predictions
Returns: Match[]
Status: ✅ FUNCTIONAL
Correctness: 90% (Works but missing match details)
Issues:
  - Aggregates predictions as percentages on-the-fly (performance concern at scale)
  - Only shows matches, not full details (no tournament, players, etc.)
Performance: O(n*m) where n=matches, m=predictions (can optimize with match_predictions_aggregate)
```

##### `getPredictions()`
```typescript
Purpose: Fetch all predictions with user data
Tables Used: predictions (LEFT JOIN users)
Returns: Prediction[]
Status: ✅ FUNCTIONAL
Correctness: 95% (Complete, includes user data)
Issues: None known
Performance: O(n) with index on user_id
```

##### `getUsers()`
```typescript
Purpose: Fetch users ordered by intel_score (leaderboard)
Tables Used: users
Returns: User[]
Status: ✅ FUNCTIONAL
Correctness: 100%
Issues: None known
Performance: O(n log n) with index on intel_score DESC
```

##### `getComments()`
```typescript
Purpose: Fetch match comments with usernames
Tables Used: comments (LEFT JOIN users)
Returns: Comment[]
Status: ✅ FUNCTIONAL
Correctness: 95%
Issues:
  - Currently unused (comments still use mocked data)
Performance: O(n) with proper indexes
```

##### `getLeaderboard()`
```typescript
Purpose: Compute leaderboard rankings with accuracy
Tables Used: users, predictions
Returns: LeaderboardEntry[] (with rank, intelScore, accuracy, streak)
Status: ✅ FUNCTIONAL
Correctness: 90% (Works but computes on every call)
Issues:
  - No pagination (loads all users into memory)
  - Computes full leaderboard on every call (should cache)
  - Calculates streaks in-memory (expensive)
Performance: O(n*m) where n=users, m=predictions per user
Optimization: Could cache results for 5-10 minutes, use snapshots table post-launch
```

##### `getUsersWithStats()`
```typescript
Purpose: Get all users with prediction stats
Tables Used: users, predictions
Returns: (User & { predictionCount, correctCount, accuracy })[]
Status: ✅ FUNCTIONAL
Correctness: 95%
Issues:
  - Similar performance issue to getLeaderboard()
  - Called on admin page (high load)
Performance: O(n*m) - expensive
```

##### `getMatchPredictions(matchId)`
```typescript
Purpose: Get predictions for a specific match
Tables Used: predictions
Returns: Prediction[]
Status: ✅ FUNCTIONAL
Correctness: 100%
Issues: None
Performance: O(k) where k=predictions for match
```

##### `getMatchAccuracyStats(matchId)`
```typescript
Purpose: Get accuracy stats for a match
Tables Used: predictions
Returns: { total, correct, accuracy }
Status: ✅ FUNCTIONAL
Correctness: 100%
Issues: None
Performance: O(k)
```

#### Mutation Functions

##### `submitPrediction(matchId, prediction, confidence)`
```typescript
Purpose: User submits or updates a prediction
Tables Used: predictions (UPSERT)
Status: ✅ FUNCTIONAL
Correctness: 95%
Issues:
  - Uses UPSERT on (user_id, match_id) - allows overwriting
  - No validation that match exists
  - No validation that match is upcoming (allows betting after match starts)
Security: ✅ Requires auth
Constraints: ✅ Unique constraint prevents duplicates per user
Trigger: ✅ Updates match_predictions_aggregate via trigger
```

##### `setMatchResult(matchId, result)`
```typescript
Purpose: Admin sets official match result
Tables Used: matches (UPDATE), triggers evaluatePredictions()
Status: ✅ FUNCTIONAL
Correctness: 90%
Issues:
  - Requires admin but no explicit validation
  - No validation that result is valid enum
Security: ✅ Admin check enforced
Trigger: ✅ Calls evaluatePredictions() to score predictions
```

##### `evaluatePredictions(matchId)`
```typescript
Purpose: Score all predictions for a match when result is set
Tables Used: predictions (UPDATE)
Status: ✅ FUNCTIONAL
Correctness: 95%
Issues:
  - Could race condition if called multiple times
  - No idempotent check (can double-score if called twice)
Performance: O(k) where k=predictions for match
```

##### `recalculateAllIntelScores()`
```typescript
Purpose: Admin function to recalculate all user intel scores
Tables Used: users (UPDATE), predictions (SELECT)
Status: ✅ FUNCTIONAL
Correctness: 90%
Issues:
  - Loops through all users (expensive for large user count)
  - No progress tracking
  - Could be done via triggers instead
Security: ✅ Admin only
Performance: O(n*m) - potentially very slow
Suggestion: Use trigger on predictions UPDATE to increment user score instead
```

#### Utility Functions

##### `calculateIntelScore(predictions[])`
```typescript
Purpose: Calculate intel score from predictions
Logic:
  - Correct + 90%+ confidence: +12 points
  - Correct + 70-89% confidence: +11 points
  - Correct + 50-69% confidence: +10 points
  - Incorrect: -2 points
  - Pending: 0 points
Status: ✅ FUNCTIONAL
Correctness: 100%
Issues: None
```

### API Layer Issues & Improvements

#### 🔴 CRITICAL ISSUES

1. **No real match data source**
   - `getMatches()` returns DB matches but no matches exist
   - Frontend falls back to mock data
   - **Fix:** Create admin API to add matches or connect to external API

2. **No authentication on data mutations**
   - `submitPrediction()` checks auth but no explicit error handling
   - `setMatchResult()` checks admin but could be clearer
   - **Fix:** Add explicit auth guards with proper error messages

#### 🟡 HIGH PRIORITY ISSUES

3. **Performance issues with leaderboard/stats functions**
   - Computing full leaderboard on every page load
   - Could cache results or use snapshots table
   - **Fix:** Add caching or use post-launch snapshot table

4. **No pagination on data fetching**
   - `getUsers()`, `getPredictions()` return all rows
   - Will break with large user/prediction counts
   - **Fix:** Add limit/offset parameters

5. **Missing validation in mutations**
   - `submitPrediction()` doesn't validate match exists
   - `setMatchResult()` doesn't validate result is valid
   - **Fix:** Add explicit validation with proper error handling

6. **No error boundaries**
   - Most functions return empty arrays on error
   - Hides underlying issues
   - **Fix:** Throw errors and handle in UI

7. **Denormalised data not updated properly**
   - Match prediction aggregates auto-update via trigger ✅
   - But other denormalised fields (views, counts) don't update
   - **Fix:** Add triggers for comments.upvotes, discussions.reply_count, etc.

#### 📊 PERFORMANCE ANALYSIS

| Function | Time Complexity | Space | Optimizable |
|----------|-----------------|-------|------------|
| getMatches() | O(n + n*m) | O(n) | Use match_predictions_aggregate |
| getLeaderboard() | O(n*m log n) | O(n*m) | Cache, use snapshots |
| getUsersWithStats() | O(n*m) | O(n*m) | Cache, use snapshots |
| getComments() | O(n) | O(n) | ✅ Optimal |
| submitPrediction() | O(1) | O(1) | ✅ Optimal |
| setMatchResult() | O(k) | O(k) | ✅ Optimal (where k=preds) |

---

## 💻 FRONTEND DATA FLOW ANALYSIS

### Page-by-Page Data Sources

#### Home Page (`/`)
```
Mocked Data Used:
  - matches (featured match display)
  - intelPosts (news section)
  - communityActivity (activity feed)
  - rankings (team rankings)

Real Data Used:
  None - entirely mocked

Status: ⚠️ 20% real, 80% mocked
Issues:
  - Hero section has hardcoded text
  - All sections fall back to mock data
  - No real-time updates
```

#### Matches Page (`/matches`)
```
Mocked Data Used:
  - featuredMatch
  - communityComments
  - communityPredictions
  - intelUpdates
  - relatedMatches
  - matchTournament

Real Data Used:
  - Community consensus (computed from predictions table) ✅

Status: ⚠️ 30% real, 70% mocked
Issues:
  - Match details entirely static
  - No ability to load different matches
  - Comments use mock data instead of DB
```

#### Predictions Page (`/predictions`)
```
Mocked Data Used:
  - None (all real data)

Real Data Used:
  - getMatches() ✅ (but matches empty)
  - getPredictions() ✅
  - getUsers() ✅
  - Match predictions (computed) ✅
  - Community consensus (computed) ✅
  - User intel scores ✅

Status: ⚠️ 90% real, 10% mocked (predictions work, matches are empty)
Issues:
  - Matches table is empty (no data to predict on)
  - Works correctly when matches exist
```

#### Leaderboard Page (`/leaderboard`)
```
Mocked Data Used:
  - None

Real Data Used:
  - getLeaderboard() ✅
  - getPredictions() ✅
  - Computed accuracy, streak, scores ✅

Status: ✅ 100% real data
Issues:
  - Queries all users on every load (should paginate)
  - Could cache results
```

#### Rankings Page (`/rankings`)
```
Mocked Data Used:
  - rankingTeams (all rankings)
  - rankingMovers (movement data)
  - rankingUpcoming (upcoming matches)

Real Data Used:
  - None

Status: ❌ 0% real, 100% mocked
Issues:
  - Completely mocked
  - Teams table exists but is empty
  - No computation of rankings
```

#### Community Page (`/community`)
```
Mocked Data Used:
  - communityStats (member counts)
  - communityDiscussions (trending discussions)
  - communityCategories (categories)
  - communityPosts (posts)
  - topContributors (contributors)
  - communityTags (tags)
  - trendingMatches (trending)
  - newestMembers (new users)

Real Data Used:
  - None

Status: ❌ 0% real, 100% mocked
Issues:
  - All data mocked despite tables existing in DB
  - No integration with community_discussions, community_posts tables
  - Pages display hardcoded mock data
```

#### Blog Page (`/blog`)
```
Mocked Data Used:
  - blogPosts (all articles)

Real Data Used:
  - None

Status: ❌ 0% real, 100% mocked
Issues:
  - blog_posts table exists but unused
  - No blog creation UI
  - All articles hardcoded
```

#### Admin Page (`/admin`)
```
Mocked Data Used:
  - adminStats
  - quickActions
  - adminActivities
  - adminBlogPosts
  - adminIntelPosts
  - adminDiscussions
  - reportItems
  - adminMatches
  - analyticsData
  - adminNotes
  - platformStatus
  - recentAlerts

Real Data Used:
  - getAllPredictions() ✅ (predictions table)
  - getUsersWithStats() ✅ (users + predictions)
  - setMatchResult() ✅ (manual test)
  - recalculateAllIntelScores() ✅ (manual test)

Status: ⚠️ 30% real, 70% mocked
Issues:
  - Dashboard stats all mocked
  - No actual admin features working
  - Match management UI exists but no create/update APIs
```

#### Profile Page (`/profile`)
```
Mocked Data Used:
  - None

Real Data Used:
  - useUser() hook ✅ (auth status)
  - getPredictions() ✅ (user's predictions)
  - calculateIntelScore() ✅ (computed score)
  - Accuracy calculation ✅
  - Streak calculation ✅

Status: ✅ 100% real data
Issues:
  - Requires user to be logged in (no test user data)
  - Only shows for authenticated user
```

### Data Consistency Issues

#### Issue 1: Match Data Inconsistency
- Homepage shows mock matches (FaZe vs NAVI)
- Predictions page shows empty matches from DB
- Match Hub always shows static FaZe vs NAVI
- **Impact:** Users can't predict on real matches

#### Issue 2: User Data Consistency
- Leaderboard shows real users (from DB)
- Community page shows mock users (from lib/data.ts)
- **Impact:** Same user might appear with different stats

#### Issue 3: Team Data Inconsistency
- Rankings page shows mock teams
- Matches use hardcoded team names (strings)
- Teams table exists but is empty
- **Impact:** No single source of truth for teams

#### Issue 4: Community Data Inconsistency
- Community page shows mock discussions/posts
- community_discussions and community_posts tables exist but are empty
- No way to add real discussions
- **Impact:** Community section is completely static

### Component Data Props

**Well-Designed Components** (type-safe props):
- `MatchCard` - accepts Match object, displays cleanly
- `RankingItem` - accepts RankingTeam object
- `LeaderboardUser` - accepts LeaderboardUser object
- `MatchHeader` - accepts Match object

**Problematic Components** (hardcoded or unclear props):
- `FeaturedMatch` - uses static featured match
- `Hero` - hardcoded text and emojis
- `Header` - navigation hardcoded (no dynamic user state)
- `CommunityActivityItem` - displays mock data

### Where Data Transformation Happens

**In Components:**
- Match consensus percentage calculated in prediction components
- Intel score displayed but calculated in API layer
- Accuracy % calculated in profile page

**In API Layer:**
- `calculateIntelScore()` - applies scoring formula
- `getLeaderboard()` - ranks users by score
- `getMatches()` - aggregates prediction percentages

**Not Happening (Issues):**
- No data validation on input
- No data normalization
- Duplicated calculations in multiple places
- No caching of expensive computations

---

## 🎮 SYSTEM STATE ASSESSMENT

### Completeness Scoring (0-100)

| Component | Score | Status | Notes |
|-----------|-------|--------|-------|
| **Database** | 70 | 🟡 Partial | Schema complete (15 tables), data empty for content tables |
| **Authentication** | 95 | ✅ Strong | Supabase Auth working, profile creation on signup |
| **Core Predictions** | 85 | ✅ Strong | Functional, scoring works, leaderboard computes |
| **Match Management** | 30 | ❌ Weak | Tables exist, no admin APIs, no data source |
| **Team/Tournament Data** | 10 | ❌ Weak | Tables exist, completely empty |
| **Community Features** | 5 | ❌ Broken | Tables exist, zero data/integration |
| **Content (Blog/Intel)** | 5 | ❌ Broken | Tables exist, all mocked |
| **Frontend UI/UX** | 85 | ✅ Strong | Beautiful design, responsive, all pages built |
| **Real-Time Features** | 0 | ❌ Missing | No WebSocket, polling, or real-time updates |
| **Admin Panel** | 40 | ⚠️ Weak | UI exists, limited functionality |
| **API Error Handling** | 50 | ⚠️ Weak | Returns empty arrays on error, no validation |
| **Performance Optimization** | 40 | ⚠️ Weak | No caching, no pagination, N+1 queries |

**Overall System Completeness: 45%**

### What's Working

✅ **Fully Functional:**
- User authentication (signup, login, logout)
- Prediction submission and tracking
- Leaderboard calculation and display
- Prediction accuracy calculation
- User intel score system
- Admin access control
- User profile pages
- Responsive UI design

✅ **Partially Functional:**
- Match predictions (functional if matches exist)
- Prediction history (works but no match details)
- Comments system (API ready, UI uses mock data)
- Admin dashboard (UI complete, limited functionality)

### What's Partially Working

⚠️ **Broken/Incomplete:**
- Match display (uses empty DB instead of mock)
- Team rankings (all mocked, no real data)
- Community features (tables exist, no data/integration)
- Blog system (tables exist, no integration)
- Intel posts (tables exist, no integration)
- Activity feed (table exists, not queried)
- Match management (UI exists, no APIs)

### What's Broken

❌ **Non-Functional:**
- Real match data source (critical blocker)
- Team data seeding (no admin UI, no API)
- Tournament management (no admin UI, no API)
- Community discussions creation (no UI, no API)
- Blog/Intel post publishing (no UI, no API)
- Real-time features (WebSocket, notifications)
- Analytics/reports (no real data)
- Search functionality (not implemented)

### What's Mocked

🎭 **Pure Mock Data (lib/data.ts):**
- 30+ datasets in lib/data.ts
- Matches (homepage, rankings page)
- Team rankings
- Community discussions and posts
- Blog articles
- Intel posts
- Admin statistics
- Activity feed

---

## 🔗 DEPENDENCY GRAPH

### Core Dependencies

```
auth.users (Supabase)
    ↓
    └─→ users table (profiles, intel_score, is_admin)
            ↓
            ├─→ predictions
            │   ├─→ matches (match_id FK)
            │   ├─→ match_predictions_aggregate (via trigger)
            │   └─→ leaderboard (calculated)
            │
            ├─→ comments
            │   └─→ matches (match_id FK)
            │
            ├─→ intel_posts (author_id FK)
            │   └─→ matches (match_id FK, optional)
            │
            ├─→ blog_posts (author_id FK)
            │
            ├─→ community_discussions (author_id FK)
            │   ├─→ community_categories (category_id FK)
            │   ├─→ matches (match_id FK, optional)
            │   └─→ community_posts (discussion_id FK)
            │       └─→ users (author_id FK)
            │
            ├─→ activity_feed (user_id FK)
            │   └─→ Denormalised (subject_id, subject_type)
            │
            └─→ user_stats_snapshots (user_id FK)
```

### Feature Dependencies

```
Predictions Feature:
  users → predictions → matches → match_predictions_aggregate
  
Leaderboard Feature:
  users → predictions (filter by result) → calculateIntelScore()
  
Match Hub Feature:
  matches → predictions (aggregated) → comments
  
Community Feature:
  users → community_discussions → community_posts → community_categories
  
Rankings Feature:
  teams (empty) → matches → predictions → Ranking calculation
  
Blog Feature:
  users → blog_posts
  
Intel Posts Feature:
  users → intel_posts → matches
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ External Systems (Need to Implement)             │
│ - Match data source (API, manual, automation)    │
│ - Team information                               │
│ - Tournament schedules                           │
└─────────────────────┬───────────────────────────┘
                      │ (Insert via Admin APIs)
                      ↓
┌─────────────────────────────────────────────────┐
│ Database (PostgreSQL via Supabase)              │
├─────────────────────────────────────────────────┤
│ Core Tables:                  Extended Tables:  │
│ - users                       - teams           │
│ - matches ✅ Active           - tournaments     │
│ - predictions ✅ Active       - intel_posts     │
│ - comments ✅ Active          - blog_posts      │
│ - match_predictions_aggregate - community_*    │
│                                - activity_feed │
│                                - user_stats_*  │
└─────────────────────┬───────────────────────────┘
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
   ┌────────┐   ┌──────────┐   ┌────────┐
   │ API    │   │ Real-time│   │ Cache  │
   │ Layer  │   │ (WS)     │   │ Layer  │
   │(Index) │   │(TODO)    │   │(TODO)  │
   └────────┘   └──────────┘   └────────┘
       │              │              │
       └──────────────┼──────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ Next.js Frontend (Client/Server Components)     │
├─────────────────────────────────────────────────┤
│ Pages:                Components:               │
│ / (Home)              - MatchCard               │
│ /matches              - Leaderboard             │
│ /predictions ✅ Real  - CommunityDiscussion     │
│ /leaderboard ✅ Real  - IntelPostCard           │
│ /rankings (Mocked)    - Header/Footer           │
│ /community (Mocked)   - HeroSection             │
│ /blog (Mocked)        - And 15+ more...         │
│ /admin (Partial)                                │
│ /profile ✅ Real                                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ User Browser                                     │
└─────────────────────────────────────────────────┘
```

---

## 🚨 CRITICAL ISSUES SUMMARY

### 🔴 CRITICAL (Blocks Production)

**1. No Real Match Data Source**
- **Problem:** getMatches() returns empty array from DB; homepage shows mock matches
- **Impact:** Users can't make predictions on real matches; system looks broken
- **Fix:** Create one of:
  - Admin API to add matches manually
  - HLTV/ESL API integration
  - Match import script
- **Effort:** 2-3 days
- **Dependencies:** None (blocker for launch)

**2. No Match Details in Database**
- **Problem:** matches table only has team names (strings), no players/stats/maps
- **Problem:** matches.team1/team2 should reference teams.id (FKs missing)
- **Impact:** Can't show detailed match analysis; breach of referential integrity
- **Fix:** 
  - Add team1_id, team2_id FK columns
  - Create teams seeding script
  - Extend matches schema for maps, stats
- **Effort:** 1-2 days
- **Dependencies:** Teams table seeding

**3. Mismatch Between Mocked UI and Real Data**
- **Problem:** Many pages (rankings, community) show mock data in UI despite real DB tables
- **Impact:** Users see inconsistent data; features appear to work then break
- **Fix:** Replace mock data with real DB queries in all pages
- **Effort:** 3-4 days (20+ mock datasets)
- **Dependencies:** Real data in DB

**4. No Admin APIs for Match/Team/Tournament Management**
- **Problem:** Database tables exist but no UI/API to populate them
- **Problem:** Can't add teams, tournaments, or matches
- **Impact:** System can't operate without manual DB access
- **Fix:** Create admin endpoints:
  - POST /api/matches
  - POST /api/teams
  - POST /api/tournaments
- **Effort:** 2-3 days
- **Dependencies:** None (implement now)

### 🟠 HIGH (Should Fix Before Launch)

**5. Database Schema Issues**

- **matches.team1/team2 are TEXT, should reference teams.id**
  - Fix: Add team1_id, team2_id UUIDs with FKs
  - Data migration required for existing records
  
- **matches missing map information**
  - Fix: Add maps table + match_maps junction table
  
- **matches missing player/squad data**
  - Fix: Add players table + squad table + match_squads table
  
- **Denormalised counts not auto-updating**
  - discussions.reply_count stays at 0
  - Fix: Add triggers for updates

**6. No Pagination on Large Result Sets**
- **Problem:** `getUsers()`, `getPredictions()` return all rows
- **Impact:** Breaks with 1000+ users; memory overflow
- **Fix:** Add limit/offset parameters to all query functions
- **Effort:** 1 day

**7. Performance Issues with Leaderboard Calculation**
- **Problem:** `getLeaderboard()` calculates full leaderboard on every call
- **Impact:** /leaderboard page loads slowly, O(n*m) complexity
- **Fix:** 
  - Cache results for 5-10 minutes
  - Post-launch: Use user_stats_snapshots table for daily snapshots
- **Effort:** 1 day (caching), 2 days (snapshot system)

**8. No Validation on Mutations**
- **Problem:** `submitPrediction()` doesn't validate:
  - Match exists
  - Match is upcoming (not live/completed)
  - Confidence is in valid range
- **Fix:** Add explicit validation with error throwing
- **Effort:** 1 day

**9. Community Features Entirely Disconnected**
- **Problem:** 
  - community_discussions, community_posts tables exist
  - Pages show only mock data
  - No UI to create discussions/posts
  - No API endpoints
- **Fix:**
  - Create discussion creation API/UI
  - Create post creation API/UI
  - Replace mock data with real queries
- **Effort:** 4-5 days

**10. Blog/Intel Post System Non-Functional**
- **Problem:**
  - blog_posts, intel_posts tables exist
  - Pages show only mock data
  - No UI to publish articles
  - No API endpoints
- **Fix:**
  - Create publish UI (forms)
  - Create edit/publish APIs
  - Connect pages to real DB queries
- **Effort:** 3-4 days

### 🟡 MEDIUM (Should Fix Soon)

**11. Error Handling and Validation**
- No validation on API inputs
- Functions return empty arrays on error (hide issues)
- No error boundaries in UI
- Fix: Add input validation, throw errors, handle in UI

**12. Missing Admin Features**
- Can't actually create/edit matches
- Can't ban users or moderate content
- Can't see system health/analytics
- Fix: Implement admin endpoints and UI

**13. No Real-Time Features**
- No WebSocket connection
- No live match updates
- No notifications
- Fix: Implement Socket.io or similar post-launch

**14. No Search Functionality**
- Can't search matches, teams, posts, etc.
- Fix: Add full-text search with PostgreSQL FTS

**15. No User Following/Favorites**
- Can't follow users or teams
- No saved predictions feature
- Fix: Add follows table + favorites table

### 🔵 LOW (Nice to Have)

**16. Analytics/Reporting**
- No actual analytics in admin panel
- All stats are mocked
- Fix: Implement real analytics queries

**17. Notifications**
- No notification system
- Fix: Add notifications table + WebSocket push

**18. User Preferences**
- No way to change theme, language, settings
- Fix: Add user_preferences table

---

## 📈 BUILD COMPLETION ROADMAP

### Pre-MVP Checklist (Must Do Before Any Launch)

#### ✅ Already Complete
- [x] Database schema with 15 tables
- [x] User authentication system
- [x] Prediction submission and scoring
- [x] Leaderboard calculation
- [x] Frontend UI (all pages built)
- [x] RLS policies on tables

#### ⚠️ Critical Path (Must Complete)
- [ ] Real match data source (API, manual, automation)
- [ ] Teams table seeding with ~20 major teams
- [ ] Match creation admin API
- [ ] Validation on prediction submission (match exists, upcoming)
- [ ] Replace mock matches with real DB queries on all pages
- [ ] Replace mock teams/rankings with real data

#### 🟡 Pre-Launch (Should Have)
- [ ] Community post creation UI/API
- [ ] Discussion creation UI/API
- [ ] Blog article publishing UI/API
- [ ] Intel post creation UI/API
- [ ] Pagination on leaderboard/user lists
- [ ] Error handling and validation on mutations
- [ ] Admin panel functional (full CRUD for matches/teams/tournaments)

---

### Phase 1: Fix Core Database Integrity (Days 1-2)
**Goal:** Make system functional for predictions on real matches

**Tasks:**
1. Add team1_id, team2_id FK columns to matches table
2. Create teams seeding script (~20 major CS2 teams)
3. Create tournaments seeding script (~5 major tournaments)
4. Create migration to populate team IDs in existing matches
5. Update getMatches() to join with teams table
6. Update MatchCard component to use team IDs/objects instead of strings

**Deliverables:**
- Teams table fully populated
- Matches table using proper FKs
- getMatches() returns team objects

**Effort:** 2 days  
**Blockers:** None

---

### Phase 2: Real Match Data & Admin APIs (Days 3-5)
**Goal:** System can add real matches and let users predict

**Tasks:**
1. Create POST /api/admin/matches (create match)
2. Create PUT /api/admin/matches/:id (update match)
3. Create DELETE /api/admin/matches/:id (delete match)
4. Create admin UI for match management
5. Add match validation (team exists, tournament exists, time valid)
6. Create script to import matches from HLTV or ESL API (optional)
7. Seed 10 upcoming matches manually
8. Test prediction submission on real matches
9. Test leaderboard calculation

**Deliverables:**
- Admin can add/edit/delete matches
- 10+ matches available in system
- Predictions work on real matches
- Leaderboard shows real data

**Effort:** 3 days  
**Blockers:** Teams table (Phase 1)

---

### Phase 3: Replace All Mock Data (Days 6-8)
**Goal:** All pages show real data from database

**Tasks:**
1. Replace mock matches on homepage with getMatches()
2. Replace mock rankings with real team rating calculation
3. Replace mock community discussions with community_discussions table queries
4. Replace mock blog posts with blog_posts table queries
5. Replace mock intel posts with intel_posts table queries
6. Replace mock community categories with real categories (hardcoded or DB)
7. Test all pages with real data
8. Remove all mocked data from lib/data.ts that's been replaced

**Deliverables:**
- All pages use real data from DB
- 0 mock data for core features
- lib/data.ts used only for static content (categories, constants)

**Effort:** 2 days  
**Blockers:** Phase 2

---

### Phase 4: Community Features (Days 9-11)
**Goal:** Users can create discussions and posts

**Tasks:**
1. Create POST /api/community/discussions (create discussion)
2. Create POST /api/community/discussions/:id/posts (create post)
3. Create PUT /api/community/posts/:id (edit post)
4. Create DELETE /api/community/posts/:id (delete post)
5. Create POST /api/community/posts/:id/upvote (upvote post)
6. Create discussion creation UI (modal/form)
7. Create post creation UI (inline form)
8. Add upvote/downvote UI
9. Add moderation UI (flag, ban user)
10. Test full discussion flow

**Deliverables:**
- Users can create discussions
- Users can post in discussions
- Users can upvote/downvote
- Moderators can flag content

**Effort:** 3 days  
**Blockers:** Phase 2

---

### Phase 5: Content Publishing (Days 12-13)
**Goal:** Users can publish blog articles and intel posts

**Tasks:**
1. Create POST /api/blog (publish blog post)
2. Create PUT /api/blog/:id (edit blog post)
3. Create DELETE /api/blog/:id (delete blog post)
4. Create POST /api/intel (publish intel post)
5. Create PUT /api/intel/:id (edit intel post)
6. Create DELETE /api/intel/:id (delete intel post)
7. Create blog publishing UI (rich text editor)
8. Create intel posting UI (form)
9. Add draft/published status UI
10. Add featured article UI (admin only)

**Deliverables:**
- Users can publish blog articles
- Users can post intel updates
- Editors can draft and publish
- Admins can feature content

**Effort:** 2 days  
**Blockers:** Phase 2

---

### Phase 6: Admin Panel & Moderation (Days 14-16)
**Goal:** Admins have full system control

**Tasks:**
1. Implement user management (view, ban, role assignment)
2. Implement content moderation (flag, delete, restore)
3. Implement match result setting (admin can set who won)
4. Implement prediction evaluation (auto-grade when result set)
5. Implement analytics dashboard (real stats, not mock)
6. Implement system health monitoring
7. Implement audit logs
8. Create admin role assignment UI
9. Test admin functions
10. Document admin procedures

**Deliverables:**
- Admin can fully manage system
- Moderation tools functional
- Analytics dashboard real
- Audit trail for all actions

**Effort:** 3 days  
**Blockers:** Phase 2, 4, 5

---

### Phase 7: Error Handling & Validation (Days 17-18)
**Goal:** System handles errors gracefully

**Tasks:**
1. Add input validation to all mutation functions
2. Add error boundaries to all pages
3. Add proper error messages to UI
4. Add error logging/tracking
5. Add 404 pages
6. Add loading states
7. Test error scenarios
8. Document error handling strategy

**Deliverables:**
- All validation enforced
- Clear error messages
- No silent failures
- Error tracking in place

**Effort:** 2 days  
**Blockers:** All prior phases

---

### Phase 8: Performance & Optimization (Days 19-20)
**Goal:** System is fast and scalable

**Tasks:**
1. Add pagination to all list endpoints
2. Implement caching for leaderboard
3. Optimize N+1 queries
4. Add database indexes where missing
5. Implement request memoization in React
6. Load test with 1000+ users
7. Profile slow queries
8. Document performance guidelines

**Deliverables:**
- Pagination on all lists
- Leaderboard caches
- <500ms response times
- Load test passing

**Effort:** 2 days  
**Blockers:** Phase 7

---

### Phase 9: Testing & QA (Days 21-25)
**Goal:** System is reliable and production-ready

**Tasks:**
1. Write unit tests for API functions
2. Write integration tests for user flows
3. Write E2E tests with Playwright
4. Manual QA testing (all features)
5. Security audit (SQL injection, XSS, CSRF)
6. Load testing
7. Browser compatibility testing
8. Mobile testing
9. Fix bugs found in testing
10. Create test documentation

**Deliverables:**
- >80% code coverage
- All critical flows tested
- Security audit passed
- 0 known bugs

**Effort:** 5 days  
**Blockers:** Phase 8

---

### Phase 10: Documentation & Deployment (Days 26-28)
**Goal:** System documented and ready to deploy

**Tasks:**
1. Write system architecture docs
2. Write API documentation
3. Write deployment guide
4. Write admin guide
5. Write user guide
6. Create video tutorials
7. Set up monitoring/logging
8. Deploy to staging
9. Deploy to production
10. Create runbook for common issues

**Deliverables:**
- Architecture docs
- API docs
- Deployment guide
- Runbooks

**Effort:** 3 days  
**Blockers:** Phase 9

---

## 📊 Effort Estimates by Phase

| Phase | Duration | Effort (Dev Days) | Blocker | Status |
|-------|----------|-------------------|---------|--------|
| 1 | Days 1-2 | 2 | None | 🟢 Ready |
| 2 | Days 3-5 | 3 | Phase 1 | 🟢 Ready |
| 3 | Days 6-8 | 2 | Phase 2 | 🟢 Ready |
| 4 | Days 9-11 | 3 | Phase 2 | 🟡 Optional |
| 5 | Days 12-13 | 2 | Phase 2 | 🟡 Optional |
| 6 | Days 14-16 | 3 | Phase 2,4,5 | 🟡 Optional |
| 7 | Days 17-18 | 2 | Phase 6 | 🟢 Ready |
| 8 | Days 19-20 | 2 | Phase 7 | 🟡 Optional |
| 9 | Days 21-25 | 5 | Phase 8 | 🟢 Ready |
| 10 | Days 26-28 | 3 | Phase 9 | 🟢 Ready |
| **TOTAL** | **28 Days** | **27 Dev Days** | | |

**With one developer:** ~28 days → 6-8 weeks with other work  
**With two developers:** ~14 days → 3-4 weeks  
**With three developers:** ~10 days → 2-3 weeks

---

## 🎯 WHAT SHOULD BE BUILT FIRST TOMORROW

### 1. CRITICAL PATH (Do First)
```
Week 1 Priority:
  ☐ Day 1: Add team1_id, team2_id FKs to matches table
  ☐ Day 1: Seed teams table with ~20 major CS2 teams  
  ☐ Day 2: Create admin API endpoints (matches CRUD)
  ☐ Day 2: Seed 10+ matches manually
  ☐ Day 3: Update getMatches() to use real teams
  ☐ Day 3: Test prediction submission works
  ☐ Day 4: Replace homepage mock matches with real data
  ☐ Day 4: Test leaderboard with real predictions
  ☐ Day 5: Replace rankings page mock data
```

### 2. QUICK WINS (Parallel)
```
  ☐ Add validation to submitPrediction()
  ☐ Add error handling to API functions
  ☐ Add pagination to getUsers()
  ☐ Fix RLS policies on tables
  ☐ Remove unused mocked data from lib/data.ts
```

### 3. COMMUNICATION
```
  ☐ Document database schema (in progress ✅)
  ☐ Create admin guide for match management
  ☐ Set up monitoring/logging
  ☐ Create deployment checklist
```

---

## ✅ FINAL ASSESSMENT

### Is This System Production Ready?

### **NO** ❌

**Why:**
1. No real match data (critical blocker)
2. No match management admin APIs
3. 70% of pages use mocked data
4. No community features functional
5. No content publishing system
6. Missing data validation
7. Schema issues (missing FKs)
8. No error handling

### Shortest Path to Production

**Minimum Viable Launch (Do This First):**

Week 1:
- [ ] Fix database schema (team FKs)
- [ ] Seed teams and tournaments
- [ ] Create admin match CRUD APIs
- [ ] Add 10+ real matches
- [ ] Validation on mutations
- [ ] Replace mock matches with real queries

Week 2:
- [ ] Error handling and validation
- [ ] Community post creation (basic)
- [ ] Blog post publishing (basic)
- [ ] Pagination on lists
- [ ] Admin panel functional

Week 3:
- [ ] Full testing and QA
- [ ] Documentation
- [ ] Deploy to staging
- [ ] Security audit

**Realistic production launch:** 3-4 weeks with 1-2 developers

### What Must Be Completed for Day 1 of Operation

```
BEFORE USERS CAN ACCESS:

1. ✅ Database schema (DONE)
2. ✅ Authentication system (DONE)
3. ✅ Prediction system (DONE)
4. ⚠️ Match data (NEED TO POPULATE)
5. ✅ Leaderboard (DONE)
6. ❌ Admin panel (NEEDS WORK)
7. ❌ Community features (NEEDS IMPLEMENTATION)
8. ❌ Content publishing (NEEDS IMPLEMENTATION)
9. ✅ User profiles (DONE)
10. ❌ Error handling (NEEDS IMPLEMENTATION)
```

---

## 📚 APPENDIX

### File Structure Reference

```
CS Intel/
├── app/
│   ├── page.tsx                 (Homepage - shows mock matches)
│   ├── layout.tsx               (Root layout)
│   ├── globals.css              (Tailwind styles)
│   ├── (pages)/
│   │   ├── matches/page.tsx      (Match details - partially mocked)
│   │   ├── predictions/page.tsx  (Predictions - real data)
│   │   ├── leaderboard/page.tsx  (Leaderboard - real data)
│   │   ├── rankings/page.tsx     (Rankings - mocked)
│   │   ├── community/page.tsx    (Community - mocked)
│   │   ├── blog/page.tsx         (Blog - mocked)
│   │   ├── admin/page.tsx        (Admin panel - partial)
│   │   ├── profile/page.tsx      (User profile - real data)
│   │   └── (auth pages, info pages, etc.)
│   
├── components/
│   ├── Header.tsx               (Navigation)
│   ├── Footer.tsx               (Footer)
│   ├── Hero.tsx                 (Hero section)
│   ├── MatchCard.tsx            (Match card component)
│   ├── FeaturedMatch.tsx        (Featured match)
│   ├── IntelPostCard.tsx        (News card)
│   ├── CommunityX.tsx           (15+ community components)
│   └── (other components)
│   
├── lib/
│   ├── api/
│   │   └── index.ts             (API layer - 20+ functions)
│   ├── auth/
│   │   ├── useUser.ts           (Auth hook)
│   │   └── supabaseAuth.ts      (Supabase setup)
│   ├── data.ts                  (Mock data - 800+ lines)
│   ├── types.ts                 (TypeScript types - 150+ interfaces)
│   └── supabase.ts              (Supabase client setup)
│
├── migrations/
│   ├── 01-07_*.sql              (Core schema)
│   ├── 08_fix_user_profile_system.sql (User setup)
│   ├── 09_create_teams.sql      (Teams table)
│   ├── 10_create_tournaments.sql (Tournaments table)
│   ├── 11_create_intel_posts.sql (Intel posts)
│   ├── 12_create_blog_posts.sql (Blog posts)
│   ├── 13-15_community_*.sql    (Community tables)
│   ├── 16_create_activity_feed.sql (Activity)
│   ├── 17_create_user_stats_snapshots.sql (Stats)
│   └── 18_create_match_predictions_aggregate.sql (Aggregates)
│
├── package.json                 (Dependencies)
├── tsconfig.json                (TypeScript config)
├── tailwind.config.ts           (Tailwind config)
├── next.config.js               (Next.js config)
└── README.md                    (Project overview)
```

### Key Types (from lib/types.ts)

```typescript
// Core types
interface Match { id, team1, team2, team1Players, team2Players, time, tournament, ... }
interface Prediction { id, user_id, match_id, prediction, confidence, result, ... }
interface User { id, username, avatar, intel_score }
interface IntelPost { id, title, category, timestamp, comments }
interface BlogPost { id, title, category, preview, date, readTime, featured, views }
interface CommunityDiscussion { id, title, replies, views, upvotes, lastActivity }
interface CommunityPost { id, username, avatar, title, preview, category, ... }

// Computed types
interface LeaderboardUser { rank, username, intelScore, accuracy, predictions, ... }
interface CommunityConsensus { team1, team2, percentage, confidence, totalPredictions }
interface TopPredictor { username, avatar, accuracy, predictions, streak }

// Admin types
interface AdminStat { label, value, icon, change, trend }
interface AdminMatch { id, team1, team2, status, result, predictions, ... }
interface ReportItem { id, type, content, author, flaggedAt, status }
```

### API Functions Quick Reference

```typescript
// Data Fetching
getMatches() → Match[]
getPredictions() → Prediction[]
getUsers() → User[]
getComments() → Comment[]
getLeaderboard() → LeaderboardEntry[]
getMatchPredictions(matchId) → Prediction[]
getAllPredictions(filters) → Prediction[]
getUsersWithStats() → UserWithStats[]
getMatchAccuracyStats(matchId) → { total, correct, accuracy }

// Mutations
submitPrediction(matchId, prediction, confidence) → { success, error? }
setMatchResult(matchId, result) → { success, error? }
evaluatePredictions(matchId) → void
recalculateAllIntelScores() → { success, updated, error? }

// Utilities
calculateIntelScore(predictions) → number
requireAdmin() → boolean
```

---

**End of System Intelligence Document**

---

### 📌 Next Steps for Implementation

1. **Today:** Review this document with team
2. **Tomorrow:** Start Phase 1 (Database schema fixes)
3. **Week 1:** Complete Phases 1-2 (Real matches working)
4. **Week 2:** Complete Phase 3 (Remove all mock data)
5. **Week 3:** Complete Phases 4-5 (Community + content)

---

**Document Version:** 1.0  
**Last Updated:** June 1, 2026  
**Maintainer:** AI System Intelligence Analysis  
**Status:** Ready for Implementation
