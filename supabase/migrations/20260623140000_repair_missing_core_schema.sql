-- ============================================================================
-- Migration: 20260623140000_repair_missing_core_schema.sql
-- Purpose:   ONE consolidated, idempotent repair migration that brings a
--            partially-deployed CS Intel Supabase project up to the canonical
--            state defined by migrations 20260623000000…001300.
--
--             This file exists because:
--               • Migrations 000-013 were applied manually in some environments
--                 and the Supabase CLI migration history is unreliable.
--               • The scoring RPC (`evaluate_match_predictions`) is referenced
--                 by `lib/api/index.ts` (see `evaluatePredictions` + the JS-side
--                 `calculateIntelScore`). If the RPC, its schema dependencies,
--                 or its canonical math (post-fix 005) are missing, scoring
--                 silently breaks in production.
--               • The audit + replay layer (010-013) is now load-bearing for
--                 integrity guarantees documented in
--                 docs/MONITORING_AND_INTEGRITY.md.
--
-- Hard rules:
--   1. NEVER DROP business-data tables (users, predictions, matches, scoring_events,
--      audit_log). Forensics + audit trail must survive.
--   2. Use IF NOT EXISTS wherever the underlying PG syntax supports it.
--   3. For TRIGGER and POLICY (no native IF NOT EXISTS) use
--      DROP … IF EXISTS; CREATE …. Forces canonical state, no errors.
--   4. For FUNCTIONS use CREATE OR REPLACE. Existing grants survive.
--   5. For VIEWS use CREATE OR REPLACE — idempotent.
--   6. CHECK constraints are added via DO … EXCEPTION blocks because
--      ADD COLUMN IF NOT EXISTS does NOT retroactively add a CHECK.
--   7. Final state targets migration 013 (the latest canonical version),
--      NOT any intermediate state.
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_min_messages = warning;
SET search_path = public;

-- ============================================================================
-- 1. EXTENSIONS (minimal)
--    Only what THIS repair actually uses:
--      • pgcrypto  — for gen_random_uuid() in scoring_events / handle_new_user
--      • uuid-ossp — alternative UUID source; safe to install, never required
--    pg_stat_statements and supabase_vault are platform-owned and would
--    raise feature_not_supported on vanilla PG, so we deliberately omit them.
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"       WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"      WITH SCHEMA "extensions";

-- ============================================================================
-- 2. COLUMNS on existing tables
--    `predictions.confidence`     — migration 000 (scoring weight, 50..100).
--    `predictions.evaluated_at`   — referenced by RPC `evaluate_match_predictions`
--      (Step 7) AND by `lib/types.ts` (`evaluated_at?: string | null`) but
--      NEVER actually ADDed in any prior migration. CRITICAL patch — if this
--      column is missing the scoring RPC raises "column evaluated_at does
--      not exist" on every resolve.
-- ============================================================================
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS confidence   INTEGER       NOT NULL DEFAULT 50;
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ   NULL;

-- ============================================================================
-- 3. CHECK constraints on existing columns
--    ADD COLUMN IF NOT EXISTS skips constraint application when the column
--    pre-exists; existing rows may also be NULL or out-of-range from a prior
--    drift. We therefore:
--      a) clamp any NULL or out-of-range rows into the safe band BEFORE the
--         constraint is added (this prevents `check_violation` aborting the
--         migration on legacy data);
--      b) add the CHECK via a named constraint, swallowing `duplicate_object`
--         so subsequent re-runs are idempotent.
--    Doing the clamp FIRST removes any abort-on-data-violation failure mode;
--    doing it after the constraint would itself fail. This ordering is load-
--    bearing — DO NOT reorder these two blocks.
-- ============================================================================

-- 3a. Clamp legacy / NULL data into the safe band so the CHECK can land.
UPDATE public.predictions
   SET confidence = 50
 WHERE confidence IS NULL OR confidence < 50;

UPDATE public.predictions
   SET confidence = 100
 WHERE confidence > 100;

-- 3b. Apply CHECK (idempotent re-runnable).
DO $fn$
BEGIN
  ALTER TABLE public.predictions
    ADD CONSTRAINT predictions_confidence_check CHECK (confidence BETWEEN 50 AND 100);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$fn$;

-- ============================================================================
-- 4. INDEXES on existing tables
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_predictions_confidence
  ON public.predictions(confidence);

-- ============================================================================
-- 5. TABLES — `scoring_events` (migration 001) and `audit_log` (migration 010)
--    Append-only ledgers. CREATE TABLE IF NOT EXISTS preserves any existing
--    rows (audit trail must survive; we never DROP).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scoring_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id)        ON DELETE CASCADE,
  match_id        uuid NOT NULL REFERENCES public.matches(id)      ON DELETE CASCADE,
  prediction_id   uuid NOT NULL REFERENCES public.predictions(id)  ON DELETE CASCADE,
  delta           integer NOT NULL
                     CHECK (delta <> 0 AND delta BETWEEN -1000 AND 1000),
  reason          text    NOT NULL
                     CHECK (reason IN ('match_resolved','match_corrected','match_void','manual_credit')),
  scoring_version text    NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_events_user_id    ON public.scoring_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_events_match_id   ON public.scoring_events(match_id);
CREATE INDEX IF NOT EXISTS idx_scoring_events_created_at ON public.scoring_events(created_at DESC);
-- UNIQUE index is what the RPC exploits to atomic-recompute: DELETE prior
-- events for a (match_id), then INSERT new ones — no conflict noise.
CREATE UNIQUE INDEX IF NOT EXISTS uq_scoring_events_match_user
  ON public.scoring_events(match_id, user_id);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id              bigserial PRIMARY KEY,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  actor_role      text        NOT NULL,
  actor_user_id   uuid        NULL,
  table_name      text        NOT NULL,
  operation       text        NOT NULL
                     CHECK (operation IN ('INSERT','UPDATE','DELETE','REVERT','BLOCK')),
  row_pk          text        NOT NULL,
  prev_value      jsonb       NULL,
  new_value       jsonb       NULL,
  attribution     text        NULL,
  reason          text        NULL,
  correlation_id  uuid        NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_occurred_at ON public.audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor       ON public.audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_op    ON public.audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_reason      ON public.audit_log(reason);

-- ============================================================================
-- 6. VIEW — `leaderboard_replay` (migration 011)
--    Pure-read; recreated with CREATE OR REPLACE to lock canonical definition.
-- ============================================================================
CREATE OR REPLACE VIEW public.leaderboard_replay AS
SELECT
    u.id                            AS user_id,
    u.username                      AS username,
    u.intel_score                   AS stored_intel_score,
    COALESCE(SUM(e.delta), 0)       AS derived_intel_score,
    u.intel_score
      - COALESCE(SUM(e.delta), 0)    AS delta_mismatch,
    COUNT(e.id)                     AS event_count,
    MAX(e.created_at)               AS last_event_at
FROM public.users u
LEFT JOIN public.scoring_events e
       ON e.user_id = u.id
GROUP BY u.id, u.username, u.intel_score;

-- ============================================================================
-- 7. FUNCTIONS — all CREATE OR REPLACE; canonical bodies (post-fix).
--    Order is by dependency: helpers → audit observers → RPC → verify.
-- ============================================================================

-- 7.1 handle_new_user — baseline. Copy verbatim from migration
--     20260622224053_remote_schema.sql. Re-issued so a partial-DB without it
--     is still bootstrapped.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  INSERT INTO public.users (id, email, username, intel_score, is_admin, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    0,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$fn$;

-- 7.2 protect_users_sensitive_columns — migration 003. Silently reverts
--     intel_score / is_admin writes from non-privileged callers.
CREATE OR REPLACE FUNCTION public.protect_users_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_privileged boolean;
BEGIN
  v_privileged :=
       current_user = 'postgres'
    OR session_user = 'service_role'
    OR pg_has_role(session_user, 'service_role', 'MEMBER')
    OR (auth.uid() IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.users
           WHERE id = auth.uid() AND is_admin = TRUE
        ));

  IF NEW.intel_score IS DISTINCT FROM OLD.intel_score AND NOT v_privileged THEN
    NEW.intel_score := OLD.intel_score;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND NOT v_privileged THEN
    NEW.is_admin := OLD.is_admin;
  END IF;

  RETURN NEW;
END;
$fn$;

-- 7.3 block_prediction_field_updates_after_match — migrations 004/006.
--       Blocks INSERT OR UPDATE that mutates `prediction` / `confidence`
--       after the match has reached `completed`.
CREATE OR REPLACE FUNCTION public.block_prediction_field_updates_after_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_match_status  text;
  v_should_check  boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Fresh INSERT targets a specific match row; always check status.
    v_should_check := TRUE;
  ELSE
    -- UPDATE: only block if user-owned fields change. RPC-managed
    -- fields (`result`, `is_correct`, `evaluated_at`) flow through.
    v_should_check := NEW.prediction IS DISTINCT FROM OLD.prediction
                   OR NEW.confidence IS DISTINCT FROM OLD.confidence;
  END IF;

  IF v_should_check THEN
    SELECT status INTO v_match_status
      FROM public.matches WHERE id = NEW.match_id;

    IF v_match_status = 'completed' THEN
      RAISE EXCEPTION
        'prediction_locked: cannot insert or change prediction/confidence after match is resolved';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

-- 7.4 audit_users_intel_score_attempt — migration 012.
--       BEFORE INSERT OR UPDATE on users. Fires BEFORE protect_trigger
--       because trigger names sort alphabetically (`aaa_` < `trg_`).
--       Captures the user's attempted value before the protect_trigger has
--       a chance to revert it.
-- IMPORTANT: privileged check MUST mirror protect_trigger's exactly so the
-- audit log isn't contaminated with legitimate writes.
CREATE OR REPLACE FUNCTION public.audit_users_intel_score_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_will_revert boolean;
  v_op          text;
BEGIN
  v_op := TG_OP;
  v_will_revert := NOT (
        current_user = 'postgres'
     OR session_user = 'service_role'
     OR pg_has_role(session_user, 'service_role', 'MEMBER')
     OR (auth.uid() IS NOT NULL
         AND EXISTS (SELECT 1 FROM public.users
                      WHERE id = auth.uid() AND is_admin = TRUE))
  );

  IF v_will_revert AND (
       (v_op = 'INSERT' AND NEW.intel_score IS NOT NULL)
    OR (v_op = 'UPDATE' AND NEW.intel_score IS DISTINCT FROM OLD.intel_score)
  ) THEN
    INSERT INTO public.audit_log
      (actor_role, actor_user_id, table_name, operation, row_pk,
       prev_value, new_value, attribution, reason)
    VALUES
      ('authenticated', auth.uid(), 'users', v_op, NEW.id::text,
       CASE WHEN v_op = 'UPDATE'
            THEN jsonb_build_object('intel_score', OLD.intel_score, 'attempted', NEW.intel_score)
            ELSE jsonb_build_object('attempted', NEW.intel_score) END,
       CASE v_op
         WHEN 'UPDATE' THEN jsonb_build_object(
                            'intel_score', OLD.intel_score,
                            'note',       'write_reverted_by_protect_trigger')
         WHEN 'INSERT' THEN jsonb_build_object(
                            'attempted_intel_score', NEW.intel_score,
                            'note',       'insert_rejected_by_protect_trigger_defaulting_to_null')
       END,
       'before_protect_trigger',
       'silent_revert_attempt');
  END IF;
  RETURN NEW;
END;
$fn$;

-- 7.5 audit_users_score_change — migration 010.
--       AFTER UPDATE on users. Classifies the actor and writes an audit
--       row whenever intel_score actually changes.
CREATE OR REPLACE FUNCTION public.audit_users_score_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_actor_role text;
  v_reason     text;
BEGIN
  IF NEW.intel_score IS DISTINCT FROM OLD.intel_score THEN
    IF current_user = 'postgres'
       OR session_user = 'service_role'
       OR pg_has_role(session_user, 'service_role', 'MEMBER') THEN
      v_actor_role := 'service';
      v_reason     := 'service_legitimate';
    ELSIF auth.uid() IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.users
                    WHERE id = auth.uid() AND is_admin = TRUE) THEN
      v_actor_role := 'admin';
      v_reason     := 'admin_legitimate';
    ELSE
      -- Reaching this branch means protect_trigger was disabled/bypassed;
      -- log it as a canary event.
      v_actor_role := 'authenticated';
      v_reason     := 'protect_trigger_disabled_canary';
    END IF;

    INSERT INTO public.audit_log
      (actor_role, actor_user_id, table_name, operation, row_pk,
       prev_value, new_value, attribution, reason)
    VALUES
      (v_actor_role, auth.uid(), 'users', 'UPDATE', NEW.id::text,
       jsonb_build_object('intel_score', OLD.intel_score),
       jsonb_build_object('intel_score', NEW.intel_score),
       'trg_protect_users_sensitive_columns',
       v_reason);
  END IF;
  RETURN NEW;
END;
$fn$;

-- 7.6 audit_scoring_events_change — migration 010.
--       AFTER INSERT/UPDATE/DELETE on scoring_events.
CREATE OR REPLACE FUNCTION public.audit_scoring_events_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_actor_role text;
  v_op         text;
  v_prev       jsonb;
  v_new        jsonb;
  v_reason     text;
  v_row_pk     text;
BEGIN
  IF current_user = 'postgres' OR session_user = 'service_role'
     OR pg_has_role(session_user, 'service_role', 'MEMBER') THEN
    v_actor_role := 'service';
    v_reason     := 'rpc_legitimate';
  ELSE
    v_actor_role := 'authenticated';
    v_reason     := 'suspicious_direct_write';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_op := 'INSERT';
    v_prev := NULL;
    v_new := to_jsonb(NEW);
    v_row_pk := NEW.id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_op := 'UPDATE';
    v_prev := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_row_pk := NEW.id::text;
  ELSE -- DELETE
    v_op := 'DELETE';
    v_prev := to_jsonb(OLD);
    v_new := NULL;
    v_row_pk := OLD.id::text;
  END IF;

  INSERT INTO public.audit_log
    (actor_role, actor_user_id, table_name, operation, row_pk,
     prev_value, new_value, attribution, reason)
  VALUES
    (v_actor_role, auth.uid(), 'scoring_events', v_op, v_row_pk,
     v_prev, v_new, 'rpc_or_direct', v_reason);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$fn$;

-- 7.7 evaluate_match_predictions — migrations 002 / 005.
--       Canonical POST-FIX body (delta-cap with GREATEST(-eu.current_score, …))
--       so reversals are mathematically exact. The 005 fix is mandatory —
--       older 002 builds mints phantom points on score-floor truncation.
CREATE OR REPLACE FUNCTION public.evaluate_match_predictions(
  p_match_id        uuid,
  p_result          text,
  p_scoring_version text    DEFAULT 'v1',
  p_force           boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_match_status    text;
  v_match_result    text;
  v_evaluation_id   uuid := gen_random_uuid();
  v_affected_count  int;
  v_correct_count   int;
  v_total_count     int;
  v_event_reason    text;
BEGIN
  ---------------------------------------------------------------------------
  -- 0. Validate inputs
  ---------------------------------------------------------------------------
  IF p_result NOT IN ('team1_win','team2_win','draw') THEN
    RAISE EXCEPTION 'invalid_result: must be team1_win|team2_win|draw, got %', p_result;
  END IF;
  IF p_scoring_version IS NULL OR length(p_scoring_version) = 0 THEN
    RAISE EXCEPTION 'invalid_scoring_version: must be non-empty';
  END IF;

  ---------------------------------------------------------------------------
  -- 1. Lock the match row first (globally consistent lock order)
  ---------------------------------------------------------------------------
  SELECT status, result
    INTO v_match_status, v_match_result
    FROM public.matches
   WHERE id = p_match_id
     FOR UPDATE;

  IF v_match_status IS NULL THEN
    RAISE EXCEPTION 'match_not_found: %', p_match_id;
  END IF;

  -- Idempotent no-op (unless caller forced a recompute, e.g. for backfill).
  IF v_match_status = 'completed' AND v_match_result = p_result AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success',           true,
      'previouslyResolved', true,
      'evaluationId',      v_evaluation_id,
      'correctCount',      0,
      'totalResolves',     0,
      'predictorCount',    0,
      'deltas',            '[]'::jsonb
    );
  END IF;

  v_event_reason := CASE
    WHEN v_match_status = 'completed' THEN 'match_corrected'
    WHEN p_result = 'draw'            THEN 'match_void'
    ELSE                                   'match_resolved'
  END;

  ---------------------------------------------------------------------------
  -- 2. Snapshot + lock affected users (ordered by user_id to prevent
  --    deadlocks against ourselves). Temp dropped at COMMIT.
  ---------------------------------------------------------------------------
  CREATE TEMP TABLE _eval_users (
    user_id       uuid PRIMARY KEY,
    pred_id       uuid NOT NULL,
    pred_pick     text,
    confidence    integer NOT NULL,
    is_correct    boolean,
    delta         integer NOT NULL,
    current_score integer NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO _eval_users(user_id, pred_id, pred_pick, confidence, is_correct, delta, current_score)
  SELECT
    p.user_id, p.id, p.prediction, p.confidence, NULL, 0,
    COALESCE(u.intel_score, 0)
  FROM public.predictions p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.match_id = p_match_id
  ORDER BY p.user_id
  FOR UPDATE OF u;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  ---------------------------------------------------------------------------
  -- 3. Compute deltas + is_correct (CANONICAL post-fix math).
  --    Negative deltas are clipped to current_score so recorded delta always
  --    equals applied delta → reversals are mathematically exact.
  ---------------------------------------------------------------------------
  UPDATE _eval_users eu
     SET is_correct = CASE
            WHEN p_result = 'draw'                                          THEN NULL
            WHEN eu.pred_pick = 'team1' AND p_result = 'team1_win'          THEN TRUE
            WHEN eu.pred_pick = 'team2' AND p_result = 'team2_win'          THEN TRUE
            ELSE FALSE
          END,
         delta = CASE
            WHEN p_result = 'draw'                                          THEN 0
            WHEN (eu.pred_pick = 'team1' AND p_result = 'team1_win')
              OR (eu.pred_pick = 'team2' AND p_result = 'team2_win')         THEN ROUND(eu.confidence * 10)::int
            ELSE GREATEST(-eu.current_score, -ROUND(eu.confidence * 5)::int)
          END;

  SELECT
    COUNT(*) FILTER (WHERE is_correct = TRUE),
    COUNT(*) FILTER (WHERE is_correct IS NOT NULL)
    INTO v_correct_count, v_total_count
  FROM _eval_users;

  ---------------------------------------------------------------------------
  -- 4. Reverse any prior scoring_events for this match (correction path).
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM public.scoring_events WHERE match_id = p_match_id) THEN
    UPDATE public.users u
       SET intel_score = GREATEST(0, u.intel_score - e.delta)
      FROM public.scoring_events e
     WHERE u.id = e.user_id
       AND e.match_id = p_match_id;

    DELETE FROM public.scoring_events WHERE match_id = p_match_id;
  END IF;

  ---------------------------------------------------------------------------
  -- 5. Apply new deltas (relative, atomic, clipped to floor).
  ---------------------------------------------------------------------------
  UPDATE public.users u
     SET intel_score = GREATEST(0, u.intel_score + eu.delta)
    FROM _eval_users eu
   WHERE u.id = eu.user_id;

  ---------------------------------------------------------------------------
  -- 6. Update match.status + result.
  ---------------------------------------------------------------------------
  UPDATE public.matches
     SET result = p_result,
         status = 'completed'
   WHERE id = p_match_id;

  ---------------------------------------------------------------------------
  -- 7. Update every prediction row. This UPDATE expects:
  --    `predictions.result`, `predictions.is_correct`, `predictions.evaluated_at`.
  --    `evaluated_at` is added by THIS migration (Section 2) if missing.
  ---------------------------------------------------------------------------
  UPDATE public.predictions p
     SET result       = CASE
            WHEN p_result = 'draw'                                  THEN 'void'
            WHEN p.prediction = 'team1' AND p_result = 'team1_win'  THEN 'correct'
            WHEN p.prediction = 'team2' AND p_result = 'team2_win'  THEN 'correct'
            ELSE 'incorrect'
          END,
         is_correct   = CASE
            WHEN p_result = 'draw'                                  THEN NULL
            WHEN p.prediction = 'team1' AND p_result = 'team1_win'  THEN TRUE
            WHEN p.prediction = 'team2' AND p_result = 'team2_win'  THEN TRUE
            ELSE FALSE
          END,
         evaluated_at = now()
   WHERE p.match_id = p_match_id;

  ---------------------------------------------------------------------------
  -- 8. Record every non-zero delta as a scoring_event.
  ---------------------------------------------------------------------------
  INSERT INTO public.scoring_events
         (user_id, match_id, prediction_id, delta, reason, scoring_version)
  SELECT user_id, p_match_id, pred_id, delta, v_event_reason, p_scoring_version
    FROM _eval_users
   WHERE delta <> 0;

  ---------------------------------------------------------------------------
  -- 9. Build summary JSON for the API layer.
  ---------------------------------------------------------------------------
  RETURN jsonb_build_object(
    'success',           true,
    'previouslyResolved', false,
    'evaluationId',      v_evaluation_id,
    'correctCount',      v_correct_count,
    'totalResolves',     v_total_count,
    'predictorCount',    v_affected_count,
    'reason',            v_event_reason,
    'deltas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id',       user_id::text,
        'prediction_id', pred_id::text,
        'delta',         delta,
        'is_correct',    is_correct
      ) ORDER BY user_id)
      FROM _eval_users
    ), '[]'::jsonb)
  );
END;
$fn$;

-- 7.8 verify_leaderboard_integrity — migration 011.
--       Pure-read: returns divergent users ordered by largest mismatch.
CREATE OR REPLACE FUNCTION public.verify_leaderboard_integrity()
RETURNS TABLE (
  user_id             uuid,
  username            text,
  stored_intel_score  integer,
  derived_intel_score bigint,
  delta_mismatch      bigint,
  event_count         bigint,
  last_event_at       timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, username, stored_intel_score, derived_intel_score,
         delta_mismatch, event_count, last_event_at
    FROM public.leaderboard_replay
   WHERE stored_intel_score <> derived_intel_score
   ORDER BY ABS(delta_mismatch) DESC, user_id;
$$;

-- 7.9 verify_one_user_integrity — migration 013 (privacy envelope).
--       COALESCE-based `user_not_found` response rather than silent NULL.
CREATE OR REPLACE FUNCTION public.verify_one_user_integrity(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
              'user_id',             user_id,
              'username',            username,
              'stored_intel_score',  stored_intel_score,
              'derived_intel_score', derived_intel_score,
              'delta_mismatch',      delta_mismatch,
              'event_count',         event_count,
              'last_event_at',       last_event_at,
              'healthy',             stored_intel_score = derived_intel_score,
              'requested_user_id',   p_user_id
            )
       FROM public.leaderboard_replay
      WHERE user_id = p_user_id),
    jsonb_build_object('healthy', NULL,
                       'reason', 'user_not_found',
                       'requested_user_id', p_user_id)
  );
$$;

-- ============================================================================
-- 8. RLS ENABLE + POLICIES
-- ============================================================================
ALTER TABLE public.scoring_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scoring_events_self_read ON public.scoring_events;
CREATE POLICY scoring_events_self_read ON public.scoring_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- No INSERT/UPDATE/DELETE policy is exposed → only service_role and the
-- SECURITY DEFINER RPC may mutate. service_role bypasses RLS by default.

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_admin_read ON public.audit_log;
CREATE POLICY audit_log_admin_read ON public.audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));
-- No INSERT/UPDATE/DELETE policy → only triggers (running as postgres) and
-- direct DB console access can mutate. The triggers SECURITY DEFINER bypass
-- this by switching to function-owner context (postgres).

-- ============================================================================
-- 9. TRIGGERS — DROP IF EXISTS + CREATE.
--    Order is irrelevant at SQL-execution time but the canonical names
--    guarantee correct BEFORE-trigger alphabetical firing:
--      1. aaa_audit_users_intel_score_attempt  (BEFORE INSERT OR UPDATE on users)
--      2. trg_protect_users_sensitive_columns (BEFORE UPDATE on users)
--      3. trg_block_prediction_…              (BEFORE INSERT OR UPDATE on predictions)
--      4. (any future BEFORE triggers)
--      5. UPDATE happens
--      6. trg_audit_users_score_change        (AFTER UPDATE on users)
--      7. trg_audit_scoring_events            (AFTER INSERT/UPDATE/DELETE on scoring_events)
-- ============================================================================

-- 9.1 Fire BEFORE protect_trigger so we capture attempted values prior to revert.
DROP TRIGGER IF EXISTS aaa_audit_users_intel_score_attempt ON public.users;
CREATE TRIGGER aaa_audit_users_intel_score_attempt
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_users_intel_score_attempt();

-- 9.2 Silent reverter for unprivileged writes to intel_score / is_admin.
DROP TRIGGER IF EXISTS trg_protect_users_sensitive_columns ON public.users;
CREATE TRIGGER trg_protect_users_sensitive_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_users_sensitive_columns();

-- 9.3 Block prediction mutation post-completion (INSERT OR UPDATE scope).
DROP TRIGGER IF EXISTS trg_block_prediction_updates_after_completed ON public.predictions;
CREATE TRIGGER trg_block_prediction_updates_after_completed
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_prediction_field_updates_after_match();

-- 9.4 AFTER UPDATE on users — observes legitimate intel_score changes.
DROP TRIGGER IF EXISTS trg_audit_users_score_change ON public.users;
CREATE TRIGGER trg_audit_users_score_change
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_users_score_change();

-- 9.5 AFTER INSERT/UPDATE/DELETE on scoring_events — observes ledger writes.
DROP TRIGGER IF EXISTS trg_audit_scoring_events ON public.scoring_events;
CREATE TRIGGER trg_audit_scoring_events
  AFTER INSERT OR UPDATE OR DELETE ON public.scoring_events
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_scoring_events_change();

-- 9.6 Baseline auth trigger that provisions public.users on signup.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 10. GRANTS — final canonical state (revision: 013).
--     verify_* RPCs are restricted to service_role only; the prior leak
--     to authenticated is reverted (REVOKE is idempotent in PG).
-- ============================================================================
GRANT  EXECUTE ON FUNCTION public.evaluate_match_predictions(uuid, text, text, boolean)
  TO service_role;
GRANT  EXECUTE ON FUNCTION public.verify_leaderboard_integrity()
  TO service_role;
GRANT  EXECUTE ON FUNCTION public.verify_one_user_integrity(uuid)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.verify_leaderboard_integrity()        FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_one_user_integrity(uuid)       FROM authenticated;

GRANT  SELECT  ON public.leaderboard_replay                              TO service_role;
-- verify_* read leaderboard_replay as postgres (SECURITY DEFINER); explicit
-- grant lets non-SECURITY-DEFINER callers (none expected) still query if needed.

GRANT EXECUTE ON FUNCTION public.handle_new_user()                      TO service_role;

-- ============================================================================
-- VERIFY
-- ============================================================================
-- 1. Schema objects:
--    SELECT count(*) FROM information_schema.tables
--      WHERE table_schema='public' AND table_name IN
--        ('scoring_events','audit_log','predictions','users','matches');
--    EXPECTED: 5 (all present).
--
--    SELECT count(*) FROM information_schema.columns
--      WHERE table_schema='public' AND table_name='predictions'
--        AND column_name IN ('confidence','evaluated_at');
--    EXPECTED: 2 (both present).
--
-- 2. Function presence:
--    SELECT proname FROM pg_proc
--      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
--        AND proname IN
--          ('evaluate_match_predictions',
--           'verify_leaderboard_integrity',
--           'verify_one_user_integrity',
--           'protect_users_sensitive_columns',
--           'block_prediction_field_updates_after_match',
--           'audit_users_intel_score_attempt',
--           'audit_users_score_change',
--           'audit_scoring_events_change',
--           'handle_new_user');
--    EXPECTED: 9 (all present, post-013 canonical bodies).
--
-- 3. Trigger presence (canonical names; alphabetical firing order preserved):
--    SELECT tgname FROM pg_trigger
--     WHERE tgrelid IN (
--       'public.users'::regclass,
--       'public.predictions'::regclass,
--       'public.scoring_events'::regclass,
--       'auth.users'::regclass
--     );
--    EXPECTED: aaa_audit_users_intel_score_attempt, trg_protect_users_sensitive_columns,
--              trg_block_prediction_updates_after_completed, trg_audit_users_score_change,
--              trg_audit_scoring_events, on_auth_user_created  → 6 total.
--
-- 4. Idempotency smoke-test:
--    -- Re-run this migration. No errors expected.
--
-- 5. RPC happy-path smoke-test:
--    SELECT * FROM public.verify_leaderboard_integrity();
--    EXPECTED: zero rows on a clean DB.
--
--    SELECT evaluate_match_predictions(
--      (SELECT id FROM public.matches WHERE status='upcoming' LIMIT 1),
--      'team1_win', 'v1'
--    );
--    EXPECTED on first call: jsonb with success=true, deltas for every predictor.
--    EXPECTED on second call (without p_force): previouslyResolved=true.
--
-- ============================================================================
-- ROLLBACK (manual; do not run unless you need to revert the entire repair):
-- ============================================================================
--   DROP TABLE IF EXISTS public.audit_log CASCADE;
--   DROP TABLE IF EXISTS public.scoring_events CASCADE;
--   DROP VIEW  IF EXISTS public.leaderboard_replay;
--
--   ALTER TABLE public.predictions DROP COLUMN IF EXISTS evaluated_at;
--   ALTER TABLE public.predictions DROP CONSTRAINT IF EXISTS predictions_confidence_check;
--   ALTER TABLE public.predictions DROP COLUMN IF EXISTS confidence;
--
--   DROP FUNCTION IF EXISTS public.evaluate_match_predictions(uuid, text, text, boolean);
--   DROP FUNCTION IF EXISTS public.verify_one_user_integrity(uuid);
--   DROP FUNCTION IF EXISTS public.verify_leaderboard_integrity();
--   DROP FUNCTION IF EXISTS public.audit_scoring_events_change();
--   DROP FUNCTION IF EXISTS public.audit_users_score_change();
--   DROP FUNCTION IF EXISTS public.audit_users_intel_score_attempt();
--   DROP FUNCTION IF EXISTS public.block_prediction_field_updates_after_match();
--   DROP FUNCTION IF EXISTS public.protect_users_sensitive_columns();
--   -- public.handle_new_user is a baseline object; do not drop in partial rollback.
-- ============================================================================
