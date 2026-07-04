-- ============================================================================
-- Migration: 20260623000400_block_predictions_after_match_completed.sql
-- Purpose:   Once a match is resolved, its prediction rows are part of the
--            immutable scoring history. Block any client-side UPDATE that
--            would change the prediction pick or confidence after resolution.
-- Scoring-side fields (result, is_correct, evaluated_at) are still written
-- by the SECURITY DEFINER RPC, which runs as postgres and bypasses checks
-- via a session-local lock_guard_guc if needed. The trigger only inspects
-- 'prediction' and 'confidence' (the user-owned fields).
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
BEGIN
  IF NEW.prediction IS DISTINCT FROM OLD.prediction
     OR NEW.confidence IS DISTINCT FROM OLD.confidence
  THEN
    SELECT status INTO v_match_status
      FROM public.matches WHERE id = NEW.match_id;

    IF v_match_status = 'completed' THEN
      RAISE EXCEPTION
        'prediction_locked: cannot change prediction or confidence after match is resolved';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_block_prediction_updates_after_completed ON public.predictions;
CREATE TRIGGER trg_block_prediction_updates_after_completed
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_prediction_field_updates_after_match();

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- UPDATE public.predictions SET prediction = 'team2'
--  WHERE match_id = (SELECT id FROM public.matches WHERE status='completed' LIMIT 1)
--    AND user_id = (SELECT id FROM public.users WHERE is_admin = FALSE LIMIT 1);
-- EXPECTED: psycopg / supabase-js raises the exception above.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   DROP TRIGGER IF EXISTS trg_block_prediction_updates_after_completed ON public.predictions;
--   DROP FUNCTION IF EXISTS public.block_prediction_field_updates_after_match();
-- ---------------------------------------------------------------------------
