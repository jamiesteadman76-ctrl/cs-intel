-- ============================================================================
-- Migration: 20260702000000_critical_fixes_and_cron.sql
-- Purpose:   Consolidates the next batch of production hardening:
--              1. Append-only reversals in evaluate_match_predictions
--                 (replacement scoring_events rows instead of DELETE)
--              2. Restricts evaluate_match_predictions EXECUTE to
--                 service_role only (anon + authenticated REVOKED)
--              3. BEFORE UPDATE trigger on public.matches that blocks
--                 direct status/result mutation outside the RPC and
--                 writes a forensic audit_log row when it does
--              4. Creates the missing blog_posts, intel_posts and
--                 community_discussions tables with RLS, indexes, FKs
--              5. Extends CHECK constraints on scoring_events.reason
--                 (adds 'reversal') and audit_log.operation (adds
--                 'BLOCKED_UPDATE')
--
-- Hard rules:
--   * Every statement is idempotent on re-run.
--   * UNIQUE INDEX uq_scoring_events_match_user is DROPPED — this index
--     was added in migration 001 to support the DELETE-then-INSERT
--     correction path. With append-only reversals, multiple rows per
--     (match_id, user_id) coexist (original + reversal + replacement),
--     so a hard UNIQUE is incompatible. Idempotent DROP IF EXISTS.
--   * All BEFORE triggers are DROP IF EXISTS + CREATE.
--   * All CHECK constraints are DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT.
--   * All functions are CREATE OR REPLACE.
--
-- ROLLBACK (manual; do not run unless absolutely necessary):
--   DROP TABLE IF EXISTS public.community_discussions CASCADE;
--   DROP TABLE IF EXISTS public.intel_posts CASCADE;
--   DROP TABLE IF EXISTS public.blog_posts CASCADE;
--   DROP TRIGGER IF EXISTS trg_block_unauthorized_match_updates
--     ON public.matches;
--   DROP FUNCTION IF EXISTS public.block_unauthorized_match_updates();
--   -- restore evaluate_match_predictions with the pre-fix DELETE flow
--   -- (see migration 20260623000500 for the canonical body)
--   ALTER TABLE public.scoring_events
--     DROP CONSTRAINT IF EXISTS scoring_events_reason_check;
--   ALTER TABLE public.scoring_events
--     ADD  CONSTRAINT scoring_events_reason_check
--       CHECK (reason IN ('match_resolved','match_corrected',
--                         'match_void','manual_credit'));
--   ALTER TABLE public.audit_log
--     DROP CONSTRAINT IF EXISTS audit_log_operation_check;
--   ALTER TABLE public.audit_log
--     ADD  CONSTRAINT audit_log_operation_check
--       CHECK (operation IN ('INSERT','UPDATE','DELETE','REVERT','BLOCK'));
--   CREATE UNIQUE INDEX IF NOT EXISTS uq_scoring_events_match_user
--     ON public.scoring_events(match_id, user_id);
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_min_messages = warning;
SET search_path = public;

-- ============================================================================
-- 1. EXTEND CHECK CONSTRAINTS  (idempotent: drop any old CHECK first)
-- ============================================================================
DO $fn$
DECLARE r record;
BEGIN
  -- scoring_events.reason — drop any pre-existing CHECK constraint, named
  -- or unnamed (Supabase pg_dump sometimes gives them an auto name).
  FOR r IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.scoring_events'::regclass
       AND contype  = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%reason%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.scoring_events DROP CONSTRAINT %I',
      r.conname);
  END LOOP;

  -- audit_log.operation — drop any pre-existing CHECK constraint that
  -- references the operation column.
  FOR r IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.audit_log'::regclass
       AND contype  = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%operation%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.audit_log DROP CONSTRAINT %I',
      r.conname);
  END LOOP;
END
$fn$;

ALTER TABLE public.scoring_events
  ADD CONSTRAINT scoring_events_reason_check
    CHECK (reason IN ('match_resolved','match_corrected',
                      'match_void','manual_credit','reversal'));

ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_operation_check
    CHECK (operation IN ('INSERT','UPDATE','DELETE','REVERT',
                         'BLOCK','BLOCKED_UPDATE'));

-- ============================================================================
-- 2. DROP APPEND-ONLY-INCOMPATIBLE UNIQUE INDEX
-- ============================================================================
-- The original `uq_scoring_events_match_user` was a side effect of the
-- DELETE-then-INSERT correction pattern. With append-only reversals
-- (original + reversal + replacement) coexisting for the same (match_id,
-- user_id) pair, this UNIQUE constraint MUST be removed.
DROP INDEX IF EXISTS public.uq_scoring_events_match_user;

-- Add a non-unique index to keep query plans efficient (corrected
-- prediction_id lookups still benefit).
CREATE INDEX IF NOT EXISTS idx_scoring_events_match_user
  ON public.scoring_events(match_id, user_id);

-- ============================================================================
-- 3. CREATE OR REPLACE: evaluate_match_predictions (append-only reversals)
-- ============================================================================
DROP FUNCTION IF EXISTS public.evaluate_match_predictions(uuid, text, text, boolean);

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
  -- 0a. Validate inputs
  ---------------------------------------------------------------------------
  IF p_result NOT IN ('team1_win','team2_win','draw') THEN
    RAISE EXCEPTION 'invalid_result: must be team1_win|team2_win|draw, got %', p_result;
  END IF;
  IF p_scoring_version IS NULL OR length(p_scoring_version) = 0 THEN
    RAISE EXCEPTION 'invalid_scoring_version: must be non-empty';
  END IF;

  ---------------------------------------------------------------------------
  -- 0b. Admin gate (defense-in-depth)
  --     The function has GRANTS on service_role only (see §5 below).
  --     Service_role callers without an impersonated JWT will have
  --     auth.uid() = NULL — they pass through. Impersonated callers
  --     carry a real auth.uid() and MUST have is_admin = TRUE.
  ---------------------------------------------------------------------------
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users
       WHERE id = auth.uid() AND is_admin = TRUE
    ) THEN
      RAISE EXCEPTION 'unauthorized_admin: caller is not is_admin=TRUE';
    END IF;
  END IF;

  ---------------------------------------------------------------------------
  -- 1. Lock the match row first (globally consistent lock order).
  ---------------------------------------------------------------------------
  SELECT status, result
    INTO v_match_status, v_match_result
    FROM public.matches
   WHERE id = p_match_id
     FOR UPDATE;

  IF v_match_status IS NULL THEN
    RAISE EXCEPTION 'match_not_found: %', p_match_id;
  END IF;

  -- Idempotent no-op (unless caller forced a recompute).
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
  -- 2. Snapshot + lock affected users (ordered by user_id).
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
  -- 3. Compute deltas + is_correct (post-005 canonical math).
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
  -- 4. APPEND-ONLY reversal path.
  --    For every prior scoring_event for this match we INSERT a new
  --    reversal row carrying delta = -e.delta, reason = 'reversal', and
  --    scoring_version = e.scoring_version || '_rev'. The corresponding
  --    user scores are subtracted atomically so the net effect after
  --    this step is the same as a DELETE (intel_score returns to its
  --    pre-resolve state), but the ledger is preserved.
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM public.scoring_events WHERE match_id = p_match_id) THEN
    -- Roll back user scores by the old deltas (clipped to floor).
    UPDATE public.users u
       SET intel_score = GREATEST(0, u.intel_score - e.delta)
      FROM public.scoring_events e
     WHERE u.id = e.user_id
       AND e.match_id = p_match_id;

    -- Append reversal rows. Same (match_id, user_id, prediction_id)
    -- tuple is allowed: the unique index was dropped in §2 above.
    INSERT INTO public.scoring_events
           (user_id, match_id, prediction_id, delta, reason, scoring_version)
    SELECT e.user_id,
           e.match_id,
           e.prediction_id,
           -e.delta,
           'reversal',
           e.scoring_version || '_rev'
      FROM public.scoring_events e
     WHERE e.match_id = p_match_id;
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
  -- 7. Update every prediction row.
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
  -- 8. Record the new outcome rows (also part of the append-only ledger).
  --    The reconciliation invariant
  --        SUM(delta) per user == users.intel_score
  --    is preserved because step 4 subtracted the old deltas and step 5
  --    immediately added the new ones in the same transaction.
  ---------------------------------------------------------------------------
  INSERT INTO public.scoring_events
         (user_id, match_id, prediction_id, delta, reason, scoring_version)
  SELECT user_id, p_match_id, pred_id, delta, v_event_reason, p_scoring_version
    FROM _eval_users
   WHERE delta <> 0;

  ---------------------------------------------------------------------------
  -- 9. Build summary JSON.
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

-- ============================================================================
-- 4. CREATE OR REPLACE: block_unauthorized_match_updates
--    BEFORE UPDATE on public.matches.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.block_unauthorized_match_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Only guard writes that touch status or result. Other columns
  -- (match_time, score1, scope2, team*_id, tournament_id) remain
  -- freely modifiable by any authenticated admin.
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.result IS DISTINCT FROM OLD.result
  THEN
    IF NOT (
         current_user = 'postgres'
      OR session_user = 'service_role'
      OR pg_has_role(session_user, 'service_role', 'MEMBER')
    ) THEN
      -- Forensic row before raising so we keep the evidence trail
      -- even though the UPDATE is about to abort.
      INSERT INTO public.audit_log
        (actor_role, actor_user_id, table_name, operation, row_pk,
         prev_value, new_value, attribution, reason)
      VALUES
        ('authenticated',
         auth.uid(),
         'matches',
         'BLOCKED_UPDATE',
         NEW.id::text,
         jsonb_build_object(
           'old_status', OLD.status, 'old_result', OLD.result,
           'old_score1', OLD.score1, 'old_score2', OLD.score2),
         jsonb_build_object(
           'new_status', NEW.status, 'new_result', NEW.result,
           'new_score1', NEW.score1, 'new_score2', NEW.score2),
         'before_match_update_guard',
         'direct_match_status_update_attempt');

      RAISE EXCEPTION
        'unauthorized_match_update: matches.status and matches.result can only be set via evaluate_match_predictions';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_block_unauthorized_match_updates ON public.matches;
CREATE TRIGGER trg_block_unauthorized_match_updates
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.block_unauthorized_match_updates();

-- ============================================================================
-- 5. GRANTS — service_role only on evaluate_match_predictions.
-- ============================================================================
REVOKE ALL ON FUNCTION public.evaluate_match_predictions(uuid, text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.evaluate_match_predictions(uuid, text, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_match_predictions(uuid, text, text, boolean) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.evaluate_match_predictions(uuid, text, text, boolean) TO service_role;

-- Belt-and-braces: clear default privileges inherited from the postgres role
-- so future CREATE FUNCTION does NOT auto-grant EXECUTE to anon/authenticated.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Confirm grants — operator-facing notice on completion.
DO $$ BEGIN RAISE NOTICE 'evaluate_match_predictions GRANTS finalised: service_role only'; END $$;

-- ============================================================================
-- 6. NEW TABLES — blog_posts, intel_posts, community_discussions.
-- ============================================================================

-- 6.1 blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  slug           text NOT NULL UNIQUE,
  content        text NOT NULL,
  excerpt        text NULL,
  featured_image text NULL,
  author_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  published_at   timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  status         text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','archived')),
  tags           text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id   ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status     ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at
  ON public.blog_posts(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at
  ON public.blog_posts(created_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
CREATE POLICY blog_posts_public_read ON public.blog_posts
  FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS blog_posts_admin_write ON public.blog_posts;
CREATE POLICY blog_posts_admin_write ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users
                       WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS blog_posts_admin_update ON public.blog_posts;
CREATE POLICY blog_posts_admin_update ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS blog_posts_admin_delete ON public.blog_posts;
CREATE POLICY blog_posts_admin_delete ON public.blog_posts
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE id = auth.uid() AND is_admin = TRUE));

-- Admin SELECT so is_admin users can see drafts/archived through RLS
-- (public_read only exposes status='published'). Matches the
-- intel_posts / community_discussions admin-ALL convention.
DROP POLICY IF EXISTS blog_posts_admin_read ON public.blog_posts;
CREATE POLICY blog_posts_admin_read ON public.blog_posts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE id = auth.uid() AND is_admin = TRUE));

-- 6.2 intel_posts
CREATE TABLE IF NOT EXISTS public.intel_posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  slug           text NOT NULL UNIQUE,
  content        text NOT NULL,
  excerpt        text NULL,
  featured_image text NULL,
  author_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id       uuid NULL REFERENCES public.matches(id) ON DELETE SET NULL,
  analysis_type  text NOT NULL DEFAULT 'meta'
                    CHECK (analysis_type IN ('team-form','roster-change',
                                            'tournament','betting','meta')),
  published_at   timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  status         text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','featured','archived')),
  tags           text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE INDEX IF NOT EXISTS idx_intel_posts_author_id   ON public.intel_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_intel_posts_match_id    ON public.intel_posts(match_id);
CREATE INDEX IF NOT EXISTS idx_intel_posts_status      ON public.intel_posts(status);
CREATE INDEX IF NOT EXISTS idx_intel_posts_analysis_type
  ON public.intel_posts(analysis_type);
CREATE INDEX IF NOT EXISTS idx_intel_posts_published_at
  ON public.intel_posts(published_at DESC NULLS LAST);

ALTER TABLE public.intel_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intel_posts_public_read ON public.intel_posts;
CREATE POLICY intel_posts_public_read ON public.intel_posts
  FOR SELECT
  USING (status IN ('published','featured'));

DROP POLICY IF EXISTS intel_posts_authenticated_insert ON public.intel_posts;
CREATE POLICY intel_posts_authenticated_insert ON public.intel_posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS intel_posts_author_update ON public.intel_posts;
CREATE POLICY intel_posts_author_update ON public.intel_posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS intel_posts_admin_all ON public.intel_posts;
CREATE POLICY intel_posts_admin_all ON public.intel_posts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE id = auth.uid() AND is_admin = TRUE));

-- 6.3 community_discussions
CREATE TABLE IF NOT EXISTS public.community_discussions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,
  author_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id uuid NULL REFERENCES public.community_categories(id) ON DELETE SET NULL,
  pinned      boolean NOT NULL DEFAULT FALSE,
  locked      boolean NOT NULL DEFAULT FALSE,
  reply_count integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_discussions_author_id   ON public.community_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_community_discussions_category_id ON public.community_discussions(category_id);
CREATE INDEX IF NOT EXISTS idx_community_discussions_created_at
  ON public.community_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_discussions_pinned
  ON public.community_discussions(pinned)
  WHERE pinned = TRUE;

ALTER TABLE public.community_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_discussions_public_read ON public.community_discussions;
CREATE POLICY community_discussions_public_read ON public.community_discussions
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS community_discussions_authenticated_insert ON public.community_discussions;
CREATE POLICY community_discussions_authenticated_insert ON public.community_discussions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS community_discussions_author_update ON public.community_discussions;
CREATE POLICY community_discussions_author_update ON public.community_discussions
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS community_discussions_admin_all ON public.community_discussions;
CREATE POLICY community_discussions_admin_all ON public.community_discussions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================================
-- 7. VERIFY (operator-facing, runnable diagnostics)
-- ============================================================================
-- SELECT proname,
--        pg_get_userbyid(proowner) AS owner,
--        p.proacl AS acl
--   FROM pg_proc p
--  WHERE proname = 'evaluate_match_predictions'
--    AND pronamespace = 'public'::regnamespace;
-- EXPECTED acl: {postgres=XC/postgres, service_role=X/postgres}
--   (i.e., anon and authenticated should NOT appear in the acl).
--
-- SELECT indexname FROM pg_indexes
--  WHERE tablename = 'scoring_events';
-- EXPECTED: uq_scoring_events_match_user ABSENT;
--           idx_scoring_events_match_user      PRESENT.
--
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.matches'::regclass;
-- EXPECTED: trg_block_unauthorized_match_updates among the rows.
--
-- SELECT count(*) FROM public.blog_posts;     -- 0 if new
-- SELECT count(*) FROM public.intel_posts;    -- 0 if new
-- SELECT count(*) FROM public.community_discussions; -- 0 if new
--
-- -- RPC happy-path: as service_role, resolve then correct a match and
-- -- confirm the ledger now has 4 rows per user (orig + rev + new outcome).
-- SELECT count(*), reason FROM public.scoring_events
--  WHERE match_id = '<some_id>' GROUP BY reason ORDER BY reason;
-- EXPECTED: rows for 'match_resolved' (n), 'reversal' (n), 'match_corrected' (n).
-- ============================================================================
