# CS Intel — Schema Truth Contract

**Date:** June 23, 2026
**Audience:** anyone writing to (or reading from) the production Supabase database.
**Status:** Authoritative — supersedes any inline comments in code.

This document is the canonical reference for **what data lives where, who is allowed to write it, where it is derived from, and which invariants must hold**. If a code change appears to violate something written here, **the code is wrong, not the document**.

---

## Per-table contracts

### `public.users`

| Property | Value |
|---|---|
| Source of truth | `auth.users` (Supabase-managed) → `public.users` (mirror via trigger `on_auth_user_created`) |
| Identity PK | `id uuid` mirrors `auth.users.id` |
| Mutable surface for the user | `username`, `avatar`, `email` |
| Protected columns (trigger-reverted on direct UPDATE) | `intel_score`, `is_admin` |
| `intel_score` derived from | `SUM(delta) FROM public.scoring_events WHERE user_id = <id>` |
| Allowed writers | RPC `evaluate_match_predictions` (only); `auth.users` trigger (insert only); admins may set `is_admin` directly via the trigger's privilege check |
| Denormalized counters | (none currently — accuracy, streak, total_predictions considered for a future migration) |

**Invariants**
- `intel_score >= 0` (CHECK constraint + `GREATEST(0, …)` clamping in RPC step 5)
- `scoring_events.delta` always equals the delta actually applied to `users.intel_score` — the RPC clips negative deltas to `current_score` before writing them, so reversals (admin corrections) are mathematically exact and never mint phantom points. See migration `20260623000500_fix_rpc_reversal_delta_cap.sql`.
- `username` is `UNIQUE`
- A user must never set their own `intel_score` to an arbitrary value. The trigger `trg_protect_users_sensitive_columns` silently reverts any such attempt.

### `public.teams`

| Property | Value |
|---|---|
| Source of truth | Admin CRUD via `/api/admin/teams` + DisplayName server-side seeding |
| Allowed writers | Admins only (RLS) |
| `rating` | Currently a *seeded* column; recomputation via Elo is **not yet persisted** (planned) |
| Public read | Yes (anonymous visitors can list teams) |

### `public.tournaments`

| Property | Value |
|---|---|
| Source of truth | Admin CRUD via `/api/admin/tournaments` |
| Allowed writers | Admins only |
| `match_count`, `team_count` | Denormalised counters (no trigger yet — admin sets them) |
| Public read | Yes |

### `public.matches`

| Property | Value |
|---|---|
| Source of truth | Admin CRUD + status transitions |
| Allowed writers | Admins (insert/update/delete); SECURITY DEFINER RPC mutates `status` and `result` |
| `status` CHECK | `'upcoming' \| 'live' \| 'completed'` |
| `result` CHECK | `'team1_win' \| 'team2_win' \| 'draw'`, NULL until resolved |
| Public read | Yes |
| Resolution is atomic | Always via `public.evaluate_match_predictions(...)` — never through direct UPDATE from the app |

### `public.predictions`

| Property | Value |
|---|---|
| Source of truth | User-initiated submissions; server-side evaluation only |
| Allowed writers — INSERT | The owning authenticated user (RLS `Users can insert their own predictions`). **Blocked after match completes** by trigger `trg_block_prediction_updates_after_completed` (BEFORE INSERT OR UPDATE) |
| Allowed writers — UPDATE of `prediction`/`confidence` | The owning user, **only while the match is `upcoming` or `live`** (trigger `trg_block_prediction_updates_after_completed` raises afterward) |
| Allowed writers — UPDATE of `result`/`is_correct`/`evaluated_at` | Only the SECURITY DEFINER RPC |
| `prediction` values | `'team1' \| 'team2'` (back compat: UPPERCASE tolerated only by app, schema enforces lowercase via CHECK after migration `…220000_add_predictions_prediction_check.sql` if/when added) |
| `confidence` | `INTEGER 50..100`, default 50 |
| `result` | `TEXT` ∈ `'pending' \| 'correct' \| 'incorrect' \| 'void'` |
| Uniqueness | `(user_id, match_id)` — one prediction per user per match |
| Public read | Yes (consider tightening — see Open Questions) |

### `public.scoring_events`

| Property | Value |
|---|---|
| Source of truth | The RPC `evaluate_match_predictions` only |
| Visibility | Each user can SELECT their own events; admins can SELECT all |
| Append-only | No UPDATE/DELETE policy for client roles; reverse path is performed **inside** the RPC via DELETE-then-INSERT of a single matching `(match_id, user_id)` |
| Uniqueness | `(match_id, user_id)` — one event per user per match at any moment |
| `reason` enum | `'match_resolved' \| 'match_corrected' \| 'match_void' \| 'manual_credit'` |
| `scoring_version` | Caller-supplied identifier (e.g. `'v1'`, `'v1_backfill'`) — never NULL |

### `public.comments`

| Property | Value |
|---|---|
| Source of truth | User submissions on matches |
| Allowed writers — INSERT | The owning user, authenticated |
| Public read | Yes |
| Soft delete | Not yet implemented |
| Renamed-in-flight | May merge into a polymorphic `posts` table later — see REMEDIATION_ROLLOUT.md |

### `public.community_*` (`community_posts`, `community_comments`, `community_categories`, `community_tags`, `community_activity`)

| Property | Value |
|---|---|
| Source of truth | User-generated discussion |
| Status | **Tables exist, no application code today creates/reads them.** Kept intentionally for the eventual community-rollout phase. Will run no migrations against them until UI is wired up. |

### `public.admin_*` (`admin_activity_log`, `admin_notes`, `admin_reports`)

| Property | Value |
|---|---|
| Source of truth | Admin moderation |
| `admin_reports` | Mirrored from `community_posts.flagged = true` (currently polled by admin UI) |
| `admin_activity_log` | Reserved for audit trail; not yet written to by app code |

### `public.platform_status`, `public.system_alerts`

| Property | Value |
|---|---|
| Source of truth | Service-monitor / health-check pipeline (not yet wired) |
| Status | **Hardcoded in admin UI today**; will be replaced by real rows when the monitor is live |

---

## Derived columns — what is the source, what is a cache

| Column | Source row(s) | Refresh trigger |
|---|---|---|
| `users.intel_score` | `SUM(delta) FROM scoring_events WHERE user_id = u.id` | RPC `evaluate_match_predictions` (atomic) |
| `matches.result`, `matches.status` | Admin input or RPC | RPC `evaluate_match_predictions` (atomic) |
| `predictions.result`, `predictions.is_correct`, `predictions.evaluated_at` | RPC recomputing from `matches.result` | RPC `evaluate_match_predictions` (atomic) |
| `predictions.score_earned` | Computed at evaluation; persisted by RPC | RPC `evaluate_match_predictions` (atomic) |
| `teams.rating`, `teams.recent_form`, `teams.win_rate`, `teams.total_matches` | Should derive from `matches` but **is currently seeded**. Will get a recompute path in a future migration (planned `2026xxxxxxx_persist_team_elo.sql`). | — |
| `tournaments.match_count`, `tournaments.team_count` | Manual admin set today | — |

If any derived column noticeably disagrees with its source, the **system is in an inconsistent state**: stop, do not patch the cache, run the RPC or the resolution tool to recompute.

---

## Permissions summary

| Role | Reads | Writes |
|---|---|---|
| `anon` | All public-facing tables | None |
| `authenticated` | Public-facing tables + own rows (predictions, scoring_events, users) | `username/avatar/email` only on own user row (via trigger gate); INSERT on `predictions` for own matches; INSERT on `comments` for own matches |
| `authenticated` (admin) | All rows | Independently verified by `is_admin=true` lookup inside triggers + RPC grants |
| `service_role` | All rows | `users.intel_score` only via RPC; everything else unrestricted (cron jobs) |

---

## Anti-tampering checklist

- ✅ Users cannot directly UPDATE `intel_score` or `is_admin` — trigger `trg_protect_users_sensitive_columns` reverts to OLD value.
- ✅ Users cannot change their prediction after the match is `completed` — trigger `trg_block_prediction_updates_after_completed` raises on UPDATE.
- ✅ Users cannot insert a fresh prediction after the match is `completed` — same trigger also runs on INSERT (see migration `20260623000600`).
- ✅ `intel_score` writes are atomic and concurrency-safe — RPC uses `SELECT … FOR UPDATE OF u` on affected users.
- ✅ Result corrections never double-debit — RPC reads existing `scoring_events` for the match and reverses them before applying new deltas.
- ✅ Duplicate call protection — RPC returns `previouslyResolved: true` if `matches.status='completed'` and `matches.result = p_result` (unless `p_force = true`).
- ✅ Scores always floor at 0 (CHECK + `GREATEST(0, …)`). Users with sustained losses never go negative — this is **intentional** to keep the leaderboard legible. The RPC additionally clips the *recorded* negative delta to `current_score`, so `scoring_events.delta` never exceeds what was actually applied. Reversals therefore restore exactly the balance the user had at the moment of the prior resolution.
- ✅ Late inserts and post-resolution updates are blocked. Trigger `trg_block_prediction_updates_after_completed` runs on `BEFORE INSERT OR UPDATE` — see migration `20260623000600_block_prediction_inserts_after_completed.sql`.

---

## Open questions (tracked, not blocking)

1. Should `predictions` be public-readable by anonymous visitors? Today they are. Two-tier policy (auth-only for prediction rows, public for consensus aggregates) is a future PR.
2. Should duplicate accounts (by IP/devices) be locked? Not in scope.
3. Should `users.total_predictions` / `accuracy_percentage` / `streak` be denormalised columns for fast leaderboard rendering? Yes, but not before we see real read latency issues.
4. Will `teams.rating` become an Elo-derived column persisted by a trigger? Yes — pending `lib/ratings.ts` validation and a coordinated cron/edge function recompute.

---

## Editing this document

Any contract change happens in **two steps**:
1. Update this document.
2. Add a numbered migration that implements the change.

Never edit the schema without updating this document first.
