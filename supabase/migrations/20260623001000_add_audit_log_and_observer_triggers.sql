-- ============================================================================
-- Migration: 20260623001000_add_audit_log_and_observer_triggers.sql
-- Purpose:   Additive monitoring layer. Adds:
--              • public.audit_log          — append-only forensic trail
--              • trg_audit_users_score     — AFTER UPDATE on users
--              • trg_audit_scoring_events  — AFTER INSERT/UPDATE/DELETE
--
-- This migration does NOT modify scoring logic, the RPC, or any
-- existing trigger. It only OBSERVES writes that already happen.
--
-- Design:
--   • audit_log is append-only. No UPDATE/DELETE policy for client roles.
--   • Admin SELECT is allowed via RLS based on is_admin=true lookup.
--   • Triggers run AFTER so they never block the underlying write.
--   • Every row records actor (current_user / auth.uid()), table, operation,
--     prior/new JSON snapshots, and a `reason` classifying the change.
--
-- Reason taxonomy (free-text, but documented for dashboards):
--   'rpc_legitimate'                  — change came from SECURITY DEFINER RPC
--                                       or service_role (e.g. evaluate_match).
--   'service_legitimate'              — change came from service role directly
--                                       (e.g. backfill via psql console).
--   'reverted_by_protect_trigger'     — BEFORE trigger silently reverted;
--                                       intel_score unchanged but attempt
--                                       was logged.
--   'reverted_by_block_pred_trigger'  — predicted-field mutation after match
--                                       completed; raise happened (no row
--                                       persisted in scoring_events).
--   'tamper_attempt_blocked'          — write attempted and was rejected
--                                       by an exception (no row persisted).
--
-- Noise expectation: a single match resolve against 50 predictors writes
--   50 scoring_events rows × 1 audit row each = 50
--   + users UPDATEs ≈ 100 (2 per user: reversal + apply)
--   = ~150 audit rows per resolve. Comfortable for hourly dashboards.
-- ============================================================================

SET search_path = public;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              bigserial PRIMARY KEY,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  actor_role      text        NOT NULL,
  actor_user_id   uuid        NULL,
  table_name      text        NOT NULL,
  operation       text        NOT NULL CHECK (operation IN
                     ('INSERT','UPDATE','DELETE','REVERT','BLOCK')),
  row_pk          text        NOT NULL,
  prev_value      jsonb       NULL,
  new_value       jsonb       NULL,
  attribution     text        NULL,  -- which RPC / trigger is making the change
  reason          text        NULL,
  correlation_id  uuid        NULL   -- for stitching a single user flow
);

CREATE INDEX IF NOT EXISTS idx_audit_log_occurred_at   ON public.audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor        ON public.audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_op     ON public.audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_reason       ON public.audit_log(reason);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_admin_read ON public.audit_log;
CREATE POLICY audit_log_admin_read ON public.audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

-- No INSERT/UPDATE/DELETE policy → only triggers (running as postgres / service)
-- and direct DB console access can mutate the table.

-- ---------------------------------------------------------------------------
-- Observer trigger on public.users — fires only on intel_score changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_users_score_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_actor_role text;
  v_reason text;
BEGIN
  IF NEW.intel_score IS DISTINCT FROM OLD.intel_score THEN
    -- Classify the actor. Aligned with the protect_trigger's privileged
    -- check so the audit_log is consistent with what that trigger lets
    -- through. We never observe NEW.intel_score == OLD.intel_score here
    -- (BEFORE trigger would have already reverted earlier), so the prior
    -- "reverted_by_protect_trigger" branch is unnecessary; the BEFORE
    -- trigger `aaa_audit_users_intel_score_attempt` (migration 012) is the
    -- canonical source for revert forensics.
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
      -- The protect_trigger should have reverted this. Reaching this branch
      -- means the trigger was disabled or bypassed. Treat as a canary event.
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

DROP TRIGGER IF EXISTS trg_audit_users_score_change ON public.users;
CREATE TRIGGER trg_audit_users_score_change
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_users_score_change();

-- ---------------------------------------------------------------------------
-- Observer trigger on public.scoring_events — fires on every row change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_scoring_events_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_actor_role text;
  v_op text;
  v_prev jsonb;
  v_new  jsonb;
  v_reason text;
  v_row_pk text;
BEGIN
  -- Classify the actor
  IF current_user = 'postgres' OR session_user = 'service_role'
     OR pg_has_role(session_user, 'service_role', 'MEMBER') THEN
    v_actor_role := 'service';
    v_reason     := 'rpc_legitimate';
  ELSE
    v_actor_role := 'authenticated';
    v_reason     := 'suspicious_direct_write'; -- only DB-mutating roles should write here
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

DROP TRIGGER IF EXISTS trg_audit_scoring_events ON public.scoring_events;
CREATE TRIGGER trg_audit_scoring_events
  AFTER INSERT OR UPDATE OR DELETE ON public.scoring_events
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_scoring_events_change();

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- SELECT count(*) FROM public.audit_log;
-- SELECT actor_role, operation, reason, count(*)
--   FROM public.audit_log
--  GROUP BY 1,2,3 ORDER BY 4 DESC;
-- EXPECTED: a small, well-distributed set of reasons; never grow >5k rows/day.
--
-- SELECT * FROM public.verify_leaderboard_integrity(); -- see migration 011
-- EXPECTED: zero rows for a clean database.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   DROP TRIGGER IF EXISTS trg_audit_scoring_events ON public.scoring_events;
--   DROP TRIGGER IF EXISTS trg_audit_users_score_change ON public.users;
--   DROP FUNCTION IF EXISTS public.audit_scoring_events_change();
--   DROP FUNCTION IF EXISTS public.audit_users_score_change();
--   DROP POLICY IF EXISTS audit_log_admin_read ON public.audit_log;
--   DROP TABLE IF EXISTS public.audit_log CASCADE;
-- ---------------------------------------------------------------------------
