-- ============================================================================
-- Migration: 20260623000000_add_predictions_confidence.sql
-- Purpose:   Add `confidence` column to predictions for scoring weight.
-- Design:    DEFAULT 50 (lowest weight) because the current submit path
--            never sends confidence. Until UI exposes a slider, predictions
--            are scored at neutral confidence, never buoyed by fake 70/100.
--            CHECK 50..100 enforces the contract at the DB layer.
-- ============================================================================

SET search_path = public;

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS confidence INTEGER NOT NULL DEFAULT 50
    CHECK (confidence BETWEEN 50 AND 100);

CREATE INDEX IF NOT EXISTS idx_predictions_confidence
  ON public.predictions(confidence);

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- SELECT column_name, data_type, column_default,
--        (SELECT pg_get_constraintdef(oid)
--           FROM pg_constraint
--          WHERE conrelid = 'public.predictions'::regclass
--            AND contype = 'c'
--            AND conname LIKE '%confidence%') AS check_clause
--   FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='predictions' AND column_name='confidence';
--
-- EXPECTED:
--   column_name  | data_type | column_default | check_clause
--   confidence   | integer   | 50             | CHECK ((confidence >= 50) AND (confidence <= 100))
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
--   ALTER TABLE public.predictions DROP COLUMN IF EXISTS confidence;
-- ---------------------------------------------------------------------------
