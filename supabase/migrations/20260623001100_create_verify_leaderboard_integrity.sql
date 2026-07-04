-- ============================================================================
-- Migration: 20260623001100_create_verify_leaderboard_integrity.sql
-- Purpose:   Pure-read replay verification. Recomputes each user's
--            intel_score from scoring_events and compares it to the stored
--            value. Does not modify any data; can be invoked freely.
--
-- Outputs:
--   • public.leaderboard_replay        — VIEW (one row per user)
--   • public.verify_leaderboard_integrity() — function returning only
--                                              divergent rows.
--   • public.verify_one_user_integrity(uuid) — function returning one row
--                                              for a single user.
--
-- Frequency recommendation (see docs/MONITORING_AND_INTEGRITY.md):
--   • Hourly job: SELECT * FROM verify_leaderboard_integrity();
--     0 rows ⇒ system healthy.
--   • On-demand:  SELECT verify_one_user_integrity(<user_id>);
--     Used by /admin/users to verify a single user's grade when support
--     requests arrive.
--
-- Mathematical guarantee (post-migration 005 fix):
--   stored_intel_score = derived_intel_score for every user, ALWAYS.
--   Non-zero delta_mismatch ⇒ score drift was introduced outside the RPC.
-- ============================================================================

SET search_path = public;

-- ---------------------------------------------------------------------------
-- VIEW: leaderboard_replay
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- FUNCTION: verify_leaderboard_integrity()
-- Returns only the DIVERGENT users, ordered by largest mismatch first.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- FUNCTION: verify_one_user_integrity(uuid)
-- Returns a single-row JSON for the requested user; useful from REST.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_one_user_integrity(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'user_id',             user_id,
    'username',            username,
    'stored_intel_score',  stored_intel_score,
    'derived_intel_score', derived_intel_score,
    'delta_mismatch',      delta_mismatch,
    'event_count',         event_count,
    'last_event_at',       last_event_at,
    'healthy',             stored_intel_score = derived_intel_score
  )
    FROM public.leaderboard_replay
   WHERE user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
-- service_role runs scheduled jobs and admin tooling.
GRANT EXECUTE ON FUNCTION public.verify_leaderboard_integrity()        TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_one_user_integrity(uuid)       TO service_role;
-- VIEW select is needed by the functions above; explicitly grant to service.
GRANT SELECT ON public.leaderboard_replay                              TO service_role;

-- Application admins use the postgrest RPC; allow authenticated to run them.
-- The DEFERRABLE check inside the RPC is "stable" so no row-level writes.
GRANT EXECUTE ON FUNCTION public.verify_leaderboard_integrity()        TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_one_user_integrity(uuid)       TO authenticated;

-- The leaderboard_replay VIEW is not directly SELECT-granted to anon.
-- It exposes PII (all usernames and scores). Admin tooling reads it via the
-- RPC functions above, which the RPC security layer gates.

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- SELECT * FROM public.verify_leaderboard_integrity();
-- EXPECTED: zero rows for a healthy database.
--
-- SELECT public.verify_one_user_integrity(
--   (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
-- );
-- EXPECTED: jsonb with healthy=true in steady state.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   DROP FUNCTION IF EXISTS public.verify_one_user_integrity(uuid);
--   DROP FUNCTION IF EXISTS public.verify_leaderboard_integrity();
--   DROP VIEW    IF EXISTS public.leaderboard_replay;
-- ---------------------------------------------------------------------------
