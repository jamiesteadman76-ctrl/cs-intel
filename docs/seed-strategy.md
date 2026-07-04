# Database Seeding Strategy - Phase 7

**Date:** June 1, 2026  
**Project:** CS Intel

---

## Part 1: Seeding Philosophy

Instead of hardcoding demo data in TypeScript files, all demo content will be inserted into the database during environment setup. This ensures:
- ✅ Demo data is part of the same system as real data
- ✅ Admin users can edit/delete demo content
- ✅ Seeding scripts are version-controlled
- ✅ Easy to reset to clean state during development
- ✅ Staging environments can have realistic test data

---

## Part 2: Seeding Order & Dependencies

```
1. teams (10 rows) — No dependencies
2. tournaments (5 rows) — No dependencies
3. matches (30 rows) — Requires teams, tournaments
4. users (50 rows) — No dependencies
5. predictions (300 rows) — Requires users, matches
6. comments (100 rows) — Requires users, matches
7. community_categories (6 rows) — No dependencies
8. community_discussions (20 rows) — Requires users, community_categories, matches
9. community_posts (100 rows) — Requires users, community_discussions
10. intel_posts (15 rows) — Requires users, matches
11. blog_posts (12 rows) — Requires users
12. activity_feed (200 rows) — Requires users (generated from other activities)
13. match_predictions_aggregate (30 rows) — Auto-generated from predictions

```

---

## Part 3: Table Seeding Details

### TABLE 1: teams (10 rows)

**Purpose:** Create realistic CS2 professional team data

**Teams to seed:**
- Spirit (🔥)
- FaZe Clan (⚡)
- NAVI (🌊)
- Vitality (💎)
- Liquid (💧)
- Heroic (⚔️)
- MOUZ (💀)
- Falcons (🦅)
- ENCE (🔱)
- Complexity (🎯)

**Script location:** `scripts/seed/01_teams.sql`
**Sample data:**
```sql
INSERT INTO teams (name, slug, logo, country, rating, win_rate, best_map, worst_map, key_player)
VALUES 
  ('Spirit', 'spirit', '🔥', 'RU', 2847, 78, 'Ancient', 'Inferno', 'magixx'),
  ('FaZe Clan', 'faze-clan', '⚡', 'EU', 2834, 75, 'Overpass', 'Nuke', 'ropz'),
  ...
```

**Expected outcome:** 10 teams available for match creation

---

### TABLE 2: tournaments (5 rows)

**Purpose:** Create tournament structure for matches

**Tournaments to seed:**
- PGL Major 2026
- ESL Pro League Season 21
- BLAST Premier Spring 2026
- IEM Katowice 2026
- DreamHack Dallas 2026

**Script location:** `scripts/seed/02_tournaments.sql`
**Sample data:**
```sql
INSERT INTO tournaments (name, slug, prize_pool, start_date, end_date)
VALUES 
  ('PGL Major 2026', 'pgl-major-2026', '$1,000,000', '2026-06-01', '2026-07-15'),
  ...
```

---

### TABLE 3: matches (30 rows)

**Purpose:** Provide realistic match schedule

**Mix:**
- 8 upcoming matches (next week)
- 12 live/recent matches (past 3 days)
- 10 future matches (2-4 weeks out)

**Script location:** `scripts/seed/03_matches.sql`
**Teams:** Use team_id from teams table
**Tournaments:** Use tournament_id from tournaments table
**Featured matches:** Mark 2-3 as featured

**Expected outcome:** 30 matches across all tournaments with realistic schedule

---

### TABLE 4: users (50 rows)

**Purpose:** Create realistic user base for predictions and community

**Mix:**
- 1 admin user
- 5 verified expert users (high accuracy, high score)
- 10 regular users (medium accuracy, medium score)
- 34 new users (low accuracy, new accounts)

**Script location:** `scripts/seed/04_users.sql`

**Expert users to seed:**
```
- ClutchKing (accuracy: 78%, intel_score: 12450)
- BetAnalyzer (accuracy: 74%, intel_score: 11200)
- MapVetoMaster (accuracy: 71%, intel_score: 9870)
- FormTracker (accuracy: 69%, intel_score: 8450)
- ProPredictors (accuracy: 65%, intel_score: 6890)
```

**Expected outcome:** 50 users with varied accuracy and scores

---

### TABLE 5: predictions (300 rows)

**Purpose:** Create realistic prediction history

**Distribution:**
- 150 predictions for upcoming matches (pending)
- 100 predictions for recent matches (correct/incorrect mix: 65% correct)
- 50 predictions for older matches (all resolved)

**Script location:** `scripts/seed/05_predictions.sql`
**Confidence levels:** Random between 50-100
**Expected outcome:** 300 predictions, 65% accurate on average

---

### TABLE 6: comments (100 rows)

**Purpose:** Create community discussion in match pages

**Distribution:**
- 5 comments per match on featured matches
- 2-3 comments per match on recent matches
- Variable upvote counts (0-500)

**Script location:** `scripts/seed/06_comments.sql`
**Expected outcome:** 100 realistic comments across matches

---

### TABLE 7: community_categories (6 rows)

**Purpose:** Structure community discussions

**Categories:**
- Match Discussion
- Betting Discussion
- Tournament Discussion
- Team Analysis
- Roster Changes
- Predictions

**Script location:** `scripts/seed/07_categories.sql`
**Expected outcome:** 6 category options for discussions

---

### TABLE 8: community_discussions (20 rows)

**Purpose:** Create trending discussions

**Distribution:**
- 15 active discussions
- 3 locked discussions
- 2 flagged discussions

**Sample topics:**
- "Is Spirit overrated at current odds?"
- "Best underdog pick of the day?"
- "Can FaZe win the Major?"
- "Most improved player of 2026?"

**Script location:** `scripts/seed/08_discussions.sql`
**Expected outcome:** 20 discussions with realistic engagement

---

### TABLE 9: community_posts (100 rows)

**Purpose:** Populate discussions with posts

**Distribution:**
- 4-6 posts per discussion
- Variable upvotes (0-200)
- Variable view counts (10-1000)

**Script location:** `scripts/seed/09_posts.sql`
**Expected outcome:** 100 posts with realistic engagement

---

### TABLE 10: intel_posts (15 rows)

**Purpose:** Provide analysis content for homepage and match pages

**Categories:**
- team-form (4 posts)
- roster-change (3 posts)
- tournament (4 posts)
- betting (2 posts)
- meta (2 posts)

**Featured:** 2-3 posts featured on homepage

**Script location:** `scripts/seed/10_intel_posts.sql`
**Expected outcome:** 15 intel posts with varied categories

---

### TABLE 11: blog_posts (12 rows)

**Purpose:** Populate blog page with articles

**Categories:**
- Analysis (3 posts)
- Betting (2 posts)
- Teams (3 posts)
- Meta (2 posts)
- Tournament (2 posts)

**Published:** 10 published, 2 draft
**Featured:** 1-2 featured on homepage

**Script location:** `scripts/seed/11_blog_posts.sql`
**Expected outcome:** 12 blog articles with realistic metadata

---

### TABLE 12: activity_feed (200 rows)

**Purpose:** Populate activity feed with user actions

**Distribution:**
- Predictions (80 entries) — Link to actual predictions made
- Comments (50 entries) — Link to actual comments
- Posts (40 entries) — Link to actual community posts
- Upvotes (20 entries) — References to posts/comments
- Achievements (10 entries) — User milestones

**Script location:** `scripts/seed/12_activity_feed.sql`
**Generation:** Can be generated from actual predictions/comments/posts
**Expected outcome:** 200 activity entries from real user actions

---

### TABLE 13: match_predictions_aggregate (Auto-generated)

**Purpose:** Auto-aggregate predictions per match

**Generation:** Triggers automatically when predictions are inserted
**Expected outcome:** 30 aggregate records (one per match)

---

## Part 4: Cleanup & Reset Strategy

### Development Reset (Atomic)

```sql
-- Cleanup script for development reset
-- Deletes all seeded data and resets sequences
-- Keeps user authentication & admin users

DELETE FROM activity_feed;
DELETE FROM community_posts;
DELETE FROM community_discussions;
DELETE FROM community_categories;
DELETE FROM match_predictions_aggregate;
DELETE FROM predictions;
DELETE FROM comments;
DELETE FROM blog_posts;
DELETE FROM intel_posts;
DELETE FROM matches;
DELETE FROM tournaments;
DELETE FROM teams;
DELETE FROM users WHERE is_admin = false; -- Keep admin users
```

**Location:** `scripts/reset.sql`
**Usage:** Run before seeding in development
**Execution time:** <1 second

---

### Partial Resets

**Reset only match data (keep users):**
```sql
-- scripts/reset_matches.sql
DELETE FROM activity_feed;
DELETE FROM match_predictions_aggregate;
DELETE FROM predictions;
DELETE FROM comments;
DELETE FROM matches;
```

**Reset only community data (keep matches):**
```sql
-- scripts/reset_community.sql
DELETE FROM community_posts;
DELETE FROM community_discussions;
```

---

## Part 5: Seeding Execution

### Setup Instructions

```bash
# 1. Create database tables (migrations)
npm run migrate

# 2. Reset to clean state (optional)
psql -d cs_intel < scripts/reset.sql

# 3. Seed all tables in order
npm run seed

# 4. Verify data
npm run verify-seed
```

### Automated Seeding Script

**Location:** `scripts/seed-all.sh`

```bash
#!/bin/bash

# Seed all tables in correct order
psql -d cs_intel -f scripts/seed/01_teams.sql
psql -d cs_intel -f scripts/seed/02_tournaments.sql
psql -d cs_intel -f scripts/seed/03_matches.sql
psql -d cs_intel -f scripts/seed/04_users.sql
psql -d cs_intel -f scripts/seed/05_predictions.sql
psql -d cs_intel -f scripts/seed/06_comments.sql
psql -d cs_intel -f scripts/seed/07_categories.sql
psql -d cs_intel -f scripts/seed/08_discussions.sql
psql -d cs_intel -f scripts/seed/09_posts.sql
psql -d cs_intel -f scripts/seed/10_intel_posts.sql
psql -d cs_Intel -f scripts/seed/11_blog_posts.sql
# activity_feed and match_predictions_aggregate auto-generated
```

---

## Part 6: Verification Queries

Run after seeding to verify data integrity:

```sql
-- Verify row counts
SELECT 'teams' AS table_name, COUNT(*) AS row_count FROM teams
UNION ALL
SELECT 'tournaments', COUNT(*) FROM tournaments
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'predictions', COUNT(*) FROM predictions
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'community_discussions', COUNT(*) FROM community_discussions
UNION ALL
SELECT 'community_posts', COUNT(*) FROM community_posts
UNION ALL
SELECT 'intel_posts', COUNT(*) FROM intel_posts
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts;

-- Verify foreign key integrity
SELECT 'matches.team1_id' AS check_name, COUNT(*) AS invalid_count
FROM matches m WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.team1_id)
UNION ALL
SELECT 'matches.team2_id', COUNT(*)
FROM matches m WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.team2_id)
UNION ALL
SELECT 'predictions.user_id', COUNT(*)
FROM predictions p WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
UNION ALL
SELECT 'predictions.match_id', COUNT(*)
FROM predictions p WHERE NOT EXISTS (SELECT 1 FROM matches m WHERE m.id = p.match_id);

-- Verify predictions aggregate
SELECT COUNT(*) AS aggregate_count FROM match_predictions_aggregate;
```

---

## Part 7: Data Consistency

### Denormalisation Rules

During seeding, maintain these denormalised fields:

**matches table:**
- `prediction_count` = COUNT(predictions where match_id = this)
- `comment_count` = COUNT(comments where match_id = this)

**users table:**
- `total_predictions` = COUNT(predictions where user_id = this)
- `accuracy_percentage` = (correct / total) * 100
- `current_streak` = longest consecutive correct predictions

**community_discussions table:**
- `reply_count` = COUNT(community_posts where discussion_id = this)
- `upvote_count` = SUM(upvotes from community_posts)

**community_categories table:**
- `discussion_count` = COUNT(discussions where category_id = this)

### Trigger-Based Updates

Triggers handle these automatically:
- `match_predictions_aggregate` — Auto-updated on prediction insert/update
- User stats — Could be updated via scheduled job (not via trigger)

---

## Part 8: Scalability Considerations

**For production seeding beyond demo data:**

- Use batch inserts in SQL (INSERT ... VALUES (...), (...), ...)
- Use COPY for large datasets (CSV -> SQL)
- Disable indexes during bulk inserts, rebuild after
- Disable triggers temporarily during seeding
- Use connection pooling for speed
- Consider partitioning large tables by date

**Estimated seeding time:**
- Current seed (500 rows): <5 seconds
- 10,000 matches (realistic): <30 seconds
- 1M predictions (large prod): <5 minutes

---

## Conclusion

Seeding strategy replaces 71 hardcoded data arrays with database inserts that create realistic demo data. This data is:
- ✅ Version controlled
- ✅ Editable by admins
- ✅ Resettable for clean state
- ✅ Scalable to production data volumes

