# CS INTEL — MIGRATION EXECUTION & VERIFICATION GUIDE

**Date:** June 2, 2026  
**Purpose:** Step-by-step execution with verification queries  
**Status:** Ready for Phase 1 execution

---

## PHASE 1 EXECUTION WALKTHROUGH

### Pre-Flight Checklist (Do Before Any Migrations)

```
BEFORE YOU START:

☐ Backup: Supabase auto-backup enabled? (verify in dashboard)
☐ Admin Access: Do you have Supabase admin/database credentials?
☐ Environment: Are you executing on production? (if yes, during low-traffic time)
☐ Team Notified: Have you informed team of 30-min maintenance window?
☐ Rollback Plan: Do you have rollback scripts ready?
☐ Monitoring: Is database monitoring enabled?
☐ Seed Data: Do you have teams.sql and tournaments.sql prepared?
```

---

## MIGRATION 09: TEAMS TABLE

### Pre-Migration Validation

```sql
-- Check current schema
SELECT * FROM information_schema.tables 
WHERE table_name = 'teams' AND table_schema = 'public';
-- Result should be: EMPTY (table doesn't exist yet)

-- Check for table conflicts
SELECT COUNT(*) FROM pg_tables 
WHERE tablename = 'teams';
-- Result should be: 0 (no existing teams table)
```

### Execution Steps

**Step 1: Run the migration**
```sql
-- Copy entire migration 09 from migrations/09_create_teams.sql
-- Paste and execute in Supabase SQL editor

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  country TEXT,
  founded_year INTEGER,
  website TEXT,
  rating INTEGER DEFAULT 2000 CHECK (rating >= 0),
  win_rate DECIMAL(5,2) DEFAULT 50 CHECK (win_rate >= 0 AND win_rate <= 100),
  last_match_time TIMESTAMPTZ,
  total_matches INTEGER DEFAULT 0 CHECK (total_matches >= 0),
  recent_form TEXT DEFAULT 'LLLLL',
  best_map TEXT,
  worst_map TEXT,
  key_player TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_teams_rating ON teams(rating DESC);
CREATE INDEX idx_teams_win_rate ON teams(win_rate DESC);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_created_at ON teams(created_at DESC);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "teams_public_read" ON teams
  FOR SELECT
  USING (true);

CREATE POLICY "teams_admin_write" ON teams
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

CREATE POLICY "teams_admin_update" ON teams
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );
```

**Expected Output:**
```
✅ CREATE TABLE completed
✅ CREATE INDEX completed (x4)
✅ ALTER TABLE completed
✅ CREATE POLICY completed (x3)
```

---

### Post-Migration Verification

**Step 2: Verify table structure**
```sql
-- Check table exists
SELECT * FROM information_schema.columns 
WHERE table_name = 'teams' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected: 15 columns (id, name, slug, logo, country, etc.)
-- If result is empty: MIGRATION FAILED
```

**Step 3: Verify indexes**
```sql
-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename = 'teams';

-- Expected output:
-- idx_teams_rating
-- idx_teams_win_rate
-- idx_teams_name
-- idx_teams_created_at
-- teams_pkey (auto-created)
```

**Step 4: Verify RLS policies**
```sql
-- Check RLS enabled
SELECT * FROM pg_tables 
WHERE tablename = 'teams' AND schemaname = 'public';

-- Expected: rowsecurity = true

-- Check policies exist
SELECT policyname FROM pg_policies 
WHERE tablename = 'teams';

-- Expected output:
-- teams_public_read
-- teams_admin_write
-- teams_admin_update
```

**Step 5: Test RLS works**
```sql
-- This should work (public read)
SELECT * FROM teams LIMIT 1;

-- This should work (admin can insert)
-- (only if logged in as admin)
INSERT INTO teams (name, slug, rating)
VALUES ('Test Team', 'test-team', 2000);

-- Verify insert worked
SELECT COUNT(*) FROM teams WHERE name = 'Test Team';

-- Clean up test data
DELETE FROM teams WHERE name = 'Test Team';
```

---

### Rollback (If Needed)

```sql
-- If migration fails, run this to rollback

DROP TABLE IF EXISTS teams CASCADE;
DROP INDEX IF EXISTS idx_teams_rating;
DROP INDEX IF EXISTS idx_teams_win_rate;
DROP INDEX IF EXISTS idx_teams_name;
DROP INDEX IF EXISTS idx_teams_created_at;

-- Verify rollback
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'teams';
-- Expected: 0 (table gone)
```

---

## MIGRATION 10: TOURNAMENTS TABLE

### Pre-Migration Validation

```sql
-- Check teams table still exists (migration 09 prerequisite)
SELECT COUNT(*) FROM teams;
-- Expected: >= 0 (table exists, may be empty)

-- Check no tournament table conflicts
SELECT COUNT(*) FROM pg_tables 
WHERE tablename = 'tournaments';
-- Expected: 0
```

### Execution Steps

**Step 1: Run the migration**
```sql
CREATE TABLE IF NOT EXISTS tournaments (
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
  match_count INTEGER DEFAULT 0 CHECK (match_count >= 0),
  team_count INTEGER DEFAULT 0 CHECK (team_count >= 0),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  featured BOOLEAN DEFAULT FALSE,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date DESC);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_featured ON tournaments(featured);
CREATE INDEX idx_tournaments_name ON tournaments(name);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "tournaments_public_read" ON tournaments
  FOR SELECT
  USING (true);

CREATE POLICY "tournaments_admin_write" ON tournaments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

CREATE POLICY "tournaments_admin_update" ON tournaments
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );
```

**Expected Output:**
```
✅ CREATE TABLE completed
✅ CREATE INDEX completed (x4)
✅ ALTER TABLE completed
✅ CREATE POLICY completed (x3)
```

---

### Post-Migration Verification

**Step 2: Verify table structure**
```sql
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'tournaments' AND table_schema = 'public';

-- Expected: 15 columns
```

**Step 3: Verify indexes**
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'tournaments' 
ORDER BY indexname;

-- Expected:
-- idx_tournaments_featured
-- idx_tournaments_name
-- idx_tournaments_start_date
-- idx_tournaments_status
-- tournaments_pkey
```

**Step 4: Test inserts**
```sql
INSERT INTO tournaments (name, slug, status, featured)
VALUES ('Test Tournament', 'test-tournament', 'upcoming', false);

SELECT * FROM tournaments WHERE name = 'Test Tournament';

DELETE FROM tournaments WHERE name = 'Test Tournament';
```

---

### Rollback (If Needed)

```sql
DROP TABLE IF EXISTS tournaments CASCADE;
DROP INDEX IF EXISTS idx_tournaments_start_date;
DROP INDEX IF EXISTS idx_tournaments_status;
DROP INDEX IF EXISTS idx_tournaments_featured;
DROP INDEX IF EXISTS idx_tournaments_name;
```

---

## PHASE 1 DATA SEEDING

### Seed Teams (Migration 09)

**Script: seed-teams.sql**

```sql
-- Insert CS2 Pro Teams (20 tier-1 teams)

INSERT INTO teams (name, slug, logo, country, rating, win_rate, recent_form, key_player)
VALUES
  ('FaZe Clan', 'faze-clan', '⚡', 'Multinational', 2847, 68, 'WWWWW', 'ropz'),
  ('NAVI', 'navi', '🌊', 'Ukraine', 2821, 66, 'WWWWL', 's1mple'),
  ('Vitality', 'vitality', '💎', 'France', 2798, 65, 'WWWLW', 'ZywOo'),
  ('Liquid', 'liquid', '💧', 'USA', 2756, 62, 'LWWWL', 'Grim'),
  ('Heroic', 'heroic', '⚔️', 'Denmark', 2734, 60, 'LWWWW', 'stavn'),
  ('Spirit', 'spirit', '🔥', 'Russia', 2812, 67, 'WWWWW', 'chopper'),
  ('MOUZ', 'mouz', '💀', 'Germany', 2671, 58, 'LLWWW', 'Jimpphat'),
  ('G2', 'g2', '🎮', 'Germany', 2645, 57, 'LWLWW', 'huNter'),
  ('Falcons', 'falcons', '🦅', 'Saudi Arabia', 2634, 56, 'WLWLW', 'nukkye'),
  ('ENCE', 'ence', '🔱', 'Finland', 2612, 55, 'LWWWL', 'Snappi'),
  ('BIG', 'big', '💪', 'Germany', 2598, 54, 'LWLWW', 'tabseN'),
  ('Complexity', 'complexity', '🎯', 'USA', 2587, 53, 'LWLLL', 'JT'),
  ('Sprout', 'sprout', '🌱', 'Germany', 2576, 52, 'WLLLL', 'syrsoN'),
  ('Cloud9', 'cloud9', '☁️', 'USA', 2565, 51, 'LLWLL', 'leaf'),
  ('MAD Lions', 'mad-lions', '🦁', 'Spain', 2554, 50, 'LLLWW', 'FASHR'),
  ('FlyQuest', 'flyquest', '🦅', 'USA', 2543, 49, 'LLWLL', 'ryx'),
  ('Eternal Fire', 'eternal-fire', '🔥', 'Turkey', 2532, 48, 'WLLLL', 'Calyx'),
  ('OG', 'og', '⚪', 'Multinational', 2521, 47, 'LLLLW', 'mantuu'),
  ('FunPlus Phoenix', 'funplus-phoenix', '🐦', 'China', 2510, 46, 'LWLLL', 'Attacker'),
  ('Outsiders', 'outsiders', '👽', 'CIS', 2499, 45, 'LLLWL', 'chopper');

-- Verify seeding
SELECT COUNT(*) FROM teams;
-- Expected: >= 20
```

### Seed Tournaments (Migration 10)

**Script: seed-tournaments.sql**

```sql
-- Insert Major CS2 Tournaments

INSERT INTO tournaments (name, slug, description, prize_pool, status, organizer, location, start_date, end_date)
VALUES
  ('ESL Pro League Season 21', 'esl-pro-league-21', 'ESL Pro League flagship event', '$1,000,000', 'upcoming', 'ESL', 'Online', '2026-06-15'::timestamptz, '2026-08-30'::timestamptz),
  ('PGL Major 2026', 'pgl-major-2026', 'Community-voted Major', '$1,250,000', 'upcoming', 'PGL', 'Copenhagen', '2026-09-01'::timestamptz, '2026-09-22'::timestamptz),
  ('BLAST Premier: Spring 2026', 'blast-spring-2026', 'BLAST premier spring tournament', '$1,500,000', 'upcoming', 'BLAST', 'Various', '2026-05-01'::timestamptz, '2026-06-30'::timestamptz),
  ('IEM Katowice 2026', 'iem-katowice-2026', 'Intel Extreme Masters world championship', '$1,000,000', 'upcoming', 'Intel ESL', 'Katowice', '2026-10-15'::timestamptz, '2026-10-25'::timestamptz),
  ('Esports World Cup 2026', 'esports-world-cup-2026', 'International esports championship', '$5,000,000', 'upcoming', 'Kingdom', 'Saudi Arabia', '2026-07-01'::timestamptz, '2026-09-30'::timestamptz),
  ('CS2 Champions Cup', 'cs2-champions-cup', 'Year-end championship', '750,000', 'upcoming', 'ESL', 'Online', '2026-11-15'::timestamptz, '2026-12-15'::timestamptz),
  ('WESG 2026', 'wesg-2026', 'World Esports Super Series', '$500,000', 'upcoming', 'WESG', 'Multiple', '2026-08-01'::timestamptz, '2026-10-30'::timestamptz),
  ('Dreamhack Masters 2026', 'dreamhack-masters', 'Dreamhack Counter-Strike tournament', '$300,000', 'upcoming', 'Dreamhack', 'Online', '2026-06-20'::timestamptz, '2026-06-28'::timestamptz);

-- Verify seeding
SELECT COUNT(*) FROM tournaments;
-- Expected: >= 8
```

---

## PHASE 1 INTEGRATION TESTING

### After Phase 1 migrations complete, run these tests:

**Test 1: Homepage can query teams**
```sql
-- Verify teams seeded
SELECT COUNT(*) as team_count FROM teams;
-- Expected: >= 20

-- Verify top teams by rating
SELECT name, rating, win_rate 
FROM teams 
ORDER BY rating DESC 
LIMIT 10;

-- Expected: 10 teams with FaZe/NAVI/Vitality at top
```

**Test 2: Rankings page can display teams**
```sql
-- Verify can select teams for ranking display
SELECT id, name, logo, rating, win_rate, recent_form
FROM teams
WHERE rating >= 2500
ORDER BY rating DESC;

-- Expected: 10+ high-rated teams
```

**Test 3: Matches can reference teams**
```sql
-- Verify matches reference team names that exist
SELECT m.team1, m.team2, COUNT(*) 
FROM matches m
GROUP BY m.team1, m.team2;

-- Check which teams in matches exist in teams table
SELECT DISTINCT m.team1 FROM matches m
WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.name = m.team1);

-- Expected: 0 rows (all teams exist, or teams can be created)
```

**Test 4: RLS policies work**
```sql
-- Test public read access
SELECT COUNT(*) FROM teams;
-- Expected: >= 20 (should work without auth)

-- Test admin write access
-- (requires authenticated session as admin)
-- Can be tested in frontend after auth
```

---

## CHECKPOINT: PHASE 1 SUCCESS CRITERIA

```
BEFORE MOVING TO PHASE 2, VERIFY:

Database Schema:
☐ teams table created with 15 columns
☐ tournaments table created with 15+ columns
☐ All indexes created and functional
☐ RLS policies enabled on both tables
☐ No errors in Supabase logs

Data Quality:
☐ 100+ teams seeded
☐ 8+ tournaments seeded
☐ All team ratings between 2000-3000
☐ All tournament statuses valid (upcoming/live/completed)
☐ All dates in future (for now)

Functionality:
☐ Homepage displays real team data
☐ Leaderboard queries teams correctly
☐ Rankings page shows seeded teams
☐ No regressions in existing features
☐ RLS allows public read, admin write

Performance:
☐ Team queries return < 100ms
☐ Tournament queries return < 100ms
☐ No slow queries in Supabase logs
☐ No connection pool exhaustion

Testing:
☐ All existing predictions still work
☐ Leaderboard scores unchanged
☐ User authentication unaffected
☐ Admin access verified
☐ No data corruption

Documentation:
☐ Phase 1 execution logged
☐ Any issues documented
☐ Rollback procedures verified
☐ Backup confirmed post-migration
```

---

## PHASE 2 EXECUTION (After Phase 1 Success)

### Migration 11: Intel Posts

**Pre-Migration:**
```sql
SELECT COUNT(*) FROM users;
-- Expected: >= 5 (have some users for author FK)

SELECT COUNT(*) FROM matches;
-- Expected: >= 10 (have matches for optional match_id FK)
```

**Execution:** (See IMPLEMENTATION_ROADMAP for full script)

**Post-Migration:**
```sql
-- Verify table exists
SELECT COUNT(*) FROM pg_tables 
WHERE tablename = 'intel_posts';

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'intel_posts';

-- Expected indexes:
-- idx_intel_posts_author_id
-- idx_intel_posts_featured
-- idx_intel_posts_published
-- idx_intel_posts_created_at
-- idx_intel_posts_category
-- idx_intel_posts_match_id
```

### Migration 12: Blog Posts

**Pre-Migration:**
```sql
-- Same as intel posts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM matches;
```

**Post-Migration:**
```sql
SELECT COUNT(*) FROM pg_tables 
WHERE tablename = 'blog_posts';

-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'blog_posts';
```

---

## TROUBLESHOOTING COMMON ISSUES

### Issue: "Table already exists"
```
Error: "relation "teams" already exists"
Solution: 
  - Migrations use IF NOT EXISTS, so this shouldn't happen
  - If it does, table wasn't dropped properly on rollback
  - Run: DROP TABLE IF EXISTS teams CASCADE;
  - Then retry migration
```

### Issue: "Foreign key constraint fails"
```
Error: "insert or update on table "X" violates foreign key constraint"
Solution:
  - Usually means author_id or match_id doesn't exist in referenced table
  - Verify users table has rows: SELECT COUNT(*) FROM users;
  - Verify matches table has rows: SELECT COUNT(*) FROM matches;
  - If empty, seed the tables first
```

### Issue: "RLS policy prevents operation"
```
Error: "new row violates row-level security policy"
Solution:
  - RLS is working correctly
  - Make sure you're testing with correct auth context
  - Admin operations require is_admin = true
  - Public read should work without auth
```

### Issue: "Trigger creation fails"
```
Error: "function update_match_predictions_aggregate() does not exist"
Solution:
  - Only happens in Phase 4 (migration 18)
  - Migration creates function first, then trigger
  - Check migration runs in correct order
  - Function should exist: SELECT COUNT(*) FROM pg_proc WHERE proname = 'update_match_predictions_aggregate';
```

### Issue: "Slow query after migration"
```
Warning: Queries slower than before
Solution:
  - Index statistics may be stale
  - Run ANALYZE on affected tables: ANALYZE teams;
  - New indexes need data distribution analysis
  - Most queries should be faster after indexing
```

---

## MONITORING DURING EXECUTION

### What to Watch

```
✅ GOOD SIGNS:
- Migrations complete in < 1 minute each
- No errors in Supabase logs
- Query performance unchanged or improved
- RLS policies allow expected access
- New data queryable from API

❌ BAD SIGNS:
- Migrations take > 5 minutes (table lock)
- Errors in "Policy violation" messages
- Connection pool warnings
- Query timeouts
- Data duplication or corruption
```

### Quick Health Check (After Each Migration)

```sql
-- Check for errors
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%ERROR%' 
ORDER BY calls DESC LIMIT 10;

-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;
-- Should be < 20 (not connection pool exhaustion)
```

---

**Document Status:** Ready for Phase 1 execution  
**Next Step:** Execute Migration 09 (Teams) following steps above

