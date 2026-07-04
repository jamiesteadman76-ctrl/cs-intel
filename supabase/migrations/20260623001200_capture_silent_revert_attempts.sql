-- ============================================================================
-- Migration: 20260623001200_capture_silent_revert_attempts.sql
-- Purpose:   Surgical fix for the audit silent-revert gap (see
--            docs/MONITORING_AND_INTEGRITY.md §3 / review notes).
--
-- Background:
--   The existing trg_protect_users_sensitive_columns (migration 003) is a
--   BEFORE UPDATE trigger that silently rewrites
--       NEW.intel_score := OLD.intel_score
--   when the calling role is not privileged. By the time the AFTER trigger
--   `trg_audit_users_score_change` (migration 010) reads NEW, the values are
--   already equal, so its outer
--       IF NEW.intel_score IS DISTINCT FROM OLD.intel_score
--   is false and NO audit row is written.
--
-- Fix:
--   Add a sibling BEFORE INSERT OR UPDATE trigger that fires BEFORE
--   trg_protect_users_sensitive_columns (Postgres fires BEFORE triggers in
--   alphabetical order). It captures the user's attempted value into the
--   audit log before the protect trigger has a chance to revert it.
--
-- Trigger ordering (alphabetical):
--   1. aaa_audit_users_intel_score_attempt (THIS file) — fires first
--   2. trg_protect_users_sensitive_columns (migration 003) — may revert
--   3. (any other BEFORE triggers in future)
--   4. UPDATE happens
--   5. trg_audit_users_score_change (migration 010) — fires for legitimate writes
--
-- Result:
--   Every tamper attempt produces an audit_log row with reason =
--   'silent_revert_attempt' AND prev_value->>'attempted' = the value the
--   attacker typed before reversion. The existing AFTER trigger handles
--   legitimate writes unchanged.
-- ============================================================================

SET search_path = public;

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
  ---------------------------------------------------------------------------
  -- Mirror the protect_trigger's privileged check exactly. Only audit
  -- attempts that the protect_trigger is ABOUT to revert. Writes from
  -- service_role, postgres, or admins are recorded by the AFTER trigger
  -- (`trg_audit_users_score_change` from migration 010). Logging them here
  -- too would produce duplicate audit rows for legitimate writes.
  ---------------------------------------------------------------------------
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
       -- Post-revert stored value: protect_trigger will overwrite NEW (or
       -- violate NOT NULL on INSERT, which is itself a canary). The JSON
       -- shape branches on TG_OP so OLD.intel_score isn't reported as
       -- `null` on INSERT (where OLD is the NULL row).
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

DROP TRIGGER IF EXISTS aaa_audit_users_intel_score_attempt ON public.users;
CREATE TRIGGER aaa_audit_users_intel_score_attempt
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_users_intel_score_attempt();

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- -- As a non-admin user, attempt direct UPDATE:
-- UPDATE public.users SET intel_score = 9999999 WHERE id = (SELECT id FROM users WHERE is_admin = FALSE LIMIT 1);
-- SELECT intel_score FROM public.users WHERE id = <that user>;
-- EXPECTED: score UNCHANGED (protect_trigger reverted it).
--
-- -- Inspect the audit trail (should now contain an attempt record):
-- SELECT occurred_at, actor_role, operation, reason, prev_value
--   FROM public.audit_log
--  WHERE attribution = 'before_protect_trigger'
--    AND reason = 'silent_revert_attempt'
--  ORDER BY occurred_at DESC LIMIT 1;
-- EXPECTED: one row with reason='silent_revert_attempt' and
--           prev_value->>'attempted' = '9999999'.
--
-- -- Inspect the AFTER-trigger record (legitimate writes remain captured):
-- -- INSERT a new score via service_role (RPC path) → reason='service_legitimate'
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   DROP TRIGGER IF EXISTS aaa_audit_users_intel_score_attempt ON public.users;
--   DROP FUNCTION IF EXISTS public.audit_users_intel_score_attempt();
-- ---------------------------------------------------------------------------
