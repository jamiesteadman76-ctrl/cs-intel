# CS Intel — Remediation Rollout

**Date:** June 23, 2026
**Scope:** Ship the schema contract in `docs/SCHEMA_TRUTH.md` and the matching application changes without breaking existing users or pre-migration data.

This is the formal rollout procedure every change set in this remediation follows. Read it top-to-bottom before touching the production database.

---

## The "Ship Now" set

These five migrations are the **minimum viable remediation** that closes the critical bugs found by the audit (`docs/SYSTEM_AUDIT.md`):

| # | Migration | Purpose |
|---|---|---|
| 1 | `20260623000000_add_predictions_confidence.sql` | Adds `confidence INTEGER DEFAULT 50 CHECK 50..100` so scoring is deterministic |
| 2 | `20260623000100_create_scoring_events.sql` | Append-only audit ledger; makes `users.intel_score` reconcilable |
| 3 | `20260623000200_create_evaluate_match_predictions_rpc.sql` | Atomic PL/pgSQL scoring engine with idempotency + result correction |
| 4 | `20260623000300_protect_users_intel_score_trigger.sql` | `BEFORE UPDATE` trigger blocks self-edit of `intel_score` / `is_admin` |
| 5 | `20260623000400_block_predictions_after_match_completed.sql` | Trigger raises if a prediction's `prediction`/`confidence` are mutated after the match is `completed` |

**Plus** the corresponding application-side edits in `lib/types.ts`, `lib/api/index.ts`, `app/predictions/page.tsx`, `app/profile/page.tsx`, and the admin resolve route that swaps from JS orchestration to the new RPC.

### Code change scope

- `lib/api/index.ts`
  - `submitPrediction(matchId, team1Win, confidence = 50)` now writes `prediction` and `confidence` columns.
  - `evaluatePredictions` is replaced by a single RPC call (`sb.rpc('evaluate_match_predictions', …)`).
  - `resolveMatchAndUpdateScores` becomes a thin wrapper that delegates to `evaluatePredictions`.
  - `getPredictions`/`getAllPredictions` drop the synthetic `prediction?: boolean` (no longer needed) — callers compare `row.prediction === 'team1'` directly.
  - `getMatchPredictionStats` reads stored `confidence`, no `?? 70` fallback.
  - `calculateIntelScore` honors `'void'` results (no delta) and uses stored `confidence` (no `?? 50` fallback).
- `lib/types.ts`
  - `PredictionHistory.result`, `MyPrediction.result` unions gain `'void'`.
- `app/predictions/page.tsx`
  - `statusConfig` / `statusLabel` get a `'void'` entry.
  - Consensus math uses `pred.prediction === 'team1'` instead of truthy.
- `app/profile/page.tsx`
  - `prediction: p.prediction ? 'Team 1 wins' : 'Team 2 wins'` → `prediction: p.prediction === 'team1' ? 'Team 1 wins' : 'Team 2 wins'`.
  - The "correct/incorrect/pending" ternary gets a `'void'` branch.

---

## Step-by-step rollout

### Step 0 — Pre-flight (10 minutes)
1. Confirm a Supabase backup has run within the last 24h (or trigger one via Dashboard → Database → Backups).
2. Ensure the local `supabase` CLI is logged in (`supabase login`) and linked (`supabase link --project-ref <ref>`).
3. Run `supabase db lint` against the staged migrations; treat warnings as blockers.
4. Stage the migration files into `supabase/migrations/` and commit them in a single PR titled `remi: scoring v1 (ship-now)`.

### Step 1 — Ship migrations 1→5 in order (production)

```bash
supabase db push --include-all
# OR, sequentially:
supabase db push --file 20260623000000_add_predictions_confidence.sql
supabase db push --file 20260623000100_create_scoring_events.sql
supabase db push --file 20260623000200_create_evaluate_match_predictions_rpc.sql
supabase db push --file 20260623000300_protect_users_intel_score_trigger.sql
supabase db push --file 20260623000400_block_predictions_after_match_completed.sql
```

**Per-migration verification checklist** (run the `-- VERIFY` block at the bottom of each file). Each migration has a corresponding `-- ROLLBACK` block, but only invoke those if the migration itself succeeded — ROLLBACK on a failed migration is a no-op.

**Expected backward compatibility while migrations run:**
- Migration 1 (confidence DEFAULT 50) is online — adding a NOT NULL with a DEFAULT does not rewrite the table on Postgres 11+, so it is non-blocking.
- Migration 2 (new table) is online — does not touch existing tables.
- Migration 3 (new function) is online — does not touch existing data.
- Migration 4 (new trigger) is online — adds a BEFORE UPDATE row trigger; evaluated per row on subsequent writes. No data rewrite.
- Migration 5 (new trigger) is online — same as Migration 4.

### Step 2 — Deploy application changes (within the same deploy window)

- Frontend env stays on the *old* JS scoring path until you flip a feature flag (see "Feature flag" below).
- As soon as the new build is live, the `submitPrediction` function writes the audit-friendly payload. The frontend does **not** need to know the column was renamed — `submitPrediction` keeps the same TS signature; only the `prediction` column stored differs.

**Hard precondition:** *RPC migration 3 must already be deployed* before this code deploys. Otherwise, an admin who attempts to resolve a match will hit a PostgREST error: `function public.evaluate_match_predictions(uuid, text, text, boolean) does not exist`. Plan the application deploy ≤ 5 min after migrations finish.

### Step 3 — Flip the resolver flag

Until step 3, an admin resolve still flows through the broken JS path. The new code path activates only after the feature flag flip.

Recommended flag: `RESOLVE_MATCH_VIA_RPC` (boolean, defaulting to `false`).

```ts
// lib/api/index.ts
const RESOLVE_VIA_RPC = process.env.NEXT_PUBLIC_RESOLVE_MATCH_VIA_RPC === 'true';
// or read from a runtime config table for faster rollback during incident
```

Ship the flag = `false` first. Confirm in production:
1. Smoke-test that `submitPrediction` writes the new columns.
2. Confirm `predictions.confidence` non-null for new rows.
3. Manually run the RPC in SQL editor against a non-public match to see its output.

Then flip to `true`. Watch logs for `evaluate_match_predictions` errors over the next hour.

If any error rate > 1% during the first hour → roll back the flag (no DB migration rollback needed). The previous JS path was already broken in a different way, so it is still safe to use as a fallback during incident triage.

### Step 4 — Backfill historical matches (out-of-band)

The new RPC accepts a 4th argument `p_force boolean`. To recompute all previously-evaluated matches, run a one-shot script **outside any migration** (e.g. an Edge Function or a manual psql loop). For N matches this is N transactions; throttle to avoid replication lag.

```sql
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT id, result FROM public.matches
     WHERE status = 'completed'
     ORDER BY match_time
  ) LOOP
    PERFORM public.evaluate_match_predictions(r.id, r.result, 'v1_backfill', TRUE);
  END LOOP;
END $$;
```

Constraints:
- **Run during a maintenance window** — it triggers UPDATE on `predictions`, `users`, and `scoring_events` for every historical match. For 1k matches @ ~5 ms/tx, ≈ 5 s total. For 10k+, consider chunked runs every N minutes.
- **Expected drift**: depending on how the original "broken" code worked, pre-remediation `users.intel_score` may have been inflated (everyone saw 0 consensus votes and was scored as -350 × N). The backfill fixes those users' scores to the corrected math. This is **a desired change**; treat any score movement as intended.
- If the team wants a "score reset announcement," coordinate with community/product before running.

### Step 5 — Drop backwards-compatibility flag

After 7+ days of stable RPC usage with no incident, remove:
- The `RESOLVE_MATCH_VIA_RPC` flag.
- The (now-empty) JS fallback in `evaluatePredictions`.
- `SET predicted_result`, `predicted_result` reads anywhere (the audit confirmed these have been eliminated).

---

## Sequential migration / deploy diagram

```
Day 0, 14:00 UTC  Migration 1 (confidence column) — idempotent
Day 0, 14:05      Migration 2 (scoring_events table)
Day 0, 14:10      Migration 3 (SCP RPC + grants)
Day 0, 14:15      Migration 4 (intel_score trigger)
Day 0, 14:20      Migration 5 (prediction immutability trigger)
Day 0, 14:30      Application deploy with flag=false        ← no behavior change yet
Day 0, 16:00      Smoke test RPC in SQL editor
Day 0, 17:00      Flip flag=true                              ← resolve path live
Day 1, 09:00      Backfill historical matches (if planned)
Day 7, 18:00      Remove flag + JS fallback
```

---

## Risk analysis

Each item rates **likelihood** (L/M/H) × **impact** if it goes wrong, with mitigation already in the plan.

### R1. Migration 3 fails (RPC definition error) — L × H
**Symptom:** `supabase db push` rejects the file because of a SQL syntax error inside the function body.
**Mitigation:**
- Run `--dry-run` first if the CLI supports it; use the SQL editor locally to validate each migration before push.
- Each migration has a `-- ROLLBACK` block in its trailing comment; the function body is wrapped in `$fn$ … $fn$` tags so a syntax error is locatable in seconds.
- Worst case: ship migrations 1, 2 only; ship 3-5 in a follow-up PR.

### R2. RPC deadlock under concurrent evaluation — L × M
**Symptom:** Two admin users resolve overlapping batches at the same time; second call hangs.
**Root cause:** lock-ordering divergence from per-call query path.
**Mitigation:** All FOR UPDATE paths in the RPC acquire locks in the **same** order: match row → users sorted by `user_id` ascending. The deterministic order means the deadlock detector (10s default) fires predictably and Postgres aborts one of the parallel calls with `deadlock_detected`. The API returns 409 to the admin; admin retries. No data corruption.

### R3. Backfill drift on scores — M × M
**Symptom:** Some users' `intel_score` jumps after the historical backfill because the old JS path was buggy and the new path is correct.
**Mitigation:**
- Document the change in release notes; users may email support if they are surprised.
- Optionally snapshot users.intel_score BEFORE the backfill (`SELECT * INTO backup.users_intel_score_pre_v1 FROM users;`) so a one-line restore is available for a single user if escalated.

### R4. RPC grant rejected on Supabase project — L × H
**Symptom:** `supabase db push` succeeds, but `GRANT EXECUTE … TO service_role` raises because the role does not exist on this project.
**Mitigation:** On Supabase Cloud the `service_role` exists by default. On self-hosted, replace the grant with `TO your_admin_role` and document it.

### R5. Trigger `protect_users_sensitive_columns` interferes with admin tooling — L × M
**Symptom:** An admin user opens Supabase Studio and edits a row directly; `is_admin` flip silently reverts.
**Mitigation:** This is the **intended** behavior. The trigger only defends against *client-side* tampering through RLS-bypassing API calls. Database console access (`service_role` or `postgres`) is allowed because the trigger's session_user check accepts `postgres`/`service_role`.

### R6. Frontend bundle still sends `predicted_result` after API deploy — M × L
**Symptom:** Supabase returns `400 — column "predicted_result" of relation "predictions" does not exist`.
**Mitigation:** The application PR is a single atomic deploy with the migration PR. There is no intermediate state where the old API is still reachable. If you want belt-and-braces, ship the new API code *behind* the feature flag described in Step 3.

### R7. Two concurrent match resolutions on the SAME match — L × M
**Symptom:** Two admins click "Resolve" within the same second.
**Mitigation:** Same as R2. First call wins; second call's `FOR UPDATE` on `matches` blocks until commit, then enters the `previouslyResolved = true` branch and returns `success: true, previouslyResolved: true`. The API layer surfaces this to the UI so the second admin sees "already resolved" instead of a confusing zero-row result.

---

## Communication & rollback

- **Slack channel** for live ops: pin a message summarising Migrations 1-5 with timestamps.
- **Status page** banners:
  - T-24h: "Scheduled scoring engine upgrade at 14:00 UTC. Predictions and admin actions continue to work."
  - T+0: "We are deploying the new scoring engine. Disruption window: <5 min."
  - T+30: "Upgrade complete. Resolves now use the secure RPC."
- **Rollback procedure** (no data loss):
  1. Flip `RESOLVE_MATCH_VIA_RPC` flag back to `false` if RPC execution is misbehaving. Data is intact.
  2. If migrations themselves need unwinding, run the `-- ROLLBACK` block from the most recent failed migration in reverse order. Stop at the last successful migration.
  3. The plateau (migrations 1-5 deployed, RPC disabled by flag) is a stable state; no user data is exposed.
- **Hard wait**: do NOT drop columns (`prediction`, `result`, `is_correct`, `evaluated_at`) for at least 60 days after Step 5. The audit trail in `scoring_events` is the only path to recover trust if something is later proven wrong.

---

## Post-rollout retention

- The PL/pgSQL source of the RPC must stay in version control.
- Any new scoring rule (e.g. confidence-weighted curves, streak multipliers) must ship with:
  - A new `scoring_version` value
  - A migration that adds the new rule (without removing the old one)
  - A backfill that lets historical events opt into the new rule IF they want
- Never delete `scoring_events` rows. The table is intentionally append-only-with-correctable-history, not immutable.

---

## Open shutdown sequence (for one year out)

If/when we want to retire the per-row denormalisation and switch the leaderboard to a fully materialised view:

1. Create `public.leaderboard_snapshot` (one row per user per day, populated by a scheduled job).
2. Switch `/api/leaderboard` reads to it.
3. After 30 days of stable reads, declare `users.intel_score` a *cache* and document the cache lifecycle in `docs/SCHEMA_TRUTH.md`.

Until then: the audit's design choice — `intel_score` as a derivable denormalisation driven solely by `scoring_events` rotation — is the right tradeoff between leaderboard read latency and retroactive rule changes.
