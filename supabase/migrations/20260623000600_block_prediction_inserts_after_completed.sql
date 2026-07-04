-- ============================================================================
-- Migration: 20260623000600_block_prediction_inserts_after_completed.sql
-- Purpose:   Strengthen the existing immutability trigger so it also rejects
--            INSERTs of a prediction after a match has reached `completed`.
--            Closes the cosmetic-profile-pollution loophole documented in
--            docs/POST_REMEDIATION_VALIDATION.md (MEDIUM issue).
--
-- Why this matters:
--   The original migration (20260623000400) only bound the trigger to
--   `BEFORE UPDATE`, allowing a malicious or stray client to issue a direct
--   INSERT against the Supabase REST API for a completed match. The result is
--   a prediction row with `result = 'pending'` that sits indefinitely on
--   the user's profile. The scoring math is unaffected (RPC evaluation has
--   already locked the match's user set), but the profile UI displays an
--   inconsistent state.
--
-- What this migration does NOT do:
--   • Does not change the RPC.
--   • Does not change scoring_events.
--   • Does not touch predictions.confidence defaults.
--
-- Risk:
--   The trigger function body is rewritten to branch on TG_OP (INSERT vs
--   UPDATE). INSERT path skips the OLD-NULL DISTINCT comparison and goes
--   straight to the match-status lookup. The UPDATE path is identical to
--   the previous behaviour so existing client UPDATE flows are unaffected.
-- ============================================================================

SET search_path = public;

CREATE OR REPLACE FUNCTION public.block_prediction_field_updates_after_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_match_status text;
  v_should_check boolean;
BEGIN
  ---------------------------------------------------------------------------
  -- INSERT path: every fresh INSERT targets a specific match row, so
  -- we always check the match status. There is no OLD row to compare
  -- against, so we skip the DISTINCT check entirely.
  --
  -- UPDATE path: only block if the user is touching the two user-owned
  -- fields (`prediction`, `confidence`). RPC-managed fields
  -- (`result`, `is_correct`, `evaluated_at`) flow through unchanged.
  ---------------------------------------------------------------------------
  IF TG_OP = 'INSERT' THEN
    v_should_check := TRUE;
  ELSE
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

DROP TRIGGER IF EXISTS trg_block_prediction_updates_after_completed ON public.predictions;
CREATE TRIGGER trg_block_prediction_updates_after_completed
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_prediction_field_updates_after_match();

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- -- As a logged-in client (NOT service_role, NOT admin):
-- UPDATE public.predictions
--    SET prediction = 'team2'
--  WHERE match_id = (SELECT id FROM public.matches WHERE status='completed' LIMIT 1)
--    AND user_id = (SELECT id FROM public.users WHERE is_admin = FALSE LIMIT 1);
-- -- EXPECTED: psycopg / supabase-js raises the exception above. ✅
--
-- INSERT INTO public.predictions(user_id, match_id, prediction, confidence)
-- SELECT (SELECT id FROM public.users WHERE is_admin = FALSE LIMIT 1),
--        (SELECT id FROM public.matches WHERE status='completed' LIMIT 1),
--        'team1',
--        50;
-- -- EXPECTED: same exception, INSERT blocked. ✅
--
-- UPDATE public.predictions
--    SET result = 'correct'
--  WHERE match_id = (SELECT id FROM public.matches WHERE status='completed' LIMIT 1)
--    AND result = 'pending';
-- -- EXPECTED: succeeds — `result` is RPC-managed, not in the trigger guard.
-- --          (NOTE: under RLS, a non-service-role cannot UPDATE this column
-- --          anyway; only the SECURITY DEFINER RPC can write `result`.)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   DROP TRIGGER IF EXISTS trg_block_prediction_updates_after_completed ON public.predictions;
--   CREATE TRIGGER trg_block_prediction_updates_after_completed
--     BEFORE UPDATE ON public.predictions
--     FOR EACH ROW
--     EXECUTE FUNCTION public.block_prediction_field_updates_after_match();
--   -- (Restores the pre-patch behaviour where INSERT was not blocked.)
-- ---------------------------------------------------------------------------
