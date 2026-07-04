-- ============================================================================
-- Migration: 20260623000100_create_scoring_events.sql
-- Purpose:   Append-only audit ledger for every intel_score delta. The
--            canonical truth deriveable from this table should match
--            users.intel_score; if they ever drift we'll know exactly why.
-- Design:    UNIQUE(match_id, user_id) lets the RPC atomic-recompute path
--            DELETE prior events for a match then INSERT new ones without
--            conflict noise. RLS: only service_role can INSERT (via the
--            SECURITY DEFINER RPC); users can SELECT their own events only.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.scoring_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  match_id        uuid NOT NULL REFERENCES public.matches(id)   ON DELETE CASCADE,
  prediction_id   uuid NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  delta           integer NOT NULL CHECK (delta <> 0 AND delta BETWEEN -1000 AND 1000),
  reason          text    NOT NULL CHECK (reason IN ('match_resolved','match_corrected','match_void','manual_credit')),
  scoring_version text    NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_events_user_id          ON public.scoring_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_events_match_id         ON public.scoring_events(match_id);
CREATE INDEX IF NOT EXISTS idx_scoring_events_created_at       ON public.scoring_events(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_scoring_events_match_user
  ON public.scoring_events(match_id, user_id);

ALTER TABLE public.scoring_events ENABLE ROW LEVEL SECURITY;

-- Users may read their own scoring history.
DROP POLICY IF EXISTS scoring_events_self_read ON public.scoring_events;
CREATE POLICY scoring_events_self_read ON public.scoring_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policy is exposed to client roles → only
-- the SECURITY DEFINER RPC (and service_role) can mutate this table.

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'scoring_events';
-- SELECT policyname FROM pg_policies WHERE tablename = 'scoring_events';
-- EXPECTED: rls = true; one policy (scoring_events_self_read).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   DROP TABLE IF EXISTS public.scoring_events CASCADE;
-- ---------------------------------------------------------------------------
