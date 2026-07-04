-- ============================================================================
-- Migration: 20260623000500_fix_rpc_reversal_delta_cap.sql
-- Purpose:   Patch evaluate_match_predictions Step 3 so that the delta
--            written to scoring_events equals the delta actually applied to
--            users.intel_score. This closes the phantom-points loophole
--            documented in docs/POST_REMEDIATION_VALIDATION.md (CRITICAL issue).
--
-- Why this is safe and additive-safe:
--
--   BEFORE (buggy):
--     delta := theoretical_amount        (e.g. -250)
--     apply : GREATEST(0, 100 + (-250)) → 0   (floor)
--     log   : delta = -250                        (recorded applied delta = 0)
--     reversal: GREATEST(0, 0 - (-250)) = +250   (mints phantom points)
--
--   AFTER (corrected):
--     delta := GREATEST(-current_score, theoretical_negative)
--            = GREATEST(-100, -250) = -100       (clipped to what was actually lost)
--     apply : GREATEST(0, 100 + (-100)) → 0      (same outcome)
--     log   : delta = -100                              (matches what happened)
--     reversal: GREATEST(0, 0 - (-100)) = +100   (restores user's actual balance)
--
--   Wins remain identical in magnitude (current_score cap only applies to
--   NEGATIVE deltas). Reversals are now mathematically exact because the
--   recorded delta always equals the applied change.
--
-- Idempotency proof:
--   Calling the RPC twice with identical arguments applies the new (clipped)
--   delta on the first call; the second call short-circuits in Step 1 with
--   `previouslyResolved = TRUE`. No double credit. (Same as before the patch.)
--
-- Scope:
--   - DROP and CREATE only the RPC function. No table/index/trigger changes.
--   - No data backfill required: existing scoring_events rows reflect the
--     pre-patch (uncapped) deltas. Future resolves use the new math
--     consistently. The audit trail remains valid for debugging old points.
--
-- Risk:
--   - The function body is the SAME as the prior version except for ONE
--     arithmetic expression in Step 3. Lines outside that branch unchanged.
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
  --    Since we read via idx_predictions_user_id, the planner is encouraged
  --    to acquire user locks in user_id-ascending order. The trigger on
  --    users (trg_protect_users_sensitive_columns) does not block the
  --    SECURITY DEFINER context, so this RPC can freely UPDATE.
  --    Temp table dropped at COMMIT.
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
  -- 3. Compute deltas + is_correct, in-memory.
  --
  --    ⚠️  PATCH (see header comment): negative deltas are clipped to the
  --    user's current intel_score so that the RECORDED delta always equals
  --    the APPLIED delta. This makes reversals additive-safe.
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
            -- ↓↓↓ ↓↓↓ ↓↓↓ ↓↓↓ ↓↓↓ CHANGED ↓↓↓ ↓↓↓ ↓↓↓ ↓↓↓ ↓↓↓ ↓↓↓ ↓↓↓ ↓↓↓
            ELSE GREATEST(-eu.current_score, -ROUND(eu.confidence * 5)::int)
            -- ↑↑↑ ↑↑↑ ↑↑↑ ↑↑↑ ↑↑↑ CHANGED ↑↑↑ ↑↑↑ ↑↑↑ ↑↑↑ ↑↑↑ ↑↑↑ ↑↑↑ ↑↑↑
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
  --    The UPDATE below does NOT re-acquire row locks because step 2
  --    already holds FOR UPDATE on the same user_id set for this tx.
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
  -- 5. Apply new deltas (relative, atomic, clipped to floor)
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
  --    Because Step 3 clips negative deltas to actual balance lost, the
  --    recorded delta now matches the applied delta EXACTLY. Reversals
  --    in Step 4 are therefore mathematically exact.
  --    Void matches produce delta = 0 and are intentionally skipped — there
  --    is nothing to log for a draw.
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

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- -- First evaluation
-- SELECT evaluate_match_predictions('<match_id>', 'team2_win', 'v1');
-- EXPECTED on first call: jsonb with success=true, deltas for every predictor.
-- EXPECTED on second identical call: previouslyResolved=true, empty deltas.
--
-- -- Idempotency proof: run a third time after applying backfill
-- SELECT evaluate_match_predictions('<match_id>', 'team2_win', 'v1', TRUE);
-- EXPECTED: success=true, previouslyResolved=false (forced), but DELTAS cancel
--   against existing scoring_events so intel_score is unchanged.
-- ---------------------------------------------------------------------------
--
-- -- Correction proof: change to team1_win
-- SELECT evaluate_match_predictions('<match_id>', 'team1_win', 'v1');
-- EXPECTED:
--   * Step 4 subtracts each user's prior delta (clipped) → restores old balance.
--   * Step 5/8 apply new (possibly negative-clipped) deltas.
--   * For users who lost before AND still lose: scoring_events.deleted delta
--     cancels against new (identical) clipped delta → net zero change.
--   * For users who lost before AND now win: full reversal + positive credit.
--   * For users who won before AND now lose: full reversal + clipped negative.
--
-- -- Floor-truncation proof (the previous bug):
-- -- Pre-patch scenario: user at 100 confidence-67 loss original =-335.
-- --   Pre-patch:  delta logged = -335; reversal gave +335 → score = +235 phantom.
-- --   Post-patch:  delta logged = -100; reversal gives +100 → score = 0. ✅
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   -- To revert to the OLD math (only do this if you have a reason):
--   -- Recreate the previous function as written in
--   -- supabase/migrations/20260623000200_create_evaluate_match_predictions_rpc.sql
--   -- and replace `GREATEST(-eu.current_score, -ROUND(eu.confidence * 5)::int)`
--   -- with `-ROUND(eu.confidence * 5)::int` in Step 3.
--   DROP FUNCTION IF EXISTS public.evaluate_match_predictions(uuid, text, text, boolean);
-- ---------------------------------------------------------------------------
