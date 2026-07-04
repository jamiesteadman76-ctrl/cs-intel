-- ============================================================================
-- Migration: 20260623001300_restrict_verify_rpc_grants.sql
-- Purpose:   Privacy fix for the verify_leaderboard_integrity() RPCs that
--            were accidentally over-granted in migration 011.
--
-- Background:
--   Both verify_*() functions are SECURITY DEFINER and execute as the
--   definer (= postgres), bypassing RLS on the leaderboard_replay view.
--   Granting EXECUTE … TO authenticated previously allowed ANY logged-in
--   user to enumerate every user's score and drift state.
--
-- Fix:
--   Revoke EXECUTE FROM authenticated on both functions. Keep EXECUTE on
--   service_role so the scheduled cron and admin tooling continue to work.
--   Additionally rewrite verify_one_user_integrity to surface a clean
--   `user_not_found` response when the requested user does not exist,
--   instead of silently returning NULL.
-- ============================================================================

SET search_path = public;

-- ---------------------------------------------------------------------------
-- Revoke the privacy-leaking grants
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.verify_leaderboard_integrity() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_one_user_integrity(uuid) FROM authenticated;

-- Confirm grants are now restricted to service_role only.
GRANT  EXECUTE ON FUNCTION public.verify_leaderboard_integrity()  TO service_role;
GRANT  EXECUTE ON FUNCTION public.verify_one_user_integrity(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Recreate verify_one_user_integrity to surface user-not-found cleanly.
-- The underlying query is unchanged in cost; only the wrapper differs.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- -- As service_role (DB console / Edge Function / cron):
-- SELECT * FROM public.verify_leaderboard_integrity();
-- EXPECTED: zero rows for a healthy database.
--
-- SELECT public.verify_one_user_integrity(
--   (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
-- );
-- EXPECTED: jsonb with `healthy = true` in steady state.
--
-- SELECT public.verify_one_user_integrity('00000000-0000-0000-0000-000000000000');
-- EXPECTED: jsonb with `reason = 'user_not_found'`, not NULL.
--
-- -- As an authenticated client, calling should now fail with "permission
-- -- denied for function verify_leaderboard_integrity". Confirm via PostgREST:
-- --   (curl) /rest/v1/rpc/verify_leaderboard_integrity
-- -- EXPECTED: 401 / Postgres permission_denied.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   GRANT EXECUTE ON FUNCTION public.verify_leaderboard_integrity()  TO authenticated;
--   GRANT EXECUTE ON FUNCTION public.verify_one_user_integrity(uuid) TO authenticated;
--   CREATE OR REPLACE FUNCTION public.verify_one_user_integrity(p_user_id uuid)
--     RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
--     AS $$
--       SELECT jsonb_build_object(
--               'user_id', user_id, 'username', username,
--               'stored_intel_score', stored_intel_score,
--               'derived_intel_score', derived_intel_score,
--               'delta_mismatch', delta_mismatch,
--               'event_count', event_count,
--               'last_event_at', last_event_at,
--               'healthy', stored_intel_score = derived_intel_score)
--         FROM public.leaderboard_replay WHERE user_id = p_user_id;
--     $$;
-- ---------------------------------------------------------------------------
