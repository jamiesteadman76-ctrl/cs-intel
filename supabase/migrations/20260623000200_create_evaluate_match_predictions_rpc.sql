-- ============================================================================
-- Migration: 20260623000200_create_evaluate_match_predictions_rpc.sql
-- Purpose:   Single atomic transaction for "set match result, evaluate
--            predictions, update intel_scores, write scoring_events".
--            Replaces the N+1 read-then-write JS orchestration in
--            lib/api/index.ts so that:
--              • partial failures cannot occur (one tx or rollback)
--              • score updates are race-safe (FOR UPDATE on affected users)
--              • result corrections correctly REVERSE prior deltas
--              • duplicate/no-op calls are detected (idempotent)
-- Lock order (must be globally consistent to prevent deadlocks):
--              1. matches row  (FOR UPDATE)
--              2. affected users ordered by user_id  (FOR UPDATE)
-- Scoring math (intentionally identical to public documentation so the
-- JS-side `calculateIntelScore` preview mirror matches what's stored):
--              win       →  delta =  confidence * 10
--              loss      →  delta = -confidence * 5
--              draw/void →  delta =  0   (no points gained or lost)
-- Confidence floor is 50 because the column has CHECK (confidence >= 50).
-- ============================================================================

SET search_path = public;

DROP FUNCTION IF EXISTS public.evaluate_match_predictions(uuid, text, text, boolean);

CREATE OR REPLACE FUNCTION public.evaluate_match_predictions(
  p_match_id        uuid,
  p_result          text,
  p_scoring_version text    DEFAULT 'v1',
  p_force           boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as function owner (postgres); bypasses users RLS for write
SET search_path = public
AS $fn$
DECLARE
  v_match_status text;
  v_match_result text;
  v_evaluation_id uuid := gen_random_uuid();
  v_affected_count int;
  v_correct_count int;
  v_total_count int;
  v_event_reason text;
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

  -- Idempotent no-op (unless caller forced a recompute, e.g. for backfill)
  IF v_match_status = 'completed' AND v_match_result = p_result AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', true,
      'previouslyResolved', true,
      'evaluationId', v_evaluation_id,
      'correctCount', 0,
      'totalResolves', 0,
      'predictorCount', 0,
      'deltas', '[]'::jsonb
    );
  END IF;

  v_event_reason := CASE
    WHEN v_match_status = 'completed'           THEN 'match_corrected'
    WHEN p_result = 'draw'                      THEN 'match_void'
    ELSE                                             'match_resolved'
  END;

  ---------------------------------------------------------------------------
  -- 2. Snapshot + lock affected users.
  --    The planner is encouraged to scan via idx_predictions_user_id (created
  --    in the baseline schema), so locks on users are acquired in user_id order.
  --    If the planner chooses a different path, Postgres' 10s deadlock_detected
  --    will surface the cycle and the API returns 409 to the admin; retry safe.
  --    Temp table is dropped at COMMIT.
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
    p.user_id,
    p.id,
    p.prediction,
    p.confidence,
    NULL,
    0,
    COALESCE(u.intel_score, 0)
  FROM public.predictions p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.match_id = p_match_id
  ORDER BY p.user_id
  FOR UPDATE OF u;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  ---------------------------------------------------------------------------
  -- 3. Compute deltas + is_correct, in-memory
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
            ELSE                                                                    -ROUND(eu.confidence * 5)::int
          END;

  SELECT
    COUNT(*) FILTER (WHERE is_correct = TRUE),
    COUNT(*) FILTER (WHERE is_correct IS NOT NULL)
    INTO v_correct_count, v_total_count
  FROM _eval_users;

  ---------------------------------------------------------------------------
  -- 4. Reverse any prior scoring_events for this match (correction path).
  --    Only events that THIS system recorded are reversed — there is no
  --    prior history outside scoring_events, so we never double-debit.
  --    Note: the UPDATE on users below does NOT re-acquire row locks because
  --    step 2 already holds FOR UPDATE on the same user_id set for this tx.
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
  -- 5. Apply new deltas (relative, atomic)
  ---------------------------------------------------------------------------
  UPDATE public.users u
     SET intel_score = GREATEST(0, u.intel_score + eu.delta)
    FROM _eval_users eu
   WHERE u.id = eu.user_id;

  ---------------------------------------------------------------------------
  -- 6. Update match.status + result
  ---------------------------------------------------------------------------
  UPDATE public.matches
     SET result = p_result,
         status = 'completed'
   WHERE id = p_match_id;

  ---------------------------------------------------------------------------
  -- 7. Update every prediction row (one statement, not a JS loop)
  ---------------------------------------------------------------------------
  UPDATE public.predictions p
     SET result        = CASE
            WHEN p_result = 'draw'                                  THEN 'void'
            WHEN p.prediction = 'team1' AND p_result = 'team1_win'  THEN 'correct'
            WHEN p.prediction = 'team2' AND p_result = 'team2_win'  THEN 'correct'
            ELSE 'incorrect'
          END,
         is_correct    = CASE
            WHEN p_result = 'draw'                                  THEN NULL
            WHEN p.prediction = 'team1' AND p_result = 'team1_win'  THEN TRUE
            WHEN p.prediction = 'team2' AND p_result = 'team2_win'  THEN TRUE
            ELSE FALSE
          END,
         evaluated_at   = now()
   WHERE p.match_id = p_match_id;

  ---------------------------------------------------------------------------
  -- 8. Record every non-zero delta as a scoring_event.
  --    Void matches produce delta = 0 and are intentionally skipped — there is
  --    nothing to log for a draw.
  ---------------------------------------------------------------------------
  INSERT INTO public.scoring_events
         (user_id, match_id, prediction_id, delta, reason, scoring_version)
  SELECT user_id, p_match_id, pred_id, delta, v_event_reason, p_scoring_version
    FROM _eval_users
   WHERE delta <> 0;

  ---------------------------------------------------------------------------
  -- 9. Build summary JSON for the API layer
  ---------------------------------------------------------------------------
  RETURN jsonb_build_object(
    'success', true,
    'previouslyResolved', false,
    'evaluationId', v_evaluation_id,
    'correctCount', v_correct_count,
    'totalResolves', v_total_count,
    'predictorCount', v_affected_count,
    'reason', v_event_reason,
    'deltas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', user_id::text,
        'prediction_id', pred_id::text,
        'delta', delta,
        'is_correct', is_correct
      ) ORDER BY user_id)
      FROM _eval_users
    ), '[]'::jsonb)
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.evaluate_match_predictions(uuid, text, text, boolean)
  TO service_role;

-- Authorisation for `authenticated` is enforced at the application layer
-- (requireAdmin) AND through the trigger on users (only admins/service_role
-- may mutate intel_score/is_admin). Letting authenticated EXECUTE means an
-- admin's browser session can call it; non-admins are rejected by RLS on
-- admin-only routes before the call ever reaches PostgREST.

-- Hobby Supabase deployments usually restrict EXECUTE on RPCs to specific
-- roles. If your project has a tighter `authenticated` policy, change the
-- GRANT above accordingly.

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- SELECT evaluate_match_predictions(
--   (SELECT id FROM public.matches WHERE status='upcoming' LIMIT 1),
--   'team1_win',
--   'v1'
-- );
-- EXPECTED on first call: jsonb with success=true, deltas for every predictor.
-- EXPECTED on second identical call: previouslyResolved=true, empty deltas.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   REVOKE EXECUTE ON FUNCTION public.evaluate_match_predictions(uuid, text, text, boolean) FROM service_role;
--   DROP FUNCTION IF EXISTS public.evaluate_match_predictions(uuid, text, text, boolean);
-- ---------------------------------------------------------------------------
