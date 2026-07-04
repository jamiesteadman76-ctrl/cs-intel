# CS Intel — Production Monitoring & Integrity Detection Layer

**Date:** June 23, 2026
**Scope:** Trust-verification and protection layers for the production scoring pipeline. Strictly additive — does NOT modify scoring logic, the RPC, or existing business rules.
**Companion docs:** `docs/SCHEMA_TRUTH.md`, `docs/POST_REMEDIATION_VALIDATION.md`, `docs/SYSTEM_AUDIT.md`.

This document is the operational contract for: drift detection, replay verification, integrity guards, observability, and alerting. Every component is additive to a system that is already production-stable.

---

## 1. Score Drift Detection System

**Goal:** catch the moment `users.intel_score` and `SUM(scoring_events.delta)` disagree — the canonical "drift" signal that something outside the RPC wrote to score.

**Detection strategy:**

1. **Observer triggers** capture every change to the protected columns, classified by `reason` (`rpc_legitimate`, `service_legitimate`, `reverted_by_protect_trigger`, `suspicious_direct_write`). See migration `20260623001000`.
2. **Replay function** `public.verify_leaderboard_integrity()` returns rows where `stored_intel_score ≠ derived_intel_score`, ordered by `|delta_mismatch|`. See migration `20260623001100`.
3. **Hourly scheduled job** (Edge Function or `pg_cron`) calls the replay function. Zero rows ⇒ healthy.

**Baseline being compared against:**

| Stored | Source of truth | Refresh trigger |
|---|---|---|
| `users.intel_score` | Running sum of `scoring_events.delta` per user | RPC `evaluate_match_predictions` only |
| `SUM(scoring_events.delta)` | The append-only ledger | RPC `evaluate_match_predictions` only |

The system invariant asserted by this design is:

> **`users.intel_score = SUM(scoring_events.delta)` for every user, ALWAYS.**

Post-migration-005 (delta-clip), the math holds under reversals, voids, and concurrency. Any future divergence is a real bug; any *observed* divergence is a tamper attempt.

**Drift sources we detect:**

| Source | Detection |
|---|---|
| Direct UPDATE of `intel_score` from non-privileged client | BEFORE trigger reverts silently; audit `reason='reverted_by_protect_trigger'`; replay `delta_mismatch=0` (no damage) |
| Direct UPDATE from `service_role` outside RPC | audit `reason='service_legitimate'`; **admin-actionable — investigate immediately** |
| RPC partial failure / transaction rollback | Audit log shows the start; replay shows divergence only if SOMETHING persisted out-of-order (which cannot happen — RPC is one atomic txn) |
| Application double-write (legacy JS path still being used post-feature-flag flip) | Replay detects the untracked inflate/deflate |

---

## 2. Replay Verification System

**Algorithm:** for every user, sum `scoring_events.delta`, compare to `users.intel_score`. Return divergent rows.

**Implementation (migration 011):**

```sql
CREATE VIEW public.leaderboard_replay AS
SELECT u.id, u.username,
       u.intel_score                              AS stored_intel_score,
       COALESCE(SUM(e.delta), 0)                  AS derived_intel_score,
       u.intel_score - COALESCE(SUM(e.delta), 0)   AS delta_mismatch,
       COUNT(e.id)                                AS event_count,
       MAX(e.created_at)                          AS last_event_at
FROM public.users u
LEFT JOIN public.scoring_events e ON e.user_id = u.id
GROUP BY u.id, u.username, u.intel_score;

CREATE FUNCTION public.verify_leaderboard_integrity() RETURNS TABLE (...)
LANGUAGE sql STABLE AS $$
  SELECT * FROM leaderboard_replay
   WHERE stored_intel_score <> derived_intel_score
   ORDER BY ABS(delta_mismatch) DESC;
$$;
```

**Where SQL lives:** migration `20260623001100_create_verify_leaderboard_integrity.sql`. Pure-read, no row writes; can be invoked freely.

**Run cadence:**

| Frequency | Use case |
|---|---|
| Every resolve | Embedded future job — currently N/A (RPC is already atomic) |
| Hourly | cron / Edge Function; reports `verify_leaderboard_integrity()` to Sentry/Datadog; only alert on >0 rows |
| On-demand | Admin clicking "verify integrity" on `/admin/users/<id>` calls `verify_one_user_integrity(<id>)` |
| After every RPC | Optional — fastest detection, but redundant given the observer triggers already write per-change audit rows |

**Recommended default:** hourly cron call. Detection latency ≤ 1 hour. Cost: one `SELECT` over `users ⋈ scoring_events` for system size ≤ 100k users.

---

## 3. Database Integrity Guards

**Existing guards (already shipped — do NOT alter):**

| Layer | Mechanism | Migration |
|---|---|---|
| Column-level | `trg_protect_users_sensitive_columns` reverts unprivileged UPDATE of `intel_score`/`is_admin` | `…003` |
| Status-level | `trg_block_prediction_updates_after_completed` raises on INSERT/UPDATE of completed-match predictions | `…004`, extended by `…006` |
| Atomic write-level | RPC `evaluate_match_predictions` runs inside one PL/pgSQL transaction with consistent lock order | `…002`, patched by `…005` |
| Row-level (RLS) | Users can only modify `predictions` for their own matches; can only UPDATE own `users.username/avatar/email` | baseline schema |
| RPC-level (GRANT) | `EXECUTE ON FUNCTION evaluate_match_predictions` restricted to `service_role` | `…002`, `…005` |

**Newly-added observation guards (this turn):**

| Layer | Mechanism | Migration |
|---|---|---|
| Audit-log | `trg_audit_users_score_change` AFTER UPDATE on `users` writes classified rows to `audit_log` | `…010` |
| Audit-log | `trg_audit_scoring_events` AFTER INSERT/UPDATE/DELETE on `scoring_events` writes classified rows to `audit_log` | `…010` |

**Pattern: read-only enforcement** for monitoring surfaces is achieved by leaving RLS on `audit_log` with only `SELECT` exposed to admins and ZERO INSERT/UPDATE/DELETE policy for clients. The audit_log table is consequently writable only via SECURITY DEFINER triggers and direct DB-console access.

**Pattern: restricted update path for `intel_score`:**

```
   Direct client UPDATE ──▶ BEFORE trigger (silent revert)
                                 │
                                 └──▶ audit_log.reason='reverted_by_protect_trigger'

   RPC evaluate_match ──▶ AFTER trigger (records legitimate change)
                                 │
                                 └──▶ audit_log.reason='rpc_legitimate'
```

The BEFORE trigger is the integrity guarantee; the AFTER trigger is the forensic record. The system can never be in a state where `intel_score` was changed without `audit_log` knowing.

---

## 4. Observability Layer

**Minimum required event categories:**

| Event | Emitter | Log destination | Correlation anchor |
|---|---|---|---|
| `prediction.submitted` | `submitPrediction` (NEXT API) | App Sentry / Datadog | `prediction.id` (UUID) |
| `prediction.locked_post_match` | trigger `trg_block_prediction_updates_after_completed` | `audit_log.reason='tamper_attempt_blocked'` | `prediction.id` |
| `match.resolved` | RPC `evaluate_match_predictions` | App Sentry + audit_log (via scoring_events trigger) | `match.id` + `evaluation.id` |
| `match.corrected` | RPC step (when prior result re-resolved) | App Sentry + audit_log | `match.id` + new `evaluation.id` |
| `match.void` | RPC step (when p_result='draw') | App Sentry + audit_log (zero ledger rows) | `match.id` |
| `score.changed` | trigger `trg_audit_users_score_change` | `audit_log` | `user.id` |
| `score.reverted` | BEFORE trigger reverts silent | `audit_log.reason='reverted_by_protect_trigger'` | `user.id` + timestamp |
| `rpc.error` | RPC raises (deadlock, invalid input, etc.) | App Sentry (CRITICAL alert) | `match.id` |
| `integrity.mismatch` | scheduled job finds divergent rows | Sentry + Slack | one alert per `delta_mismatch.size()` |
| `rpc.success` | RPC returns | App Sentry (INFO) + audit_log | `evaluation.id` |

**Suggested log entry shape (JSON):**

```json
{
  "ts": "2026-06-23T14:32:01.123Z",
  "event": "match.resolved",
  "actor_role": "service",
  "actor_user_id": null,
  "correlation_id": "6f8a...",
  "match_id": "abc...",
  "evaluation_id": "def...",
  "scoring_version": "v1",
  "previouslyResolved": false,
  "deltas_count": 47,
  "correct_count": 19,
  "latency_ms": 142,
  "request_id": "edge-fn-2026-06-23T14:32:00-001"
}
```

**Tracing a single user's full lifecycle:**

1. The admin app records `prediction.id` when the user submits.
2. The RPC tags scoring_events inserts with `prediction_id` — find every event for a user, then join to `prediction_id`.
3. The audit_log trigger fires for every score change; `actor_user_id + occurred_at` reconstruct the timeline.
4. To validate a single user: `SELECT * FROM verify_one_user_integrity(<id>);` returns the replay computation ready for support replies.

**Concrete query — show everything that ever happened to one user's score:**

```sql
SELECT a.occurred_at, a.actor_role, a.operation, a.table_name,
       a.prev_value->'intel_score' AS prev_score,
       a.new_value->'intel_score' AS new_score,
       a.reason, e.match_id
FROM public.audit_log a
LEFT JOIN public.scoring_events e
  ON a.table_name = 'scoring_events'
 AND e.id::text = a.row_pk
WHERE a.actor_user_id = '<user_id>'
   OR (a.table_name = 'users' AND a.row_pk = '<user_id>')
ORDER BY a.occurred_at DESC
LIMIT 200;
```

---

## 5. Alerting Strategy

**Severity levels:**

| Severity | Conditions that trigger | Channel |
|---|---|---|
| `INFO` | Every score change (audit_log ingestion). Cannot suppress; aggregate in dashboards. | Datadog (post via webhook) |
| `INFO` | Hourly replay verifies 0 divergent rows. | Datadog (gauge `cs_intel.integrity.mismatch_count`) |
| `WARNING` | Hourly replay verifies ≥1 divergent row. | Slack channel `#cs-intel-alerts` |
| `WARNING` | `audit_log.reason='suspicious_direct_write'` from a non-`service` actor (i.e. someone with `postgres` or service_role credentials wrote scoring_events outside the RPC). | Slack + PagerDuty low |
| `WARNING` | `audit_log.reason='service_legitimate'` for a `users.intel_score` change (i.e. score mutation not via the standard RPC). | Slack + on-call tag |
| `CRITICAL` | Replay mismatch persists >24h (i.e. we know about the drift and nobody fixed it). | PagerDuty + Slack @channel |
| `CRITICAL` | `audit_log.reason='protect_trigger_disabled_canary'` (intel_score changed without going through service_role, admin, or an authenticated admin — and not reverted by the protect-trigger). Should never happen; control reaching this branch means the guard was disabled. | PagerDuty + immediate rollback |
| `CRITICAL` | RPC deadlock (Postgres `deadlock_detected` raised inside SECURITY DEFINER) → API returns 409. | Sentry (issue), Slack |

**Alert definition shapes (so we can template them once and reuse):**

```yaml
# Datadog monitor
cs_intel.integrity.mismatch_count > 0  ⟶ WARNING
cs_intel.audit_log.unauthorized_count > 0  ⟶ CRITICAL
cs_intel.audit_log.service_legitimate_count > 5/day  ⟶ WARNING
cs_intel.rpc.deadlock_count > 0  ⟶ CRITICAL
cs_intel.rpc.duration_p95 > 500ms  ⟶ WARNING
```

**What each alert means in plain language:**

- *Integrity mismatch WARNING*: ledger and stored score disagree. Investigate `verify_leaderboard_integrity()` output, identify `match_id` / `user_id`, and decide whether to manually replay the RPC with `p_force=TRUE`.
- *Suspicious direct write WARNING*: someone (probably an admin) touched scoring_events without going through the RPC. Confirm intent; if accidental, retry through RPC.
- *Protect-trigger-disabled CRITICAL*: triggers were bypassed. Confirm `trg_protect_users_sensitive_columns` and `trg_block_prediction_updates_after_completed` presence; if either was disabled, re-enable and roll forward. This is the canary event for "guardrail is offline".
- *RPC deadlock CRITICAL*: high concurrency on adjacent matches went badly. Database self-heals via deadlock detector; verify the API returned 409 and let the admin retry.

---

## 6. Minimal Implementation Plan

This turn shipped: 2 additive migrations + this design doc. Future steps are configuration-side:

### Step 1 — Migrations (DONE this turn)

| # | File | Purpose |
|---|---|---|
| 7 | `supabase/migrations/20260623001000_add_audit_log_and_observer_triggers.sql` | audit_log + observer triggers |
| 8 | `supabase/migrations/20260623001100_create_verify_leaderboard_integrity.sql` | leaderboard_replay view + verify functions |

These are forward-only, idempotent (`CREATE OR REPLACE`, `IF NOT EXISTS`), and have rollback blocks in trailing comments.

### Step 2 — Deploy migrations (production)

```bash
# Pre-flight (10 min)
supabase db backup            # ensure a fresh backup exists
supabase db lint              # no blockers expected

# Apply in order (≈ 5 min total)
supabase db push --file supabase/migrations/20260623001000_add_audit_log_and_observer_triggers.sql
supabase db push --file supabase/migrations/20260623001100_create_verify_leaderboard_integrity.sql

# Confirm
psql $DATABASE_URL -c "SELECT * FROM public.verify_leaderboard_integrity();"
psql $DATABASE_URL -c "SELECT count(*) FROM public.audit_log;"
```

### Step 3 — Wire observability sinks (config)

- App Sentry / Datadog: subscribe to NEXT API logs (already in supabase), attach `request_id` and `correlation_id` headers.
- Slack webhook: configure in Datadog / Sentry routing rules.
- Output every event through a single function in `lib/api/observability.ts` (future PR).

### Step 4 — Schedule the integrity check

Recommended path of least resistance: Supabase Edge Function on a cron schedule, gated by a `RESOLVE_MONITORING_TOKEN` env var.

```sql
-- Equivalent cron entry, if pg_cron is enabled in the project:
SELECT cron.schedule(
  'cs-intel-hourly-integrity-check',
  '0 * * * *',  -- top of every hour
  $$ SELECT public.verify_leaderboard_integrity(); $$
);
```

If `pg_cron` is unavailable on the project tier, use a Supabase Edge Function with a cron trigger (`vercel.json` or `deno.json` `crons` block), or a GitHub Actions workflow calling a Postgres RPC via the REST API.

### Step 5 — Verify alerting fires at least once

In staging only, manually corrupt one `users.intel_score` row:

```sql
-- As service_role via psql ONLY (this is exactly the scenario we want to detect):
UPDATE public.users SET intel_score = intel_score + 7 WHERE id = '<some_user>';
-- Wait for the next hourly check.
-- EXPECTED: WARNING alert in Slack within 60 min, integrity mismatch row returned.
-- Then revert the test:
UPDATE public.users SET intel_score = intel_score - 7 WHERE id = '<some_user>';
-- (The BEFORE trigger will REVERT this UPDATE silently BUT the audit log will
-- show the failed attempt. Re-running with WHERE is_admin=FALSE on a non-admin
-- user is the only path that touches intel_score via this gesture.)
```

### Step 6 — Document operational runbook

`docs/RUNBOOK_INTEGRITY.md` (to be created in a follow-up) lists:
- "I got an integrity-mismatch WARNING": identify user, run `verify_one_user_integrity(<id>)`, compare diff. If small, decision tree → manual reconcile. If large, run the full RPC replay.
- "I got a deadlock alert": automatic self-heal; no action needed unless repeat.
- "I got a protect_trigger_disabled_canary CRITICAL": run the trigger-presence probe below; if a known trigger is missing, immediately investigate who disabled it.

**Operator probe — "are the guardrails still mounted?":**
```sql
SELECT t.tgname,
       p.proname AS function_name,
       c.relname AS table_name,
       t.tgenabled AS enabled_status           -- 'O' normal, 'D' disabled, 'R' replica, 'A' always
  FROM pg_trigger t
  JOIN pg_proc   p ON p.oid = t.tgfoid
  JOIN pg_class  c ON c.oid = t.tgrelid
 WHERE c.relname IN ('users', 'predictions', 'scoring_events')
   AND t.tgname  IN (
         'trg_protect_users_sensitive_columns',
         'aaa_audit_users_intel_score_attempt',
         'trg_audit_users_score_change',
         'trg_block_prediction_updates_after_completed',
         'trg_audit_scoring_events'
       )
 ORDER BY c.relname, t.tgname;
```
EXPECTED: 5 rows, every `enabled_status = 'O'`. Anything else is a canary.

---

## What this design does NOT do

- Does not modify scoring math, the RPC, or any existing business rule.
- Does not add new scoring paths or new tables — only observes the existing writes.
- Does not change UX or intercept user actions — purely forensic.
- Does not block legitimate operations — all NEW triggers are AFTER triggers; the existing BEFORE triggers are unchanged.

This is a hardened monitoring envelope around an already-stable scoring core.
