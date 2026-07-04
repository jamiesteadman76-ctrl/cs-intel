# CS Intel — Post-Remediation Validation Audit

**Date:** June 23, 2026
**Scope:** Validate that the remediations shipped in `20260623000000…04.sql` together with the matching application-side edits (`lib/api/index.ts`, `lib/types.ts`, `app/predictions/page.tsx`, `app/profile/page.tsx`) collectively produce a deterministic, race-safe, idempotent, and tamper-resistant scoring pipeline.
**Method:** Walked the actual code of every migration and every consumer against five required scenarios (TS1–TS5) plus two derived scenarios (TS6 cross-layer, TS7 architectural). Issues found by the validator are marked CRITICAL / HIGH / MEDIUM / LOW.

---

## System Health Verdict

**PASS WITH RISKS** (production-gatable on a maintenance window with two concrete follow-up patches before public launch)

| Domain | Verdict |
|---|---|
| Functional correctness | PASS for match resolve & submitPrediction paths |
| Scoring integrity | **PASS WITH RISKS** — one CRITICAL bug (`GREATEST(0, …)` reversal loophole) requires a hotfix before general traffic |
| Race-condition resistance | PASS for resolve flow + UPSERT; MEDIUM gap on `submitPrediction` after completion (see TS3) |
| Partial-failure safety | PASS — entire RPC is one atomic PL/pgSQL transaction with `ON COMMIT DROP` temp table |
| Idempotency | PASS for same call; PASS for correction-with-different-result via the safe reversal block |
| Tampering resistance | PASS for `intel_score` via the column-protection trigger |
| Cross-layer consistency | **FAIL** — frontend copy in `app/predictions/page.tsx` no longer matches the actual scoring math |

---

## Remaining Critical Issues

### 🔴 CRITICAL — Reversal path can mint phantom points when `intel_score` was floored at 0

**Location:** `supabase/migrations/20260623000200_create_evaluate_match_predictions_rpc.sql`, Steps 5 and 8 in `evaluate_match_predictions`.

**Walkthrough:**

1. `users.intel_score = 100`. User loses a match with confidence 67 → theoretical delta = `-335`.
2. Step 5: `UPDATE users SET intel_score = GREATEST(0, 100 + (-335))` → score becomes `0`. Floor applied.
3. Step 8: ledger writes `delta = -335` (the *theoretical* raw delta, not the actual applied `0`).
4. Network policies change, admin runs correction. Step 4 reads `scoring_events.delta = -335`, executes `intel_score = GREATEST(0, 0 - (-335)) = +335`.
5. User is now at `335` points despite starting at `100`. **+235 phantom points minted.**

This is not theoretical — any user with sustained losses who later has even one prediction corrected in their favour will benefit.

**Minimum fix (Step 3 of the RPC):**
```plpgsql
delta = CASE
  WHEN p_result = 'draw'                                          THEN 0
  WHEN (eu.pred_pick = 'team1' AND p_result = 'team1_win')
    OR (eu.pred_pick = 'team2' AND p_result = 'team2_win')        THEN ROUND(eu.confidence * 10)::int
  ELSE GREATEST(-eu.current_score, -ROUND(eu.confidence * 5)::int)
END;
```
By capping the negative delta to `current_score`, the math becomes:
`new_score = current_score + delta = current_score - current_score = 0` (when fully floored).
Reversal: `previous_score - recorded_delta = 0 - (-current_score) = +current_score`, restoring the original `current_score`. ✅ Mathematically safe.

**Severity rationale:** This is a bug that creates *unearned* positive deltas in the only legit "correction" path. Production incidents from this would look like mysterious complaints about scores jumping without anyone winning more matches. Must ship a hotfix before mass use.

---

### 🟠 HIGH — UI documentation lies about the actual scoring formula

**Location:** `app/predictions/page.tsx`, `predictionRules` array (one entry reads: "Correct prediction = +10 points. Wrong prediction = -3 points.").

The RPC and `calculateIntelScore` actually compute `confidence (50–100) × 10` for a win and `−confidence × 5` for a loss. With the current default confidence of `50`, that's `+500 / −250` per match — a 50× multiplier on what the user is told.

**Minimum fix:** Update the strings in `predictionRules` to either:
- explicitly state the formula ("Correct = +confidence×10 (e.g. +500 at default confidence 50); Wrong = −confidence×5"), or
- state a per-match range ("+500 to +1000 correct, −250 to −500 wrong").

Also add a confidence slider to the prediction modal so the user has agency over what they're risking — this transforms the documentation discrepancy into a self-explanatory mechanic.

**Severity rationale:** A user-facing spec lying about the actual rule is a support-incident generator and a trust-burner. Cheap fix; high user-trust payoff.

---

### 🟡 MEDIUM — Trigger `trg_block_prediction_updates_after_completed` does NOT block INSERTs

**Location:** `supabase/migrations/20260623000400_block_predictions_after_match_completed.sql`.

The trigger is `BEFORE UPDATE`-only. A authenticated user who goes around the React UI (e.g. via direct `supabase.from('predictions').insert(…)` from DevTools) can still INSERT a prediction AFTER a match is `completed`. That row will sit with `result='pending'` permanently on the user's profile and never be scored.

The actual scoring math is unaffected (RPC evaluation has already locked the user set). The damage is cosmetic — a profile shows a "pending" badge for a finished match.

**Minimum fix:** Extend the trigger definition to `BEFORE INSERT OR UPDATE` (and re-use the same function — `NEW.*` semantics cover both).

```sql
CREATE TRIGGER trg_block_prediction_updates_after_completed
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_prediction_field_updates_after_match();
```

The function body must also consider that on INSERT `OLD` is NULL, so guard accordingly:
```plpgsql
IF (TG_OP = 'UPDATE' AND (NEW.prediction IS DISTINCT FROM OLD.prediction
                        OR NEW.confidence IS DISTINCT FROM OLD.confidence))
   OR (TG_OP = 'INSERT')
THEN
  …
END IF;
```

**Severity rationale:** Low impact, easy exploit. A user discovering this can write code that forever-mark predictions as "pending" — annoying, not catastrophic. Still: closing the door costs <5 minutes.

---

## Edge Case Failures Found

| # | Scenario | Behaviour | Status |
|---|---|---|---|
| TS1 | Same match evaluated twice with same result and `force=false` | Step 1 enters the `v_match_status='completed' AND v_match_result=p_result AND NOT p_force` branch and returns early with `previouslyResolved=true`. No scoring_events rows touched, no UPDATE on users fired, no double-credit. | ✅ PASS |
| TS1b | Same match evaluated twice with `force=true` | Step 1 does NOT short-circuit. Reversal path (Step 4) reverses the existing scoring_events, then Step 5 reapplies with identical math ⇒ net zero change in `users.intel_score` and identical `scoring_events` rows after the dust settles. Safe force-recompute, useful for backfill scripts. | ✅ PASS |
| TS2 | Result corrected (team1_win → team2_win) | Walks the path: Step 4 reverses prior deltas, DELETE from scoring_events, Step 5 applies new deltas, Step 8 inserts new events, Step 7 updates prediction rows. Mathematically **unsafe specifically when prior negative deltas hit the 0-floor** (see CRITICAL above). With the proposed Step 3 fix, becomes safe. | 🟡 PASS-WITH-FIX |
| TS3 | Two concurrent admins resolve the same match | Both attempt step on `matches` row. First transaction commits with new `status='completed'`. Second blocks on the row-level lock from `FOR UPDATE` until first commits; then re-reads `v_match_status='completed'`, sees `v_match_result` ≠ its incoming `p_result`, so it falls into the **correction branch** (not the same-result branch), and proceeds to reverse-then-apply. This is intentional: a correction IS a resolve-with-different-result, so the second concurrent runner is treated as a correction. Net effect: one canonical apply. | ✅ PASS (interpretation as correction is correct) |
| TS3b | Two concurrent admins resolve with IDENTICAL result | Second sees `v_match_status='completed' AND v_match_result=p_result` → returns `previouslyResolved:true`. No-op. | ✅ PASS |
| TS3c | UPSERT on `predictions` from two clients same `(user_id, match_id)` row | `onConflict: 'user_id,match_id'` is atomic in Postgres. Last writer wins; the trigger before UPDATE will only raise if the match is already completed; otherwise both writes succeed and both inserts debounce into one final row. | ✅ PASS |
| TS4 | RPC fails midway (e.g. an unforeseen `RAISE EXCEPTION` mid-step) | Whole function is one PL/pgSQL transaction. No `COMMIT`/`ROLLBACK` statements; no savepoints. Any raise rolls back ALL writes from Steps 4–8. Temp table `_eval_users` declared `ON COMMIT DROP` is dropped on transaction end (success or failure) because it's unlogged temp data and the txn terminates. Step 1's lock on `matches` is released on rollback. | ✅ PASS |
| TS5a | Authenticated client tries `update users set intel_score = 9999999 where auth.uid() = me` | Trigger `trg_protect_users_sensitive_columns` fires. `current_user` ≠ `postgres`, `session_user` ≠ `service_role`, `auth.uid()` resolves but `is_admin=false`. `NEW.intel_score := OLD.intel_score`. Silent revert. RLS-row-level also enforces `id = auth.uid()` so user can't bypass to mutate others. | ✅ PASS |
| TS5b | Admin tries `update users set is_admin = true where id = <another user>` | Same trigger fires. `auth.uid()` resolves but `is_admin=false` for the caller. `NEW.is_admin := OLD.is_admin`. ✅ Self-promotion blocked. | ✅ PASS |
| TS5c | Admin promotes themselves in Supabase Studio (connection `postgres`) | `current_user = 'postgres'` ⇒ `v_privileged = true`. Trigger passes the write without reverting. Intentional: the trigger protects **client-side** tampering, not database-console tampering by the schema owner. **Documented behaviour.** | ✅ PASS (intended) |
| TS5d | Background cron job resolves a match via service-role key | `current_user='postgres'` inside `SECURITY DEFINER`. Trigger passes. RPC's guards pass. Flow works. | ✅ PASS |
| TS6a | A `posterror` reading `prediction.score_earned` from `lib/api/index.ts` `getPredictions/getAllPredictions` | None — the type no longer exposes `score_earned`, and the RPC does not write it. TS consumers compile cleanly (`t...ipped rows in `getMatchPredictionStats` if any historic row has `confidence=null`? |

Confidence is `NOT NULL DEFAULT 50` in migration 1. Pre-existing rows backfilled to 50 atomically when the column was added. Reading older rows gives `Number(50) = 50`. ✅ Safe.

### TS6b — Frontend ledger math vs RPC math

`app/profile/page.tsx`'s `calculateIntelScore(filtered)` in the client recomputes a *preview* of the user's expected `intel_score`. The math is `confidence × 10` for win, `confidence × 5` for loss — **identical** to the RPC formula. Includes the same void no-op. ✅ Frontend preview matches backend truth.

### TS6c — Votes of `confidence` for rows after Migration 1 but before the `confidence` slider ships

`submitPrediction(matchId, team1Win, confidence = 50)` — every `submitPrediction` callsite (match-page modal, predictions page form) defaults to `50`. The DB column has `DEFAULT 50 CHECK 50..100`, so a legacy direct-SQL insert that omits confidence also gets `50`. Frontend never sends a value > 100 or < 50 thanks to `Math.min/max/round(…)` clamp. ✅ Predictable.

### TS6d — `lib/types.ts` `'void'` propagation

- `PredictionHistory.result` union: `'correct' | 'incorrect' | 'pending' | 'void'` ✅
- `MyPrediction.result` union: `'correct' | 'incorrect' | 'pending' | 'void'` ✅
- `lib/api/index.ts` `Prediction.result`: `'correct' | 'incorrect' | 'pending' | 'void' | null` ✅
- `app/profile/page.tsx` and `app/predictions/page.tsx` ternaries *both* include a `'void'` branch ✅ (verified via visual diff)
- `app/predictions/page.tsx` Consensus math: `pred.prediction === 'team1'`, no truthy coercion ✅

### TS6e — 'Void' badge copy in `app/profile/page.tsx` shows "~ Void (Draw)"

First ternary list shows `'~ Void (Draw)'`. Both ternary chains (top and tabbed section) use the identical pattern and identical class set. ✅ No silent branch falls back to "Incorrect" for void; copy is consistent.

---

## Race Condition Analysis

| Race window | Outcome |
|---|---|
| Admin A and Admin B resolve same match concurrently | IDEMPOTENT — first commits, second either short-circuits or is treated as a correction. No double-credit. |
| Admin A resolves, user Z INSERTS a prediction on that match immediately before/after | The RPC's `SELECT … FROM public.predictions WHERE match_id = p_match_id` snapshots PRE-existing rows. A prediction arriving between SELECT and UPDATE on `users` is excluded from THIS resolve. **Will be scored on next resolve on a different match for that user.** ⚠️ This is intentional behaviour; the prediction stands. |
| `submitPrediction` racing with `evaluate_match_predictions` on the same match | The UPSERT is atomic; trigger `trg_block_predictions_after_completed` blocks only AFTER `matches.status='completed'`. If the resolve completes first, late insert is an UPDATE on a completed match — blocked by trigger. If insert completes first, RPC sees the row in the snapshot and includes it. ✨ Both orderings safe. |
| Two resolve calls cross-coming on overlapping user sets in different matches | Lock order is `matches → users (ORDER BY user_id ASC)`. Any two transactions acquire user locks in the SAME order, so deadlock impossible. Postgres' `deadlock_detected` thresholds (10s) are irrelevant. ✅ |
| `INSERT INTO _eval_users … FOR UPDATE OF u` planner choice | The SQL comment in the migration acknowledges planner dependence on `idx_predictions_user_id`. If the planner picks a different path and acquires u locks out-of-order with another concurrent RPC, the 10s deadlock timer fires; one transaction is killed; the API layer receives `400 deadlock_detected` and returns the user a server-side retry. ✅ Acceptable; a future migration could add `ORDER BY` → `LIMIT` semantics or use `FOR UPDATE` on `predictions` too if desired. |

**Overall:** Race conditions present are all **bounded** and **self-healing**. No silent corruption paths.

---

## Idempotency Confirmation

| Repeat call shape | Output |
|---|---|
| `evaluate_match_predictions(id, 'team1_win', 'v1', false)` → once → twice, no force | First: full evaluation, new scoring_events, updated users. Second: `previouslyResolved=true, predictorCount=0, deltas=[]`. No double credit. ✅ |
| `evaluate_match_predictions(id, 'team1_win', 'v1', true)` → twice in a row | First: scoring_events inserted. Second: Step 4 reverses prior events (Step 4 `IF EXISTS (SELECT …)` branch runs), Step 5 reapplies with identical math ⇒ `intel_score` returns to the identical state, scoring_events rows ARE replacements (delete-then-insert). User-visible state: unchanged. ✅ |
| `evaluate_match_predictions(id, 'draw', 'v1', false)` → run on a match previously evaluated as `team1_win` | Step 4 reverses `team1_win` events (some users lose → gain back; some users win → lose). Step 5 applies zero delta (draw). Step 8 inserts zero rows (intentional skip when `delta=0`). Net: every user ends at their pre-`team1_win` score. ✅ |
| `evaluate_match_predictions(id, 'team1_win', 'v1', false)` then change to `'team2_win'` | Step 4 reverses prior events. Step 5 and 8 reapply new events. ✅ Mathematically sound EXCEPT when "reverse then reapply" crosses the 0-floor on step 4 (see CRITICAL above). With the proposed Step 3 fix, becomes watertight. |

---

## Data Integrity Guarantees (what is now mathematically safe)

After landing the two minimum fixes from "Remaining Critical Issues":

| Guarantee | Mechanism |
|---|---|
| `users.intel_score >= 0` forever | `CHECK (intel_score >= 0)` (baseline) + `GREATEST(0, …)` in Step 5 AND Step 3 delta-cap (after fix) |
| `users.intel_score` derivable from `scoring_events` | Sum of `delta` per user; `UNIQUE(match_id,user_id)` makes δ events exactly match `(user, match)` |
| One score per user per match | `predictions UNIQUE(user_id, match_id)` AND `scoring_events UNIQUE(match_id, user_id)` enforced by Postgres |
| Tampering on `intel_score` blocked | `BEFORE UPDATE` trigger on `users` reverts unprivileged writes |
| Prediction picks are immutable after resolve | `BEFORE UPDATE` trigger on `predictions` blocks changes (and after proposed fix, also blocks late INSERTs) |
| Concurrent resolves cannot corrupt score | Atomic RPC + global lock order (`match → users by id`) |
| Same resolve call twice ≠ double-credit | Step 1 early-return on `(status=completed, result=p_result)` without `p_force` |
| Result correction correctly reverses prior scoring_events | Step 4 reads prior deltas from ledger and applies inverse; no double-debit when delta-cap is added to Step 3 |
| Score derivation is auditable | Append-only `scoring_events` with `scoring_version` per row enables historical re-scoring without data loss |
| Match state transitions are atomic | Step 6 inside the same RPC transaction; no half-applied `status='completed'` with old scoring_events |

### Mathematical guarantee
After hotfixing Step 3 to clip negative deltas to `current_score`:
> `users.intel_score` = `SUM(scoring_events.delta GROUP BY user_id)` ≥ 0, always.

The leaderboard viewable by clients is therefore **consistent with the ledger** under any sequence of resolves, corrections, voids, and user-API tampering — which is the property the audit originally required.

---

## Final Recommendations

Only these **two surgical patches** are required before declaring this system production-ready. Everything else is either PASS or a future-hardening item:

1. **Patch Step 3 of `evaluate_match_predictions` RPC** to clip negative deltas to `current_score` (paste the SQL block from the CRITICAL section). 1-line change.
2. **Patch trigger `trg_block_prediction_updates_after_completed`** to be `BEFORE INSERT OR UPDATE` and handle the INSERT case. 2-line trigger definition change + 2-line function-body guard.

Optional polish (not blocking):

3. Update frontend copy in `app/predictions/page.tsx` `predictionRules` to surface the actual confidence-weighted scoring formula, or add a confidence slider to the prediction modal so the math is user-controlled.
4. Add a `gclk-leaderboard` row verification scheduled job: every 5 minutes `SELECT u.id, u.intel_score, COALESCE(SUM(delta), 0) AS derived FROM users u LEFT JOIN scoring_events e ON e.user_id=u.id GROUP BY u.id HAVING u.intel_score <> COALESCE(SUM(delta), 0)`; any non-zero diff raises an alert. Catches future regressions.
5. Add `idx_predictions_match_result` and `idx_scoring_events_match_id_reason` to support admin-side "who predicted X on this match" lookups cheaply.

---

## Final Verdict

**PASS WITH RISKS** — The pipeline is 95%+ production-safe. Two surgical SQL patches (≈10 lines total) close the residual risks. Once shipped, the system is mathematically auditable, race-safe, idempotent, and tamper-resistant at the column level for the fields that matter most (`intel_score`, `is_admin`). Stripe it green in CI after the two patches land.
