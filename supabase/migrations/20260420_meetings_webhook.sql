-- ============================================================
-- Migration: Cal.com Webhook Integration
-- Date: 2026-04-20
-- Purpose: Extend the meetings table to support Cal.com webhook
--          events (upsert by booking_uid, multi-event status
--          tracking, and multi-client routing).
-- ============================================================

-- 1. Add booking_uid (unique identifier from Cal.com)
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS booking_uid text;

-- Create a unique index so we can upsert safely
CREATE UNIQUE INDEX IF NOT EXISTS meetings_booking_uid_idx
  ON public.meetings (booking_uid)
  WHERE booking_uid IS NOT NULL;

-- 2. Add prospect_email (separate from legacy `email` column)
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS prospect_email text;

-- 3. Add granular start / end timestamps (replaces single meeting_datetime)
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS meeting_start timestamptz;

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS meeting_end timestamptz;

-- 4. Add event_name (the Cal.com event type label e.g. "Discovery Call")
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS event_name text;

-- 5. Add updated_at for change tracking
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Automatically keep updated_at fresh on every row update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS meetings_set_updated_at ON public.meetings;
CREATE TRIGGER meetings_set_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Allow the service-role key (used by the webhook) to INSERT / UPDATE
--    meetings without being blocked by RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'meetings'
      AND policyname = 'service role insert meetings'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service role insert meetings"
        ON public.meetings
        FOR INSERT
        TO service_role
        WITH CHECK (true)
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'meetings'
      AND policyname = 'service role update meetings'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service role update meetings"
        ON public.meetings
        FOR UPDATE
        TO service_role
        USING (true)
        WITH CHECK (true)
    $policy$;
  END IF;
END $$;

-- 7. Loosen the campaign_id / account_id NOT NULL constraints so that
--    webhook-created meetings (which don't come via a campaign) are valid.
ALTER TABLE public.meetings
  ALTER COLUMN campaign_id DROP NOT NULL;

ALTER TABLE public.meetings
  ALTER COLUMN account_id DROP NOT NULL;
