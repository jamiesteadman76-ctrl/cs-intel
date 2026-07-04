# CS INTEL — DATABASE REMEDIATION IMPLEMENTATION ROADMAP

**Lead Engineer:** Implementation Phase  
**Date Created:** June 2, 2026  
**Project Stage:** Safe, Staged Implementation  
**Timeline:** 5-6 weeks to full production readiness  
**Risk Level:** MEDIUM (executing on live database)

---

## EXECUTIVE SUMMARY

This is a **staged, production-safe implementation plan** to transform CS Intel from a partially-mocked system to a **fully database-driven platform** without breaking existing functionality.

### What We're Doing
- Executing 18 SQL migrations in 4 safe phases
- Replacing mock data with real database queries (gradual)
- Adding 11 new tables while keeping 4 core tables operational
- Implementing proper foreign keys, RLS policies, and indexes

### What We're Protecting
- ✅ Live user accounts and authentication
- ✅ Existing predictions and leaderboard scores
- ✅ Admin access and role assignments
- ✅ User sessions and data consistency

### Implementation Philosophy
- **Additive, not destructive:** Add new tables before removing mocks
- **Test after each phase:** Verify data integrity at checkpoints
- **Frontend follows database:** Replace mock data only after DB is ready
- **Rollback-ready:** Every migration has explicit rollback steps
- **Zero downtime:** Migrations use `IF NOT EXISTS` and non-blocking operations where possible

---

## PHASE BREAKDOWN

### PHASE 1: FOUNDATIONAL SCHEMA (Weeks 1-2)
**Goal:** Establish core data structures without breaking existing systems

**Migrations:**
- ✅ 01-08: Core schema fixes (already reviewed)
- ✅ 09: Teams table (new)
- ✅ 10: Tournaments table (new)

**Why Phase 1:**
- These migrations are foundational for all other tables
- Teams/Tournaments are referenced by matches, discussions, and posts
- Core schema needs proper indexes/constraints before we add more

**Risks:**
- Low: All migrations use `IF NOT EXISTS`, safe to retry
- Moderate: Adding FK constraints could fail if bad data exists
- Low: No destructive changes

**Effort:** 2-3 hours execution + 4-6 hours testing

**Success Criteria:**
- ✅ All 10 migrations execute without error
- ✅ Teams table has proper structure
- ✅ Tournaments table has proper structure
- ✅ Existing predictions/users/matches unchanged
- ✅ Demo teams/tournaments seeded (100+ teams, 20+ tournaments)

---

### PHASE 2: CONTENT SYSTEMS (Weeks 2-3)
**Goal:** Enable user-generated content (posts, articles)

**Migrations:**
- ✅ 11: Intel posts table (new)
- ✅ 12: Blog posts table (new)

**Why Phase 2:**
- Content systems don't depend on community/discussion tables
- Blog and Intel posts can be independent
- Required for homepage content sections

**Risks:**
- Low: Independent from community tables
- Low: Author FK references existing users table

**Effort:** 1-2 hours execution + 2-3 hours testing

**Success Criteria:**
- ✅ Intel posts table created with proper RLS
- ✅ Blog posts table created with proper RLS
- ✅ Sample posts seeded (20+ intel posts, 10+ blog posts)
- ✅ Admin can publish posts via API

---

### PHASE 3: COMMUNITY SYSTEMS (Weeks 3-4)
**Goal:** Enable community discussions and posts

**Migrations:**
- ✅ 13: Community categories table (new)
- ✅ 14: Community discussions table (new)
- ✅ 15: Community posts table (new)

**Why Phase 3:**
- These tables are interdependent (discussions→categories, posts→discussions)
- Can be implemented together as a subsystem
- Required for community features

**Risks:**
- Moderate: Discussions reference categories (FK dependency)
- Moderate: Posts reference discussions (FK dependency)
- Low: All FKs reference existing tables (discussions→categories→community_categories)

**Effort:** 2-3 hours execution + 3-4 hours testing

**Success Criteria:**
- ✅ All three tables created
- ✅ FK relationships verified
- ✅ Proper indexes on category_id, discussion_id
- ✅ Sample discussions/posts seeded (30+ discussions, 100+ posts)
- ✅ RLS policies allow user creation

---

### PHASE 4: ANALYTICS & OPTIMIZATION (Weeks 4-5)
**Goal:** Add analytics and performance optimization tables

**Migrations:**
- ✅ 16: Activity feed table (new)
- ✅ 17: User stats snapshots table (new)
- ✅ 18: Match predictions aggregate table (new)

**Why Phase 4:**
- These tables are "nice-to-have" for MVP but important for scale
- Activity feed can be built from other tables (not critical)
- User stats snapshots are for analytics/history (optional for launch)
- Match predictions aggregate is performance optimization (optional for launch)

**Risks:**
- Low: All three are independent
- Moderate: Activity feed and stats snapshots require triggers (complex)
- Low: Predictions aggregate has auto-update trigger

**Effort:** 2-3 hours execution + 2-3 hours testing

**Success Criteria:**
- ✅ All three tables created
- ✅ Triggers validated
- ✅ No performance degradation
- ✅ Auto-update triggers working

---

## DETAILED MIGRATION ANALYSIS

### MIGRATION 01-07: CORE SCHEMA FIXES

**Status:** ✅ Already executed (verified in existing schema)

**Summary:**
- Migrations 01-07 add basic constraints to existing tables
- All use `IF NOT EXISTS` for safety
- Include index creation for performance

**Key Indexes Added:**
```
idx_predictions_user_id
idx_predictions_match_id
idx_predictions_result
idx_matches_status
idx_matches_match_time
idx_users_intel_score
idx_comments_match_id
idx_comments_user_id
```

**Validation:**
- ✅ All migrations are idempotent
- ✅ No breaking changes
- ✅ No missing FKs in existing schema
- ⚠️ Foreign key relationships not enforced (planned for Phase 1)

**Rollback:** N/A (already executed)

---

### MIGRATION 08: USER PROFILE SYSTEM

**Status:** ✅ Already executed (verified by RLS policies present)

**Summary:**
- Adds RLS policies for users table
- Creates trigger `handle_new_user()` for auto-profile creation
- Backfills existing auth users

**Key Components:**
```sql
TRIGGER: on_auth_user_created
  FUNCTION: handle_new_user()
  ACTION: Auto-insert to users table on auth signup

RLS Policies:
  - Users can read own profile
  - Users can update own profile
  - Public can read user public data (leaderboard)
```

**Validation:**
- ✅ Trigger is properly idempotent (`ON CONFLICT DO NOTHING`)
- ✅ RLS policies are correctly scoped
- ✅ Backfill uses safe approach (checks for duplicates)

**Rollback:** 
- Drop trigger: `DROP TRIGGER on_auth_user_created ON auth.users`
- Drop function: `DROP FUNCTION handle_new_user()`
- RLS policies: `DROP POLICY` individually

---

### MIGRATION 09: TEAMS TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,  ✅ Good
  slug TEXT NOT NULL UNIQUE,  ✅ Good (for URLs)
  logo TEXT,                  ✅ Nullable (can be emoji or URL)
  country TEXT,               ⚠️ Consider making unique per country later
  ...
)
```

✅ **Indexes:**
- `idx_teams_rating` — Used for rankings display
- `idx_teams_win_rate` — Used for sorting
- `idx_teams_name` — Used for search/lookup

✅ **RLS Policies:**
- Public read (leaderboard display)
- Admin write only (data integrity)

✅ **Idempotency:** `IF NOT EXISTS` makes it safe to retry

⚠️ **Considerations:**
- No FK from matches.team1/team2 yet (will add in future migration)
- No cascade deletes (teams are immutable once created)
- Missing: active/inactive status (add post-launch if needed)

**Rollback:**
```sql
DROP TABLE IF EXISTS teams CASCADE;
DROP INDEX IF EXISTS idx_teams_rating;
DROP INDEX IF EXISTS idx_teams_win_rate;
DROP INDEX IF EXISTS idx_teams_name;
```

**Execution Order:** First in Phase 1 (before tournaments and matches)

---

### MIGRATION 10: TOURNAMENTS TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,  ✅ Good
  slug TEXT NOT NULL UNIQUE,  ✅ Good
  description TEXT,           ✅ Optional
  prize_pool TEXT,            ✅ For display
  start_date TIMESTAMPTZ,     ✅ Can be NULL (no start yet)
  end_date TIMESTAMPTZ,       ✅ Can be NULL (ongoing)
  status TEXT DEFAULT 'upcoming'  ✅ Good enum
  ...
)
```

✅ **Indexes:**
- `idx_tournaments_start_date` — Used for sorting upcoming tournaments
- `idx_tournaments_status` — Used for filtering
- `idx_tournaments_featured` — Used for homepage

✅ **RLS Policies:**
- Public read (display)
- Admin write (management)

✅ **Idempotency:** `IF NOT EXISTS` makes it safe

⚠️ **Considerations:**
- No FK from matches.tournament_id yet (will add later)
- `match_count` and `team_count` are denormalised (needs triggers post-launch)

**Rollback:**
```sql
DROP TABLE IF EXISTS tournaments CASCADE;
DROP INDEX IF EXISTS idx_tournaments_start_date;
DROP INDEX IF EXISTS idx_tournaments_status;
DROP INDEX IF EXISTS idx_tournaments_featured;
DROP INDEX IF EXISTS idx_tournaments_name;
```

**Execution Order:** After teams (no dependency on teams, but logical)

---

### MIGRATION 11: INTEL POSTS TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS intel_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  ✅ Good FK
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (...))  ✅ Enum check
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,  ✅ Optional link
  ...
)
```

✅ **FK Dependencies:**
- `author_id` → users(id) ✅ Existing table
- `match_id` → matches(id) ✅ Existing table

✅ **Indexes:**
- Proper filtering indexes on author, featured, published, category
- Created_at DESC for sorting

✅ **RLS Policies:**
- Read: Published OR author OR admin ✅ Correct
- Create: Author must be self ✅ Correct
- Update: Author or admin ✅ Correct

✅ **Idempotency:** Safe to retry

⚠️ **Considerations:**
- Cascade delete on user (if user deleted, posts deleted) — OK for now
- Views count is denormalised (add trigger later if needed)

**Rollback:**
```sql
DROP TABLE IF EXISTS intel_posts CASCADE;
DROP INDEX IF EXISTS idx_intel_posts_author_id;
DROP INDEX IF EXISTS idx_intel_posts_featured;
DROP INDEX IF EXISTS idx_intel_posts_published;
-- ... drop all indexes
```

**Execution Order:** After Phase 1 (depends on users table existing)

---

### MIGRATION 12: BLOG POSTS TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  ✅ Good
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preview TEXT,  ✅ Optional preview
  slug TEXT UNIQUE,  ✅ Good for URLs
  category TEXT CHECK (category IN (...))  ✅ Enum
  published BOOLEAN DEFAULT FALSE,  ✅ Allows drafts
  featured BOOLEAN DEFAULT FALSE,  ✅ Homepage feature
  published_at TIMESTAMPTZ,  ✅ Track publication time
  ...
)
```

✅ **FK Dependencies:**
- `author_id` → users(id) ✅ Existing

✅ **Indexes:**
- `idx_blog_posts_author_id` — For user's blog list
- `idx_blog_posts_published` (WHERE published=true) — For public list
- `idx_blog_posts_featured` (WHERE featured=true) — For homepage
- `idx_blog_posts_slug` — For URL lookup
- `idx_blog_posts_created_at` (DESC) — For sorting

✅ **RLS Policies:**
- Read: Published OR author OR admin ✅ Draft support
- Create: Author is self ✅ Correct
- Publish: Author or admin ✅ Allows drafts

✅ **Idempotency:** Safe

⚠️ **Considerations:**
- `read_time` is computed (can be NULL if not calculated)
- `published_at` is only set when published=true (handle in trigger)
- Views count is denormalised (optional trigger later)

**Rollback:**
```sql
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP INDEX IF EXISTS idx_blog_posts_author_id;
DROP INDEX IF EXISTS idx_blog_posts_published;
DROP INDEX IF EXISTS idx_blog_posts_featured;
DROP INDEX IF EXISTS idx_blog_posts_slug;
DROP INDEX IF EXISTS idx_blog_posts_created_at;
```

**Execution Order:** After intel_posts (parallel table, both content-related)

---

### MIGRATION 13: COMMUNITY CATEGORIES TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,  ✅ Good
  slug TEXT NOT NULL UNIQUE,  ✅ Good for URLs
  description TEXT,
  icon TEXT,  ✅ Emoji or URL
  discussion_count INTEGER DEFAULT 0,  ⚠️ Denormalised
  ...
)
```

✅ **Indexes:**
- `idx_community_categories_name` — For lookup
- `idx_community_categories_slug` — For URL routing

✅ **RLS Policies:**
- Public read ✅ Categories are public
- Admin write only ✅ Data integrity

✅ **Idempotency:** Safe

⚠️ **Considerations:**
- `discussion_count` is denormalised (needs trigger)
- No FK relationships (categories are independent)
- Could be hardcoded in code instead (currently 6 categories)

**Rollback:**
```sql
DROP TABLE IF EXISTS community_categories CASCADE;
DROP INDEX IF EXISTS idx_community_categories_name;
DROP INDEX IF EXISTS idx_community_categories_slug;
```

**Execution Order:** Before discussions (discussions FK to categories)

---

### MIGRATION 14: COMMUNITY DISCUSSIONS TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS community_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES community_categories(id),  ✅ FK required
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,  ✅ Optional
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  ✅ FK
  ...
)
```

✅ **FK Dependencies:**
- `category_id` → community_categories(id) — **MUST execute migration 13 first**
- `match_id` → matches(id) ✅ Existing
- `author_id` → users(id) ✅ Existing

✅ **Indexes:**
- `idx_community_discussions_category_id` — For filtering by category
- `idx_community_discussions_author_id` — For user's discussions
- `idx_community_discussions_status` — For filtering
- `idx_community_discussions_created_at` — For sorting
- `idx_community_discussions_match_id` — For match-related discussions
- `idx_community_discussions_pinned` (WHERE pinned=true) — For featured

✅ **RLS Policies:**
- Read: Non-flagged OR author OR admin ✅ Moderation support
- Create: Author must be self ✅ Correct
- Update: Author or admin ✅ Correct
- Lock: Admin only ✅ Moderation

✅ **Idempotency:** Safe

⚠️ **Considerations:**
- Denormalised counts (reply, view, upvote) — need triggers
- Cascade delete on author (if user deleted, discussions deleted) — OK
- Status enum: active/locked/flagged/closed ✅ Good

**Rollback:**
```sql
DROP TABLE IF EXISTS community_discussions CASCADE;
DROP INDEX IF EXISTS idx_community_discussions_category_id;
DROP INDEX IF EXISTS idx_community_discussions_author_id;
-- ... drop all indexes
```

**Execution Order:** After migration 13 (FK dependency)

---

### MIGRATION 15: COMMUNITY POSTS TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES community_discussions(id) ON DELETE CASCADE,  ✅ FK
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  ✅ FK
  content TEXT NOT NULL CHECK (LENGTH(content) > 0),  ✅ Validation
  ...
)
```

✅ **FK Dependencies:**
- `discussion_id` → community_discussions(id) — **MUST execute migration 14 first**
- `author_id` → users(id) ✅ Existing

✅ **Indexes:**
- `idx_community_posts_discussion_id` — For listing posts in discussion
- `idx_community_posts_author_id` — For user's posts
- `idx_community_posts_created_at` — For sorting
- `idx_community_posts_flagged` (WHERE flagged=true) — For moderation

✅ **RLS Policies:**
- Read: Non-flagged OR author OR admin ✅ Moderation
- Create: Author must be self ✅ Correct
- Update: Author or admin ✅ Correct
- Flag: Admin only ✅ Moderation

✅ **Idempotency:** Safe

⚠️ **Considerations:**
- Cascade delete on discussion (if discussion deleted, posts deleted) ✅ OK
- Denormalised counts (replies, upvotes) — need triggers
- `category` field is semi-denormalised (could query from discussion)

**Rollback:**
```sql
DROP TABLE IF EXISTS community_posts CASCADE;
DROP INDEX IF EXISTS idx_community_posts_discussion_id;
DROP INDEX IF EXISTS idx_community_posts_author_id;
-- ... drop all indexes
```

**Execution Order:** After migration 14 (FK dependency)

---

### MIGRATION 16: ACTIVITY FEED TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  ✅ FK
  activity_type TEXT NOT NULL CHECK (activity_type IN (...))  ✅ Enum
  subject_id UUID,  ✅ Nullable (not always applicable)
  subject_type TEXT,  ⚠️ Should be enum
  ...
)
```

✅ **Indexes:**
- `idx_activity_feed_user_id` — For user's activity
- `idx_activity_feed_created_at` — For sorting
- `idx_activity_feed_activity_type` — For filtering by type
- `idx_activity_feed_user_created` — Combined index for common query

✅ **RLS Policies:**
- Read: Public activity feed ✅ Correct
- Create: Must be own activity ✅ Correct

✅ **Idempotency:** Safe

⚠️ **Considerations:**
- `subject_id` and `subject_type` are intentionally denormalised (no FK to multiple tables)
- Activity feed could be computed from other tables instead (optional table)
- Cascade delete on user ✅ OK

⚠️ **Alternative Approach:**
```
Instead of storing activity_feed, could compute from:
  SELECT 'prediction' as type, id, user_id, created_at FROM predictions
  UNION
  SELECT 'comment' as type, id, user_id, created_at FROM comments
  UNION
  ...
```
Decision: For MVP, store in table for simplicity; optimize post-launch if needed.

**Rollback:**
```sql
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP INDEX IF EXISTS idx_activity_feed_user_id;
DROP INDEX IF EXISTS idx_activity_feed_created_at;
DROP INDEX IF EXISTS idx_activity_feed_activity_type;
DROP INDEX IF EXISTS idx_activity_feed_user_created;
```

**Execution Order:** Relatively independent; Phase 4

---

### MIGRATION 17: USER STATS SNAPSHOTS TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS user_stats_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  ✅ FK
  snapshot_date DATE NOT NULL,
  ...
  UNIQUE(user_id, snapshot_date)  ✅ Good
)
```

✅ **Indexes:**
- `idx_user_stats_snapshots_user_id` — For user's history
- `idx_user_stats_snapshots_snapshot_date` — For date range queries
- `idx_user_stats_snapshots_user_date` — Combined index

✅ **RLS Policies:**
- Read: Own stats OR public stats
- Create: Admin only

✅ **Idempotency:** Safe

✅ **Alternative Approach:**
Instead of storing snapshots, could compute on-demand:
```
SELECT 
  COUNT(DISTINCT case when result='correct' then 1) as correct_count,
  COUNT(*) as total_count,
  ...
FROM predictions
WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 day'
```

Decision: Store snapshots for analytics and leaderboard history; compute snapshots daily via admin job.

**Rollback:**
```sql
DROP TABLE IF EXISTS user_stats_snapshots CASCADE;
DROP INDEX IF EXISTS idx_user_stats_snapshots_user_id;
DROP INDEX IF EXISTS idx_user_stats_snapshots_snapshot_date;
DROP INDEX IF EXISTS idx_user_stats_snapshots_user_date;
```

**Execution Order:** Phase 4 (analytics table, optional for MVP)

---

### MIGRATION 18: MATCH PREDICTIONS AGGREGATE TABLE

**Status:** ⚠️ NOT YET EXECUTED

**Validation:**

✅ **SQL Correctness:**
```sql
CREATE TABLE IF NOT EXISTS match_predictions_aggregate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,  ✅ 1:1 with matches
  total_predictions INTEGER DEFAULT 0,
  team1_votes INTEGER DEFAULT 0,
  team2_votes INTEGER DEFAULT 0,
  team1_percentage DECIMAL(5,2) DEFAULT 50,
  team2_percentage DECIMAL(5,2) DEFAULT 50,
  ...
)
```

✅ **Unique Constraint:**
- `UNIQUE(match_id)` — Ensures only one aggregate per match ✅ Good

✅ **Trigger Function:**
```sql
CREATE TRIGGER trigger_update_match_predictions_aggregate
AFTER INSERT OR UPDATE ON predictions
FOR EACH ROW
EXECUTE FUNCTION update_match_predictions_aggregate();
```
✅ Automatically updates on prediction insert/update
✅ Idempotent (`INSERT ... ON CONFLICT ... DO UPDATE`)

✅ **RLS Policies:**
- Read: Public ✅ Correct
- Update: Admin only ✅ Correct

✅ **Idempotency:** Trigger uses `ON CONFLICT`, safe

⚠️ **Considerations:**
- This is a performance optimization (not required for MVP)
- Could be computed from predictions table directly
- Trigger adds slight overhead to prediction insert/update
- Should monitor trigger performance

**Rollback:**
```sql
DROP TRIGGER IF EXISTS trigger_update_match_predictions_aggregate ON predictions;
DROP FUNCTION IF EXISTS update_match_predictions_aggregate();
DROP TABLE IF EXISTS match_predictions_aggregate CASCADE;
```

**Execution Order:** Phase 4 (optional for MVP, important for scale)

---

## EXECUTION ORDER & DEPENDENCIES

### Dependency Graph

```
Phase 1: Foundation
├─ 01-08: Core schema fixes ✅ (already done)
│   ├─ Creates: users, matches, predictions, comments
│   └─ Adds: indexes, RLS policies
│
├─ 09: Teams table (NEW)
│   └─ Used by: matches (future), rankings (frontend)
│
└─ 10: Tournaments table (NEW)
    └─ Used by: matches (future), intel posts, discussions

Phase 2: Content Systems
├─ 11: Intel posts table (NEW)
│   ├─ FK to: users (author) ✅ exists
│   ├─ FK to: matches (match_id) ✅ exists
│   └─ Used by: homepage, matches page
│
└─ 12: Blog posts table (NEW)
    ├─ FK to: users (author) ✅ exists
    └─ Used by: blog page, homepage

Phase 3: Community Systems
├─ 13: Community categories table (NEW)
│   └─ Used by: discussions (migration 14)
│
├─ 14: Community discussions table (NEW)
│   ├─ FK to: users (author) ✅ exists
│   ├─ FK to: matches ✅ exists
│   ├─ FK to: categories (migration 13) ⚠️ MUST execute 13 first
│   └─ Used by: posts (migration 15)
│
└─ 15: Community posts table (NEW)
    ├─ FK to: users (author) ✅ exists
    ├─ FK to: discussions (migration 14) ⚠️ MUST execute 14 first
    └─ Used by: community page

Phase 4: Analytics & Optimization
├─ 16: Activity feed table (NEW)
│   ├─ FK to: users ✅ exists
│   └─ Independent of others
│
├─ 17: User stats snapshots table (NEW)
│   ├─ FK to: users ✅ exists
│   └─ Independent of others
│
└─ 18: Match predictions aggregate table (NEW)
    ├─ FK to: matches ✅ exists
    ├─ FK to: predictions (via trigger) ✅ exists
    ├─ Creates TRIGGER on predictions table
    └─ Independent of others
```

### Safe Execution Order

**Phase 1 (Week 1):**
```
Day 1: Execute 01-08 (should already be done)
Day 1: Verify existing schema
Day 2: Execute 09 (Teams)
Day 2: Execute 10 (Tournaments)
Day 3: Seed 100+ teams, 20+ tournaments
Day 3: Verify no data inconsistencies
Day 4: Test leaderboard with real teams
Day 5: Checkpoint testing (full regression test)
```

**Phase 2 (Week 2):**
```
Day 1: Execute 11 (Intel posts)
Day 1: Execute 12 (Blog posts)
Day 2: Verify RLS policies work
Day 2: Create sample intel/blog data
Day 3: Update homepage API to query intel_posts
Day 3: Update blog page to query blog_posts
Day 4: Frontend integration testing
Day 5: Checkpoint testing
```

**Phase 3 (Week 3-4):**
```
Day 1: Execute 13 (Categories)
Day 2: Execute 14 (Discussions) - waits for 13
Day 2: Execute 15 (Posts) - waits for 14
Day 3: Verify FK relationships
Day 3: Seed 30+ discussions, 100+ posts
Day 4: Update community page queries
Day 5: Frontend integration testing
Day 1(W4): Checkpoint testing
```

**Phase 4 (Week 4-5):**
```
Day 2: Execute 16 (Activity feed)
Day 2: Execute 17 (Stats snapshots)
Day 3: Execute 18 (Predictions aggregate) - creates trigger
Day 3: Verify trigger works on new predictions
Day 4: Performance testing
Day 5: Final regression testing
```

---

## RISK ASSESSMENT & MITIGATION

### Execution Risks

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|-----------|
| **Migration fails mid-execution** | HIGH | MEDIUM | Idempotent migrations, manual verification |
| **FK constraint fails** | HIGH | LOW | Pre-migration data validation |
| **Trigger causes prediction inserts to fail** | HIGH | LOW | Test trigger in dev first, monitor |
| **RLS policies block legitimate queries** | MEDIUM | MEDIUM | Thorough testing before deployment |
| **Performance degradation from new indexes** | MEDIUM | LOW | Monitor query performance |
| **Data inconsistency** | HIGH | LOW | Checkpoint testing after each phase |
| **Rollback fails** | MEDIUM | LOW | Pre-tested rollback procedures |

### Mitigation Strategies

#### Pre-Migration Validation (Before Each Phase)
```
CHECKLIST:
☐ Backup database (Supabase auto-backup, but verify)
☐ Verify no bad data in dependent tables
☐ Test migration in dev environment first
☐ Document current state (row counts, important data)
☐ Notify team of maintenance window
☐ Have rollback plan ready
☐ Have monitoring/alerts enabled
```

#### During Migration
```
CHECKLIST:
☐ Execute migration in transaction (Supabase handles this)
☐ Monitor for locks/slow queries
☐ Verify success with query
☐ Document any warnings/errors
☐ Check for unexpected row count changes
```

#### Post-Migration Validation
```
CHECKLIST:
☐ Run verification queries
☐ Verify FK relationships
☐ Test RLS policies with real users
☐ Run regression tests (existing queries still work)
☐ Monitor for errors in logs
☐ Verify leaderboard/predictions still work
☐ Checkpoint: Update migration status
```

---

## ROLLBACK PROCEDURES

### Phase 1 Rollback (If Teams/Tournaments fail)
```sql
-- Reverse order: 10, 09
DROP TABLE IF EXISTS tournaments CASCADE;
DROP INDEX IF EXISTS idx_tournaments_start_date;
DROP INDEX IF EXISTS idx_tournaments_status;
DROP INDEX IF EXISTS idx_tournaments_featured;
DROP INDEX IF EXISTS idx_tournaments_name;

DROP TABLE IF EXISTS teams CASCADE;
DROP INDEX IF EXISTS idx_teams_rating;
DROP INDEX IF EXISTS idx_teams_win_rate;
DROP INDEX IF EXISTS idx_teams_name;
DROP INDEX IF EXISTS idx_teams_created_at;

-- Restore mock data to lib/data.ts
-- Frontend continues with mock teams/tournaments
```

### Phase 2 Rollback (If Intel/Blog posts fail)
```sql
-- Reverse order: 12, 11
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP INDEX IF EXISTS idx_blog_posts_author_id;
DROP INDEX IF EXISTS idx_blog_posts_published;
DROP INDEX IF EXISTS idx_blog_posts_featured;
DROP INDEX IF EXISTS idx_blog_posts_created_at;
DROP INDEX IF EXISTS idx_blog_posts_category;
DROP INDEX IF EXISTS idx_blog_posts_slug;

DROP TABLE IF EXISTS intel_posts CASCADE;
DROP INDEX IF EXISTS idx_intel_posts_author_id;
DROP INDEX IF EXISTS idx_intel_posts_featured;
DROP INDEX IF EXISTS idx_intel_posts_published;
DROP INDEX IF EXISTS idx_intel_posts_created_at;
DROP INDEX IF EXISTS idx_intel_posts_category;
DROP INDEX IF EXISTS idx_intel_posts_match_id;

-- Restore mock data to lib/data.ts
-- Frontend continues with mock posts
```

### Phase 3 Rollback (If Community tables fail)
```sql
-- Reverse order: 15, 14, 13
DROP TABLE IF EXISTS community_posts CASCADE;
DROP INDEX IF EXISTS idx_community_posts_discussion_id;
DROP INDEX IF EXISTS idx_community_posts_author_id;
DROP INDEX IF EXISTS idx_community_posts_created_at;
DROP INDEX IF EXISTS idx_community_posts_flagged;

DROP TABLE IF EXISTS community_discussions CASCADE;
DROP INDEX IF EXISTS idx_community_discussions_category_id;
DROP INDEX IF EXISTS idx_community_discussions_author_id;
DROP INDEX IF EXISTS idx_community_discussions_status;
DROP INDEX IF EXISTS idx_community_discussions_created_at;
DROP INDEX IF EXISTS idx_community_discussions_match_id;
DROP INDEX IF EXISTS idx_community_discussions_pinned;

DROP TABLE IF EXISTS community_categories CASCADE;
DROP INDEX IF EXISTS idx_community_categories_name;
DROP INDEX IF EXISTS idx_community_categories_slug;

-- Restore mock data to lib/data.ts
-- Frontend continues with mock discussions
```

### Phase 4 Rollback (If Analytics tables fail)
```sql
-- Reverse order: 18, 17, 16
DROP TRIGGER IF EXISTS trigger_update_match_predictions_aggregate ON predictions;
DROP FUNCTION IF EXISTS update_match_predictions_aggregate();
DROP TABLE IF EXISTS match_predictions_aggregate CASCADE;
DROP INDEX IF EXISTS idx_match_predictions_aggregate_match_id;

DROP TABLE IF EXISTS user_stats_snapshots CASCADE;
DROP INDEX IF EXISTS idx_user_stats_snapshots_user_id;
DROP INDEX IF EXISTS idx_user_stats_snapshots_snapshot_date;
DROP INDEX IF EXISTS idx_user_stats_snapshots_user_date;

DROP TABLE IF EXISTS activity_feed CASCADE;
DROP INDEX IF EXISTS idx_activity_feed_user_id;
DROP INDEX IF EXISTS idx_activity_feed_created_at;
DROP INDEX IF EXISTS idx_activity_feed_activity_type;
DROP INDEX IF EXISTS idx_activity_feed_user_created;

-- Analytics features remain offline, continue with queries
```

### Partial Rollback (If only one migration in a phase fails)
```
Principle: Rollback only the failed migration and everything that depends on it
Example: If migration 14 (discussions) fails but 13 (categories) succeeds:
  - Drop categories (and anything depending on it)
  - Keep categories table schema for when we retry
  - Don't drop migrations 01-12
```

---

## FRONTEND INTEGRATION STRATEGY

### Current Frontend Data Sources

**Mocked Pages (Use hardcoded lib/data.ts):**
- ❌ Homepage (matches, intel, activity, rankings)
- ❌ Matches page (all data)
- ❌ Rankings page (all data)
- ❌ Community page (all data)
- ❌ Blog page (all data)
- ❌ Schedule page (all data)
- ⚠️ Admin page (mix of real API calls + mock stats)

**Real Database Pages (Already connected):**
- ✅ Predictions page
- ✅ Leaderboard page
- ✅ Profile page
- ✅ Auth pages

### Safe Frontend Migration Order

**Week 1 (Post-Phase 1): Replace Match Data**
```
Goal: Stop showing mocked matches, start showing real matches
Timeline: After teams/tournaments seeded

Steps:
1. Update getMatches() to return real matches from DB ✅ (already does)
2. Update lib/data.ts `matches` array to be fetched from DB
3. Update Homepage MatchCard to use real data (not mock)
4. Update Matches page to show real match details
5. Test: Can users see real matches? Can they predict?

Risk: LOW (already have real getMatches() API)
Effort: 2 hours
```

**Week 2 (Post-Phase 2): Add Content Systems**
```
Goal: Enable blog and intel post publishing

Steps:
1. Create POST /api/blog (publish blog)
2. Create GET /api/blog/:id (fetch blog post)
3. Create POST /api/intel (publish intel)
4. Create GET /api/intel/:id (fetch intel post)
5. Update Homepage to query blog_posts/intel_posts from DB
6. Update Blog page to show real posts
7. Update Matches page Intel Feed to show real posts
8. Create simple admin UI for publishing

Risk: MEDIUM (new API endpoints needed)
Effort: 4 hours
```

**Week 3-4 (Post-Phase 3): Enable Community**
```
Goal: Allow users to create discussions and posts

Steps:
1. Create POST /api/community/discussions (create discussion)
2. Create POST /api/community/discussions/:id/posts (create post)
3. Create POST /api/community/posts/:id/upvote (upvote)
4. Update Community page to fetch discussions from DB
5. Create discussion creation UI (modal/form)
6. Update discussion display to show real posts
7. Add upvote UI

Risk: MEDIUM (needs moderation UI)
Effort: 5 hours
```

**Week 4-5 (Post-Phase 4): Analytics**
```
Goal: Show real activity feed and stats

Steps:
1. Create admin job to snapshot user stats (daily)
2. Update Homepage activity feed to show real activities
3. Update admin dashboard to show real analytics
4. Add activity feed to profile page

Risk: LOW (optional features)
Effort: 3 hours
```

### Frontend Migration Checklist (Per Page)

**Homepage**
```
☐ Replace matches array with getMatches() call
☐ Replace intelPosts with queryIntelPosts()
☐ Replace communityActivity with queryActivityFeed()
☐ Replace rankings with computed ranking query (or teams table)
☐ Keep Hero section (no changes)
☐ Test responsiveness
☐ Test data loads correctly
☐ Test fallback if API fails
```

**Matches Page**
```
☐ Replace featuredMatch with dynamic match lookup
☐ Replace communityComments with queryComments(matchId)
☐ Replace communityPredictions with queryPredictions(matchId)
☐ Replace intelUpdates with queryIntelPosts(matchId)
☐ Replace relatedMatches with queryMatches(status='upcoming')
☐ Test loading states
☐ Test error handling
```

**Rankings Page**
```
☐ Replace rankingTeams with queryTeamsRanked()
☐ Replace rankingMovers with computeMovement()
☐ Replace rankingUpcoming with queryHighImpactMatches()
☐ Test computation performance
☐ Test sorting/filtering
```

**Community Page**
```
☐ Replace communityStats with queryStats()
☐ Replace communityDiscussions with queryDiscussions()
☐ Replace communityPosts with queryPosts()
☐ Add discussion creation form
☐ Add post creation form in discussions
☐ Test RLS permissions
```

**Blog Page**
```
☐ Replace blogPosts with queryBlogPosts()
☐ Update featured blog logic
☐ Add blog creation UI (admin only for MVP)
☐ Test filtering/sorting
```

---

## SEEDING STRATEGY REVIEW

### What Data to Seed

#### Phase 1: Teams & Tournaments
```
TEAMS (100+ records):
  - Add all 20-30 tier-1 CS2 pro teams
  - Include: name, slug, logo (emoji), country, rating, win_rate, recent_form
  - Source: Real team data, manually curated
  - Effort: 1 hour (script-based)
  - Importance: CRITICAL (matches won't link without teams)

TOURNAMENTS (20+ records):
  - Add major tournaments: PGL Major, ESL Pro League, BLAST Premier, IEM, etc.
  - Include: name, slug, description, prize_pool, dates, status
  - Source: Real tournament calendar, manually curated
  - Effort: 30 minutes (script-based)
  - Importance: CRITICAL (context for matches)

MATCHES (50+ records):
  - Add upcoming, live, and historical matches
  - Include: team1, team2, match_time, tournament, status, result
  - Source: HLTV API or manual entry
  - Effort: 2 hours (depends on data source)
  - Importance: CRITICAL (users can't predict without matches)
```

#### Phase 2: Content
```
INTEL POSTS (20+ records):
  - Create sample posts about team form, roster changes, tournaments
  - Source: AI-generated summaries of real news
  - Effort: 1.5 hours
  - Importance: HIGH (homepage content)

BLOG POSTS (10+ records):
  - Create sample analysis articles
  - Source: AI-generated analysis templates
  - Effort: 1.5 hours
  - Importance: HIGH (blog page content)
```

#### Phase 3: Community
```
COMMUNITY CATEGORIES (6 records):
  - Match Discussion, Betting, Tournament, Team Analysis, Roster Changes, Predictions
  - Can be hardcoded constant instead of seeded
  - Effort: 15 minutes
  - Importance: MEDIUM (structure)

COMMUNITY DISCUSSIONS (30+ records):
  - Sample discussions about matches, betting, teams
  - Source: Template-based generation
  - Effort: 1 hour
  - Importance: MEDIUM (show activity)

COMMUNITY POSTS (100+ records):
  - Sample posts within discussions
  - Source: Template-based generation
  - Effort: 1.5 hours
  - Importance: MEDIUM (show engagement)
```

#### Phase 4: Analytics (Optional)
```
ACTIVITY FEED (100+ records):
  - Auto-generated from predictions/posts
  - No manual seeding needed (generated by triggers)
  - Effort: 0 (automatic)
  - Importance: LOW

USER STATS SNAPSHOTS (optional):
  - Can be generated on-demand or via daily job
  - No seeding needed for MVP
  - Effort: 0
  - Importance: LOW
```

### Safe Reset/Cleanup Approach

**Preserve:**
- Real user accounts (especially admins)
- Real predictions (collected after launch)
- Real match results
- Real leaderboard scores

**Clean Up:**
- Demo teams and tournaments (tag with `is_demo=true` if possible, or reset at end of week)
- Sample blog/intel posts (easy to re-seed)
- Sample discussions/posts (easy to re-seed)
- Test data (keep minimal)

**Reset Strategy:**
```sql
-- Only run if approved for complete reset
-- Tag demo data so it's easy to identify and remove

-- Option 1: Soft delete with is_demo flag
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE intel_posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
-- ... etc

-- Then can delete all demo data:
DELETE FROM intel_posts WHERE is_demo = TRUE;
DELETE FROM blog_posts WHERE is_demo = TRUE;
-- ... etc

-- Option 2: Separate demo database schema (post-launch)
-- Use separate schema for demo/test data, keep production clean
```

---

## FINAL RECOMMENDATIONS

### PHASE 1 EXECUTION (Start This Week)

**Immediate Actions (Next 3 Days):**

1. **Validate existing schema**
   ```bash
   Task: Run verification queries on current database
   Owner: Database engineer
   Time: 1 hour
   Deliverable: Schema validation report
   ```

2. **Prepare teams/tournaments data**
   ```bash
   Task: Create seed scripts for 100+ teams, 20+ tournaments
   Owner: Backend engineer
   Time: 2 hours
   Deliverable: seed-teams.sql, seed-tournaments.sql
   ```

3. **Test migrations in dev**
   ```bash
   Task: Execute migrations 09-10 in dev environment
   Owner: Database engineer
   Time: 1 hour
   Deliverable: Migration verification report
   ```

4. **Create migration checklist**
   ```bash
   Task: Document pre/post-migration validation steps
   Owner: Lead engineer
   Time: 30 minutes
   Deliverable: MIGRATION_CHECKLIST.md
   ```

**Week 1 Execution:**
- Day 1: Validate schema, run checkpoint tests
- Day 2: Execute migration 09 (Teams), verify, seed teams
- Day 3: Execute migration 10 (Tournaments), verify, seed tournaments
- Day 4: Integration testing (matches display real teams)
- Day 5: Full regression test (all existing features still work)

**Success Criteria:**
- ✅ All 10 migrations execute cleanly
- ✅ 100+ teams seeded
- ✅ 20+ tournaments seeded
- ✅ Homepage shows real team names instead of mocked
- ✅ Leaderboard queries work with real data
- ✅ 0 regressions in existing functionality

---

### RECOMMENDED FIRST IMPLEMENTATION BATCH

**Start with Migration 09-10 (Teams & Tournaments)**

**Why:**
1. Foundation for all other migrations
2. Low risk (no dependencies)
3. Quick to execute (< 30 minutes)
4. Can verify data integrity immediately
5. Unblocks Phase 2 migrations

**Order:**
```
1. Run seed-teams.sql (pre-executed)
2. Execute Migration 09: CREATE teams table
3. Verify: SELECT COUNT(*) FROM teams; -- should be 100+
4. Run seed-tournaments.sql
5. Execute Migration 10: CREATE tournaments table
6. Verify: SELECT COUNT(*) FROM tournaments; -- should be 20+
7. Test: Homepage queries teams/tournaments correctly
8. Checkpoint: All existing features still work
```

---

## NEXT DOCUMENTS TO CREATE

### Immediately After This Document:
1. **MIGRATION_EXECUTION.md** — Step-by-step execution instructions
2. **VERIFICATION_QUERIES.md** — Validation SQL after each migration
3. **SEED_DATA.sql** — Complete seed scripts for all phases
4. **FRONTEND_CONVERSION_GUIDE.md** — Page-by-page API replacement guide
5. **ROLLBACK_GUIDE.md** — Emergency rollback procedures
6. **MONITORING_DASHBOARD.md** — What to monitor during execution

---

## SUMMARY

**CS Intel Database Remediation can be safely executed in 4 phases over 5-6 weeks:**

- **Phase 1 (Week 1):** Foundation (teams, tournaments)
- **Phase 2 (Week 2):** Content (intel, blog)
- **Phase 3 (Week 3-4):** Community (discussions, posts)
- **Phase 4 (Week 4-5):** Analytics (activity feed, snapshots, aggregates)

**All migrations are:**
- ✅ Idempotent (safe to retry)
- ✅ Non-blocking (no table locks)
- ✅ Rollback-ready (clear rollback procedures)
- ✅ Risk-managed (staged, not all-at-once)

**Existing systems remain operational throughout:**
- ✅ Authentication
- ✅ Predictions
- ✅ Leaderboard
- ✅ User sessions

**First action:** Execute Migrations 09-10 (Teams, Tournaments) this week, seed data, verify integrity, unblock Phase 2.

---

**Document Status:** Ready for execution  
**Lead Engineer Approval:** Recommended for immediate start  
**Risk Level:** Medium (well-managed with checkpoints)

