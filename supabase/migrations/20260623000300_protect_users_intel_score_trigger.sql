-- ============================================================================
-- Migration: 20260623000300_protect_users_intel_score_trigger.sql
-- Purpose:   Postgres RLS filters ROWS, not COLUMNS. The existing policy
--            "Users can update own profile" lets anyone UPDATE their own
--            `intel_score`. Use a BEFORE UPDATE trigger — the only reliable
--            column-level guard in Postgres — to revert unauthorised writes.
-- Who is allowed to change intel_score / is_admin:
--            • Postgres superuser (DBAs)
--            • Service role (background jobs, supabase admin)
--            • Authenticated admin (current row's is_admin = true)
-- Everyone else: silent revert. (No exception, no log spam.)
-- ============================================================================

SET search_path = public;

CREATE OR REPLACE FUNCTION public.protect_users_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_privileged boolean;
BEGIN
  -- The privilege check must work in BOTH contexts:
  --   • Direct client-side UPDATEs (session_user = authenticator / authenticated / anon,
  --     current_user = same). Only admins should escape.
  --   • SECURITY DEFINER RPC writes from the scoring engine (current_user = function
  --     owner = postgres, session_user = outer proxy = authenticator). The
  --     `current_user = 'postgres'` branch is what makes the RPC work.
  v_privileged :=
       current_user = 'postgres'
    OR session_user = 'service_role'
    OR pg_has_role(session_user, 'service_role', 'MEMBER')
    OR (auth.uid() IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.users
           WHERE id = auth.uid() AND is_admin = TRUE
        ));

  IF NEW.intel_score IS DISTINCT FROM OLD.intel_score AND NOT v_privileged THEN
    NEW.intel_score := OLD.intel_score;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND NOT v_privileged THEN
    NEW.is_admin := OLD.is_admin;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_users_sensitive_columns ON public.users;
CREATE TRIGGER trg_protect_users_sensitive_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_users_sensitive_columns();

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- -- Set up a non-admin test user (anyone that's not is_admin=true) and try:
-- UPDATE public.users SET intel_score = 9999999 WHERE id = '<non-admin-user>';
-- SELECT intel_score FROM public.users WHERE id = '<non-admin-user>';
-- EXPECTED: unchanged (trigger reverted to OLD).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   DROP TRIGGER IF EXISTS trg_protect_users_sensitive_columns ON public.users;
--   DROP FUNCTION IF EXISTS public.protect_users_sensitive_columns();
-- ---------------------------------------------------------------------------
