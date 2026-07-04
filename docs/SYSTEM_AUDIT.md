# CS Intel — Full System Audit

**Date:** June 22, 2026
**Scope:** Database schema, data flow, scoring integrity, migration state, recommendations
**Source of truth:** Live Supabase (PostgreSQL) — `supabase/migrations/20260622224053_remote_schema.sql`
**Code under review:** `lib/api/index.ts`, `lib/ratings.ts`, `lib/types.ts`, `lib/supabase.ts`, `app/admin/page.tsx`

---

## TL;DR

The CS Intel app has a **core domain schema that works** (users, matches, predictions, teams, tournaments, comments) but is held together by **fragile application-layer logic** that contains multiple correctness, race, and schema-mismatch bugs. The recent rewrite of `app/admin/page.tsx` is the first page correctly using the live database. Scoring logic lacks atomicity, idempotency, an audit trail, and historical recalculation capability. There is no `teams`/`tournaments`/`predictions` history table, no scoring event log, and no SQL trigger for "match resolved → predictions scored → user intel_score updated" — every step is JS-side, sequential, and exposed to partial-failure.

**Severity at a glance:**
- 🔴 5 critical bugs in the scoring pipeline (column mismatch, race, no atomicity, partial-failure, draw handling)
- 🟠 6 structural gaps (no scoring audit, no prediction history, no streak history, no transactions, no RLS on intel_score)
- 🟡 7 medium risks (admin > lib mix, mock data persistence, denormalization drift, missing FK enforcement on legacy TEXT, etc.)
- 🟢 4 low / nice-to-have items

---

## 1. Database Schema

### 1.1 Inventory

The live schema (`20260622224053_remote_schema.sql`) ships **16 tables**:

| # | Table | Purpose | Used by app code? |
|---|---|---|---|
| 1 | `users` | Authenticated user profiles (username, avatar, intel_score, is_admin, email) | ✅ Core |
| 2 | `matches` | CS2 matches with teams, status (upcoming/live/completed), result (team1_win/team2_win/draw), score1/score2 | ✅ Core |
| 3 | `predictions` | User picks per match (one row per user-match) | ✅ Core |
| 4 | `teams` | CS2 pro teams — rating, win_rate, recent_form, etc. | ✅ Frontend (admin) |
| 5 | `tournaments` | Events — start_date, end_date, prize_pool, status | ✅ Frontend (admin) |
| 6 | `comments` | Match discussion comments by users | ⚠️ Predictions/Admin only |
| 7 | `community_posts` | Discussion threads (title, content, tags) | ❌ Not wired |
| 8 | `community_comments` | Comments on community_posts | ❌ Not wired |
| 9 | `community_categories` | Discussion category taxonomy | ❌ Empty seed |
| 10 | `community_tags` | Tag taxonomy | ❌ Empty seed |
| 11 | `community_activity` | Activity log (R/W only via service_role) | ❌ Unused |
| 12 | `admin_activity_log` | Admin actions audit trail | ❌ Unused |
| 13 | `admin_notes` | Admin internal notes | ❌ Unused |
| 14 | `admin_reports` | Moderation reports | ✅ Admin (flagged posts) |
| 15 | `platform_status` | Service health | ❌ Unused (mocked in UI) |
| 16 | `system_alerts` | Platform alerts | ❌ Unused (mocked in UI) |

**FK relationships present:**
- `predictions.user_id → users.id` (CASCADE)
- `predictions.match_id → matches.id` (CASCADE)
- `comments.user_id → users.id` (CASCADE)
- `comments.match_id → matches.id` (CASCADE)
- `matches.team1_id → teams.id` (RESTRICT)
- `matches.team2_id → teams.id` (RESTRICT)
- `matches.tournament_id → tournaments.id` (RESTRICT)
- `community_comments.post_id → community_posts.id` (CASCADE)

**Indexes present** (good): `idx_predictions_user_id`, `idx_predictions_match_id`, `idx_predictions_result`, `idx_matches_status`, `idx_matches_match_time`, `idx_users_intel_score`, `idx_comments_*`, `idx_teams_rating`, `idx_teams_win_rate`, `idx_tournaments_*`, plus `predictions_user_match_unique` UNIQUE(user_id, match_id) — this is what enforces one prediction per user per match.

### 1.2 Schema mismatches between Postgres ↔ TypeScript ↔ code

This is the biggest immediate problem. The TS layer assumes columns that don't exist, and inserts/updates use them.

| TypeScript code | What code asks the DB | What's actually in the DB |
|---|---|---|
| `Prediction.predicted_result: 'team1'\|'team2'` | `submitPrediction` writes **`predicted_result`** column | ❌ Column is **`prediction`** (TEXT, single value) |
| `Prediction.confidence?: number` | `submitPrediction` accepts a `confidence` arg, `evaluatePredictions` reads `p.confidence` | ❌ No `confidence` column in `predictions` table |
| `Prediction.predicted_team: UUID` | (not used yet) | ❌ No column |
| `Prediction.score_earned: int` | (referenced in docs) | ❌ No column |
| `users.total_predictions`, `users.accuracy_percentage`, `users.current_streak` | Leaderboard / profile components read these | ❌ No columns (only `intel_score`) |
| `tournaments.match_count`, `tournaments.team_count` | Comments imply denormalized counts | ✅ Columns exist but no trigger updates them |
| `teams.recent_form: text[]` | TS reads as `string[]` | ✅ `text DEFAULT 'LLLLL'` — array form implied, scalar default |
| `prediction.result: 'correct'\|'incorrect'\|'pending'` | Schema has `result TEXT DEFAULT 'pending'`, evaluated to literal `'correct'`/`'incorrect'` | ✅ Matches |
| `prediction.is_correct: boolean` | Schema has `is_correct BOOLEAN` (nullable) | ✅ Matches |

**Consequence:** `submitPrediction` calls `.upsert({ user_id, match_id, predicted_result, is_correct: null, result: null }, { onConflict: 'user_id,match_id' })`. Postgres will:
- **Silently ignore** `predicted_result` (unknown column → strict Postgres would actually reject; relaxed client would drop). On newer Supabase clients this **throws an error**, but the `upsert` form lands in the conflict branch and a `match_id+user_id` row gets created with **`prediction=NULL`** because the code never sets `prediction`.
- Even if it accepted, `evaluatePredictions` later compares `p.predicted_result === predictionResult` where `predictionResult = dbResultToPredictionResult(result)` returns `'team1'` or `'team2'` — these will **never equal what's in the DB** (`prediction` column holds the literal string 'team1' / 'team2', but the comparison uses a different column name → undefined → falsy).
- Confidence-based scoring math is **always using the default 70** because `p.confidence ?? 70` always falls through.

**This is the single most urgent production bug.** It silently breaks the entire prediction/leaderboard loop.

### 1.3 Redundant / overlapping tables

- `community_posts` **and** `comments` both model "user post related to a parent" but in different domains. The mock-elimination guide proposed to merge into one polymorphic `posts` table. The schema *kept them separate*, AND has `community_activity` as a third place that could store the same events. Three tables for one concept ⇒ future drift and query ambiguity.
- `admin_reports` **and** `community_posts.flagged` (implicit) — both store moderation signals.

### 1.4 Unused tables (per app code scan)

`community_activity`, `admin_activity_log`, `admin_notes`, `platform_status`, `system_alerts`, `tournaments.team_count` and `match_count` (no trigger), `teams.key_player` (not displayed yet), `tournaments.match_count`/`team_count` denorm counters, and the entire `community_` family not referenced by any page.

### 1.5 Missing-for-feature tables

The audit was asked to check tables needed for: **match tracking**, **user predictions**, **scoring system**, **leaderboard snapshots/history**.

Currently:

| Need | Status | What's missing |
|---|---|---|
| Match tracking | ✅ Present (`matches` + FKs to teams/tournaments) | `best_of`, `veto_data`, `map_pool`, live score columns if you want streaming |
| User predictions | ⚠️ Schema present, type layer wrong | `confidence`, `predicted_team_id` (FK to teams), `score_earned`, `evaluated_at`, `evaluation_source_version` |
| Scoring system — current | ⚠️ Stored on `users.intel_score` with no audit | A `scoring_events` table to make every +/- delta auditable (id, user_id, match_id, prediction_id, delta, reason, created_at) |
| Scoring system — predicted | ❌ Not queryable | `prediction_points`, base/bonus/multiplier breakdown per row |
| Leaderboard snapshots/history | ❌ Missing | `leaderboard_snapshots(user_id, rank, intel_score, snapshot_date)` — required for "rank over time" and any retroactive recalculation |
| Streak history | ❌ Missing | `user_streaks` or storing `current_streak` on `users` only is fragile (lost on reset) |
| Audit / re-scoring | ❌ Missing | Any way to recompute an old match's impact without re-running JS loops |

### 1.6 Normalization issues

- `matches` has both legacy `team1 TEXT`, `tournament TEXT`, AND new `team1_id UUID`, `tournament_id UUID`. Both will be present (legacy columns are still NOT NULL on `team1`/`team2`, optional on `tournament`). The TS layer in `toMatch()` already has the polyfill logic to read either, but the **legacy TEXT columns are the constraint that breaks data integrity** — `team1` is freeform text, so two different rows could store "FaZe" vs "Faze Clan" as different teams. The team_id FK on `teams.id` exists, but for old rows `team1` (text) can be 'whatever the admin typed'.
- `matches.status` is TEXT (no enum or CHECK constraint) → values like "completed " (trailing space) or "CANCELLED" can pass.
- `predictions.result` is TEXT without a CHECK constraint either. Pending/correct/incorrect are by convention only.

### 1.7 RLS posture

- **Public read** (`anon`): users, matches, predictions, teams, tournaments, comments, community_categories/tags/posts/comments. Wide-open — anyone (including unauthenticated visitors) can see usernames, avatars, and what every user predicted on every match.
- **Self write** (`authenticated`): users (own row), predictions (own row for INSERT), community_posts (own author), community_comments (any authenticated can comment).
- **Admin write**: matches (insert/update/delete via `matches_admin_*` policies), teams (write), tournaments (write).
- ⚠️ Policies on `community_activity` and `admin_activity_log` are bizarre: they reference `auth.role() = 'service_role'`, which blocks all role-based insert/update, but the policy uses `USING` only (no `WITH CHECK`). Combined with the default `GRANT ALL`, this is a confusing half-protection.
- ⚠️ **No RLS rule controls `intel_score` writes** — the policy `Users can update own profile` lets ANY user UPDATE any column on their own row, **including `intel_score`** (a user is otherwise non-admin). This means a logged-in user can `supabase.from('users').update({ intel_score: 999999 })` for their own row and the policy allows it. **Critical integrity gap.**
- ⚠️ `predictions` row-level UPDATE is not policy-restricted — once a prediction exists, a user can update it after the match has been resolved.

---

## 2. Data Flow Architecture

### 2.1 Current end-to-end flow (code-traced)

```
Admin (a) → POST /api/admin/matches/:id/resolve   [PATCH-style payload: { result: 'team1_win' }]
  └── app/api/admin/matches/[id]/resolve/route.ts
        └── resolveMatchAndUpdateScores(supabaseServer, matchId, result)
              ├── requireAdmin(supabaseServer)            // admin check (good)
              ├── getMatchById(supabaseServer, matchId)   // current state
              ├── guard: if status==completed && result same → no-op return
              ├── UPDATE matches SET result=?, status='completed'
              └── evaluatePredictions(supabaseServer, matchId, result)
                    ├── SELECT * FROM predictions WHERE match_id=…
                    ├── compute userDeltas = reduce(predictions, …)   // in-memory
                    ├── for each prediction:
                    │     UPDATE predictions SET result, is_correct   // serial
                    └── for each (userId, delta):
                          SELECT users.intel_score WHERE id=userId   // read
                          UPDATE users.intel_score SET …             // write
```

### 2.2 Failure modes & weak points

| # | Where | Weak point | Consequence |
|---|---|---|---|
| W1 | `evaluatePredictions` final loop | Read-then-write race on `users.intel_score` | With two matches resolving concurrently for the same user, both read old score, both write ⇒ lost-update |
| W2 | App-side scoring entirely | No SQL transaction across `UPDATE matches`, `UPDATE predictions`, `UPDATE users` | If a network error breaks JS mid-loop, you can have matches marked completed with some predictions scored and others pending, and some users' intel_score updated while others aren't |
| W3 | `submitPrediction` upsert | Uses `predicted_result` column that does **not exist** | Inserts land with `prediction=NULL`; future evaluation reads can't determine what the user picked |
| W4 | `submitPrediction` upsert | No confidence stored | Consequence of W3; confidence weight is dead code — every prediction scores the same fixed value |
| W5 | `evaluatePredictions` | `result='draw'` case | `dbResultToPredictionResult('draw')` returns `null`, so every prediction becomes "incorrect" and users get **penalized** for picking either side. There is no "draw returned → no points lost" policy |
| W6 | `resolveMatchAndUpdateScores` guard | `if (status==='completed' && result same) return` | If admin corrects a wrong result (`team1_win → team2_win`), the guard's `match.result === result` fails (good, recomputes), but the **prior intel_score deltas were never rolled back** ⇒ double counting or permanent bias |
| W7 | `evaluatePredictions` | `Math.max(0, … + delta)` | Wrong-prediction negative delta clamped at 0 ⇒ user never goes negative. Effective outcome: a fully incorrect predictor hits `intel_score=0` and stays there; `users_intel_score_non_negative` CHECK + JS clamp combine to lose negative scoring information |
| W8 | `comments` (match comments) | Created via RLS-only policy, no API | Frontend can't actually comment on matches; `getComments()` exists but there's no `createComment()` |
| W9 | `community_*` | Tables exist, no API rods through them | Capability gap, not yet wired — fine for now, but the DB scaffolding has rot potential |
| W10 | Leaderboard recomputation | `getLeaderboard` only sorts by `intel_score DESC` | There's no way to recompute the leaderboard from raw predictions without JS loops and `recalculateAllIntelScores`-style ops that the audit didn't show existing |

### 2.3 What should be SQL triggers / RPCs (and isn't)

- **`evaluate_match_predictions(p_match_id, p_result)`** PL/pgSQL function — single atomic transaction:
  1. Reads `matches.status`; throws on already-resolved-with-same
  2. Updates match to `status='completed', result=…, completed_at=now()`
  3. Iterates `predictions` and updates each prediction row in one statement (`UPDATE … FROM (SELECT …) WHERE …`)
  4. Bulk-updates `users.intel_score` with one `UPDATE … FROM (VALUES) …` statement, also writing each delta to a `scoring_events` insert
  5. All wrapped in a transaction; if anything fails, entire batch rolls back

- **`trigger_after_prediction_insert`** (optional) — increment `users.total_predictions`
- **`trigger_after_prediction_evaluated`** — increment `users.correct_predictions` when `is_correct=true`, recalc `accuracy_percentage`, update `current_streak`
- **`trigger_after_match_completed`** — recompute `tournaments.match_count`, `teams.recent_form`, `teams.total_wins`, `teams.total_matches`, `teams.win_rate`, optionally Elo (handled better in app, not DB)

This collapses 6+ round trips and the lost-update race into a single PG transaction.

---

## 3. Scoring System Integrity

### 3.1 Determinism

Scoring as currently written is **deterministic given the inputs**, but **non-idempotent given a re-run**:
- Re-running `evaluatePredictions` on a match whose status is `completed` with the same result ⇒ currently short-circuits, **OK**
- Re-running with a **different** result ⇒ the guard fails, `evaluatePredictions` runs again, each user's `intel_score` is incremented again **on top of the previous delta** ⇒ scores balloon
- Result correction path is **fundamentally broken** for the same reason: there's no compensating transaction.

### 3.2 Historical recalculation

There is **no path** to recalculate a historical score from raw data:
- `users.intel_score` is mutated in place; no event log
- `predictions.result` and `predictions.is_correct` are set in place; no `evaluated_at` timestamp ⇒ you can't tell when a row was scored
- No `scoring_events` table ⇒ the only audit is the current aggregate
- Therefore: when the rules change (e.g., "confidence now weights 1x/1.5x/2x"), there is no way to retroactively recompute. You would have to write a one-off script that guesses what users picked at different times.

### 3.3 Anti-tampering consistency

- **Open:** RLS allows a user to update their own `intel_score`, and to update their own predictions row. There is no DB-level guard that "predictions may not be modified after `matches.status='completed'`".
- **Open:** `admin_reports.status` is a freeform text with default `'open'` — admin moderation has no enforced enum and no FK to a `report_statuses` table.
- **Partial:** `predictions_user_match_unique` enforces "one prediction per user per match" — good.
- **Partial:** `users_intel_score_non_negative` is a CHECK constraint, but `Math.max(0, ... + negative_delta)` in JS **also** clamps at 0. These two combine so that the negative score loss disappears silently when `delta < current_score`.

### 3.4 User `intel_score` source-of-truth

- `users.intel_score` is **the only** canonical score. There is **no scoring_events audit table**.
- This means the column is both the truth and the cache — when it drifts (bad update, partial eval), you can't reconcile.
- The right design: `users.intel_score` is a materialization of `SUM(delta) FROM scoring_events WHERE user_id=…`, refreshed by trigger on each event insert.

### 3.5 Elo / team ratings

`lib/ratings.ts` contains a compute-only Elo implementation (`computeTeamRatings`) that runs in memory over `CompletedMatch[]`. Findings:
- Elo is **not persisted to `teams.rating`** from this function — only initial seeds live in the column (`DEFAULT 2000`).
- The page showing team rankings (`/rankings`) probably reads `teams.rating` directly. Means **the displayed Elo is whatever was seeded**, NOT what results imply.
- Winner-id-based `computeExpectedScore`/`computeRatingChange` look correct mathematically but `computeTeamRatings` has a minor bug:
  ```ts
  current.change = Math.round((current.rating - avg) * 0.05)
  // where avg = (previous + reference) / 2 of *neighbors*, not the team's own baseline
  ```
  This assigns a "change" delta using neighboring ratings, which is a synthetic display gimmick rather than a true period-over-period change. It also produces zero for the first team (since avg averages with itself).
- Elo K-factor `computeKFactor`: `rating < 1100 ⇒ 1.1×K`, `rating > 1400 ⇒ 0.9×K`. With `K_FACTOR_BASE=32` that's a 16→32 range, plausible.
- No Elo persistence ⇒ ratings page is essentially presenting seeded data and there is no feedback loop from match results.

### 3.6 Other bugs worth noting in the scoring code

- `evaluatePredictions`: `p.confidence ?? 70` reads a non-existent column. So every prediction scores the **same fixed amount** regardless of user-confessed confidence.
- `getMatchPredictionStats`: averages `Number(p.confidence ?? 70)` ⇒ also pulled from non-existent column, so **average confidence is hardcoded to 70** for all matches.
- `calculateIntelScore`: same issue. The score is "10 × confidence" correctly written but confidence is always `?? 50` fallback (and actually never stored), so the function is effectively `(+ or -) × 500` per prediction in JS, independent of stored data.
- `getLeaderboard`: hard-codes `accuracy: 0, predictions: 0, correct: 0, streak: 0, rank: index+1`. **Streak is never computed** anywhere in the codebase; the leaderboard column for `streak` is cosmetic.
- `recalculateAllIntelScores` is referenced in `AUDIT_REPORT.md` as existing but isn't in `lib/api/index.ts` (the audit was older). The function may have been removed; if so, the rollback path for cohorts of incorrect scores is gone.

---

## 4. Migration & Schema State

### 4.1 Current state assessment

The "single remote snapshot migration" file (`20260622224053_remote_schema.sql`) is a CLI-pulled full SQL dump of the live DB. It contains DDL for tables, constraints, indexes, policies, grants, and one trigger. **As a version-control artifact it is dangerous**:
- It is a snapshot, not a delta — running it again on an already-current DB is mostly idempotent (`CREATE TABLE IF NOT EXISTS`), but it cannot represent *how* the schema arrived here or *what should change next*.
- It includes `ALTER DEFAULT PRIVILEGES FOR ROLE postgres` grants that override the Supabase defaults — these can quietly change permissions on objects created later.
- It re-declares policy names with "Allow public read access to matches" duplicating policy intent without `DROP POLICY IF EXISTS` guards. If re-applied, it will silently fail or accumulate duplicate policies.

### 4.2 Recommended clean migration strategy

Build a self-contained, append-only migration history from this point forward:

```
supabase/
  migrations/
    20260622000000_baseline_schema.sql        # exact contents of the pulled snapshot, frozen
    20260622001000_fix_predictions_columns.sql # add confidence, predicted_team_id, rename payload column
    20260622001100_predicted_team_fk.sql       # FK predictions.predicted_team_id → teams.id
    20260622001200_add_scoring_events.sql      # scoring_events table + indexes
    20260622001300_evaluate_match_rpc.sql      # PL/pgSQL function with single-transaction guarantee
    20260622001400_evaluate_match_grants.sql   # GRANT EXECUTE ON FUNCTION … TO service_role
    20260622001500_user_stats_canonical.sql    # Add total_predictions, correct_predictions, accuracy_pct, current_streak, last_evaluated_at columns
    20260622001600_protect_intel_score_rls.sql # Drop blanket update policy; replace with column-level + RPC-only writes
    20260622001700_predictions_immutable_after_resolved.sql # Trigger blocking UPDATE on prediction rows where match is completed
    20260622001800_match_status_enum.sql       # Convert matches.status + result TEXT → CHECK constraints
    20260622001900_dedup_legacy_team_text.sql  # Backfill matches.team1_id from matches.team1 for legacy rows
    20260622002000_team_rating_persistence.sql # Add trigger to recompute teams.rating via Elo on match completion
    20260622002100_v1_correction_backfill.sql  # The corrective data pass: re-score all historical matches via the new RPC
    20260622002200_decommission_mocks.sql      # DROP comments/community_* unused → DROP only after UI cutover
```

Each migration:
- Begins with `BEGIN;` and ends with `COMMIT;`
- Uses `IF NOT EXISTS` / `DROP IF EXISTS` guards
- Includes a `-- VERIFY` block (commented) that lists verification queries
- Pairs with a corresponding rollback in `supabase/migrations/_rollback/` (git-only, not deployed)

The pipeline that runs these is Supabase CLI's `supabase db push` which tracks `_supabase_migrations` for you. **The current setup (CLI snapshot only)** should be kept as a one-time `baseline` and never re-edited in place.

### 4.3 Where to add new migrations forward

For any of the recommendations in §5, ship as a numbered forward migration. Do not edit existing migration files. Keep the single big snapshot file under `supabase/migrations/_legacy/` (a `.gitignore`'d directory) once the new history is in place.

### 4.4 RLS hardening plan

1. Replace the blanket `Users can update own profile` UPDATE policy with a column-aware variant that:
   - Allows the user to edit `username`, `avatar`, `email` only
   - Disallows any user from editing `intel_score`, `is_admin`, `created_at`
   - Admin override via `is_admin=true` ⇒ full row
2. Add a `predictions_no_update_after_completed` trigger that raises if `matches.status='completed'` for the prediction's match.
3. Tighten `community_activity` and `admin_activity_log` to use `WITH CHECK` clauses or move their access behind service-role-only RPCs.
4. Decide explicitly: do we want **public read of every user's prediction**? Today the `anon` role can query all predictions. That's a privacy issue for users who don't want their picks visible. Recommend a two-tier policy:
   - `predictions_public_count` view that returns aggregates by user_id
   - predictions row data read restricted to `authenticated` users (or opt-in per user)

### 4.5 Auth posture and admin enforcement

- `requireAdmin` calls up to the JS client (default Supabase client with session cookie) and then `getUserProfile` re-queries `users.is_admin`. This is correct (the policies don't trust the client for admin ops).
- `app/api/admin/matches/[id]/resolve/route.ts` (per audit context) calls `resolveMatchAndUpdateScores`, which calls `requireAdmin` again — defense in depth, good.
- However, **`setMatchResult` and `resolveMatchAndUpdateScores` use the request-scoped Supabase server client.** If the route imports `supabase` (the browser-y client) anywhere, admin writes route through it and RLS works but loses defense-in-depth. Audit shows the admin route uses `createSupabaseServer` — verify all admin write paths do, including any future RPC calls.

---

## 5. Recommendations (Prioritized)

> Convention: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

### 🔴 Critical — block production correctness

#### C1. Fix `predictions` schema/code mismatch
- **Problem:** Code inserts `predicted_result`, reads `confidence` and `predicted_result`, but the table has `prediction` (TEXT) and no confidence column.
- **Fix (migration):**
  ```sql
  -- 1. Add the missing columns
  ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS confidence INTEGER NOT NULL DEFAULT 70
      CHECK (confidence BETWEEN 50 AND 100),
    ADD COLUMN IF NOT EXISTS predicted_team_id UUID REFERENCES teams(id),
    ADD COLUMN IF NOT EXISTS score_earned INTEGER,
    ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ;
  -- 2. Backfill prediction from legacy column (predict from 'team1' / 'team2' strings)
  UPDATE predictions SET prediction = LOWER(prediction);
  -- 3. Drop the broken column if you truly rename it
  -- ALTER TABLE predictions DROP COLUMN predicted_result;  -- only after UI commit
  ```
  Then fix `lib/api/index.ts`:
  - `submitPrediction` writes `{ user_id, match_id, prediction: 'team1'|'team2', confidence }`
  - `evaluatePredictions` reads `p.prediction` and `p.confidence`
- **Why it matters:** Right now **every** prediction either fails to land or scores identically regardless of confidence. The entire leaderboard is wrong.

#### C2. Replace JS scoring orchestration with a single PG transaction
- **Problem:** `evaluatePredictions` does N+1 round trips on read-update of `users.intel_score`; no rollback on partial failure.
- **Fix:** PL/pgSQL RPC `evaluate_match_predictions(p_match_id uuid, p_result text)` that performs match update + predictions update + users update + scoring_events insert **inside a single transaction** with row-level locking on the affected users (`SELECT … FOR UPDATE`).
- **Why:** Atomic, race-safe, idempotent by virtue of `IF matches.status='completed' THEN error`, no partial-failure windows.

#### C3. Close the `intel_score` RLS hole
- **Problem:** `Users can update own profile` lets any user update their own `intel_score`.
- **Fix:** Replace with a column-restricting CHECK in the policy body, plus move `intel_score` writes to a security-definer RPC only callable from the evaluate RPC (and an explicit admin override).
- **Why:** A malicious user can self-promote to top of the leaderboard trivially.

#### C4. Add `scoring_events` audit table
- **Problem:** No historical record of how a user earned their `intel_score`. Can't recalculate or audit.
- **Fix:**
  ```sql
  CREATE TABLE scoring_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    match_id uuid REFERENCES matches(id),
    prediction_id uuid REFERENCES predictions(id),
    delta integer NOT NULL CHECK (delta <> 0),
    reason text NOT NULL,
    scoring_version text NOT NULL,        -- e.g. 'v1'
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_scoring_events_user_created ON scoring_events(user_id, created_at DESC);
  ```
  Insert one row per user per match evaluation, inside the same transaction as the score update.
- **Why:** Without this, any scoring rule change is permanent data loss.

#### C5. Block prediction mutation after match is resolved
- **Problem:** RLS lets users update their predictions at any time, including after a match is resolved.
- **Fix:** Trigger on `predictions` BEFORE UPDATE that raises if the row's match has `status='completed'`.

### 🟠 High — production soundness

#### H1. Add `predicted_team_id` FK on predictions
- Replace string `prediction` column with a UUID FK to `teams(id)`. Strict referential integrity prevents "team1" / "Team 1" string drift.
- Carries `prediction=text("team1_win"|"team2_win"|"draw")` separately if you want to keep the result enum textual — but **probably you want `prediction` to mean the user's pick as a team FK**, and `result` to mean the match outcome.

#### H2. Add CHECK constraints to enum text columns
- `matches.status` → CHECK IN ('upcoming','live','completed')
- `matches.result` → already constrained, good
- `predictions.result` → CHECK IN ('pending','correct','incorrect')
- `predictions.prediction` → CHECK IN ('team1','team2') once normalized
- `tournaments.status` → already constrained, good
- `admin_reports.status` → ensure CHECK

#### H3. Move team Elo persistence into a trigger / scheduled recompute
- Today, `teams.rating` is a stale seeded column.
- Either: a) `AFTER UPDATE OF result on matches` trigger recomputes both teams' Elo deltas; or b) a Nightly Edge Function calls `recompute_team_elos()` over all completed matches. (a) is faster but more invasive; (b) is regression-safe.
- This is the gap linking `lib/ratings.ts` to reality.

#### H4. De-duplicate `community_*` + `comments` tables
- Pick one model (the polymorphic `posts` table from the necessity review is best), or commit to keeping them disjoint and write the contract down so RLS doesn't allow ambiguity.
- For the audit, recommend: **merge** into one `posts` table with `parent_type` and `parent_id` — drops 4 tables (`community_posts`, `community_comments`, `community_categories`, `community_tags`) plus `comments` ⇒ 1 table, 4 RLS policies collapse.

#### H5. Public/predicted split — restrict direct prediction read for non-self
- The `Allow public read predictions to anon` policy exposes every prediction to every visitor. For a betting-style app this is also a competitive-leakage concern once people play seriously.
- Recommendation: switch predictions.read to authenticated-only, and expose a view `prediction_consensus(match_id, team_counts)` for community sentiment features.

### 🟡 Medium — robustness and operability

#### M1. Normalize legacy TEXT team columns
- Backfill `matches.team1_id` / `matches.team2_id` from `matches.team1`/`matches.team2` strings via a one-shot migration that:
  - Looks up or creates a `teams` row for each unique text
  - Sets FK columns
  - Leaves the text columns for now (deprecate in UI)
- Eventually `DROP COLUMN matches.team1` after UI cutover.

#### M2. Add `last_evaluated_at` and denormalized counters to `users`
- `users.total_predictions`, `users.correct_predictions`, `users.accuracy_percentage`, `users.current_streak`, `users.last_evaluated_at`
- Maintained by `AFTER INSERT/UPDATE` triggers on predictions.

#### M3. Persist score break-down on each prediction row
- Add `prediction.score_earned`, `prediction.base_score`, `prediction.confidence_bonus`, `prediction.streak_multiplier` to make the math transparent per row rather than only the user aggregate.

#### M4. Implement draw-result semantics explicitly
- Current code: on `result='draw'` every prediction becomes "incorrect". That's wrong for most betting UX.
- Recommendation: on draw, all predictions are "correct" with a partial reward (e.g., 0.5× confidence) OR marked "void" (no delta). Codify in DB function, document the rule.

#### M5. Streamline admin pages to use the existing live SQL for everything
- `app/admin/page.tsx` already does this for matches/blog/discussions/reports. Extend to `teams`/`tournaments`/`users` raw admin views (today it's still partial: management happens via `/api/admin/*` but some displays still shell in from `lib/data.ts`). Delete `lib/data.ts` exports that are now backed by real queries.

#### M6. Add unique constraint on `users.email`
- Right now `email` is `text NOT NULL` with no unique. A single email could create multiple accounts. Fix:
  ```sql
  ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  -- (after de-duping any existing duplicates)
  ```

#### M7. Tighten `predictions` write surface
- Restrict INSERT/UPDATE to authenticated user matching `auth.uid() = user_id`.
- Don't allow delete (use a `deleted_at` soft-delete column instead).
- Don't allow `is_correct` or `result` writes from the user — only from the RPC.

### 🟢 Low — polish / future-proofing

#### L1. Add `team_players` table for player-level ratings
- Today `lib/types.Player[]` is sourced from hardcoded arrays (`featuredMatch.team1Players`).
- Table `team_players(player_id, team_id, name, country, role, kd, recent_form[], joined_at)` would feed the real player display.

#### L2. Add `match_predictions_aggregate` denormalized snapshot
- Already proposed in the architecture doc. Useful only if real-world query time for "match X consensus" becomes slow. Profile first.

#### L3. Capture `company_avatar` URL into storage (Supabase Storage)
- User avatars live in a TEXT column today. Move to a Storage bucket + signed URL.

#### L4. Add `audit_log` for admin actions
- `admin_activity_log` exists, but no app code writes to it. Add a helper invoked from every `/api/admin/*` route.

---

## 6. Migration Strategy Summary

**Today:** One big snapshot migration (`20260622224053_remote_schema.sql`). Risk: re-running or branching will lose fidelity.

**Tomorrow (this PR series):**
1. Freeze the snapshot as `supabase/migrations/_legacy/20260622224053_remote_schema.sql` (or just rename and move).
2. Introduce a forward-only migration history starting with a baseline that snapshots the current schema into `baseline_schema.sql`.
3. Each of C1–C5 and H1–H5 ships as its own migration with rollback notes.
4. Wire `supabase db push` (or equivalent) into CI so the team has a single source of truth via `schema_migrations`.
5. Document the modeling contract (per table: source of truth, derived columns, allowed writers) in `docs/SCHEMA_TRUTH.md`.

**Verification cadence:**
- After each migration: run `supabase db lint` (Supabase CLI) + the `_verify.sql` appendix inside the migration.
- After every C/H recommendation shipping: write a unit test in the app (Vitest or node test) that exercises the new RPC end-to-end.
- Weekly: `SELECT pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20` to catch regressions.

---

## 7. Quick Reference: file-level audit map

| File | Verdict | Top issue to fix |
|---|---|---|
| `lib/api/index.ts` | Logic mostly correct, but assumes columns that don't exist | C1 (column rename), C2 (transaction), C5 (immutability trigger) |
| `lib/ratings.ts` | Math OK; Elo never persisted | H3 |
| `lib/types.ts` | Frontend shape is good; `Prediction` shape drifts from DB | Track in C1 |
| `lib/supabase.ts` | Cookie SSR client correct | OK; verify admin routes use `createSupabaseServer` |
| `app/admin/page.tsx` | Recently rewritten against live DB; correct usage of FK lookups | M5 (finish the cutover) |
| `lib/data.ts` | Contains 40+ hardcoded mocks; admin page no longer uses many | M5 |
| `supabase/migrations/20260622224053_remote_schema.sql` | Snapshot; not version-controlled safely | §4 above |
| `docs/database-architecture-final.md` | Comprehensive plan, but **not yet applied** | Adopt as forward migration source |
| `docs/database-necessity-review.md` | Same plan, post-launch deferrals (activity_feed, snapshots) | Verify deferrals still apply |
| `AUDIT_REPORT.md` | Earlier (mock-data) audit; this document supersedes for tech audit | Use this doc going forward |

---

## 8. Final Verdict

**CS Intel is *not* production-ready**:

- The prediction ↔ user-intel_score loop is **silently broken** by the schema/code mismatch (C1).
- Even after C1, the scoring pipeline has **no audit trail**, no atomicity, and partial-failure windows (C2, C4).
- The intel_score column is **RLS-exposed to self-edit** (C3), so users can top their own leaderboard rank.
- Leaderboard UI columns (streak, accuracy) are **placeholder zeros** rather than computed values.

The schema and product vision are sound; the engineering debt is concentrated in three files (`lib/api/index.ts`, `lib/data.ts`, `supabase/migrations/...`). Five focused migrations (C1 → C5) plus two structural ones (H1, H3) close the worst gaps. Total est. effort: **1 senior-engineer week** plus a verification pass.

If you ship *nothing else*, ship **C1 first**. It's a one-migration fix that turns a silently-broken leaderboard into a working one.
