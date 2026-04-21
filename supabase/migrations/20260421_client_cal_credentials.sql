-- ============================================================
-- Migration: Per-client Cal.com credentials
-- Date: 2026-04-21
-- Purpose: Store each client's Cal API key and booking link
--          securely on the server, and generate client-specific
--          webhook URLs.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_cal_credentials (
  client_id uuid PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  cal_api_key text NOT NULL,
  booking_link text NOT NULL,
  webhook_url text NOT NULL,
  webhook_signing_secret text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_cal_credentials
  ADD COLUMN IF NOT EXISTS webhook_signing_secret text NOT NULL DEFAULT '';

ALTER TABLE public.client_cal_credentials ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_client_cal_credentials_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS client_cal_credentials_set_updated_at ON public.client_cal_credentials;
CREATE TRIGGER client_cal_credentials_set_updated_at
  BEFORE UPDATE ON public.client_cal_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_client_cal_credentials_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'client_cal_credentials'
      AND policyname = 'service role read client cal credentials'
  ) THEN
    CREATE POLICY "service role read client cal credentials"
      ON public.client_cal_credentials
      FOR SELECT
      TO service_role
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'client_cal_credentials'
      AND policyname = 'service role insert client cal credentials'
  ) THEN
    CREATE POLICY "service role insert client cal credentials"
      ON public.client_cal_credentials
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'client_cal_credentials'
      AND policyname = 'service role update client cal credentials'
  ) THEN
    CREATE POLICY "service role update client cal credentials"
      ON public.client_cal_credentials
      FOR UPDATE
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
