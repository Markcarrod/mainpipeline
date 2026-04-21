-- ============================================================
-- Migration: Cal.com dual-mode sync hardening
-- Date: 2026-04-21
-- Purpose: Add audit logs, raw payload storage, and columns used
--          by webhook + scheduled Cal booking syncs.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  trigger_event text not null,
  booking_uid text,
  cal_booking_id text,
  client_id uuid references public.clients(id) on delete set null,
  payload jsonb not null,
  headers jsonb,
  received_at timestamptz not null default now(),
  processed_successfully boolean not null default false,
  processing_error text
);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null,
  status text not null,
  message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.meetings
  add column if not exists cal_booking_id text,
  add column if not exists event_type_id text,
  add column if not exists host_name text,
  add column if not exists host_email text,
  add column if not exists raw_latest_payload jsonb,
  add column if not exists last_event_at timestamptz;

drop index if exists public.meetings_booking_uid_idx;
create unique index if not exists meetings_booking_uid_idx on public.meetings (booking_uid);
create index if not exists webhook_events_booking_uid_idx on public.webhook_events (booking_uid);
create index if not exists webhook_events_received_at_idx on public.webhook_events (received_at desc);
create index if not exists sync_logs_created_at_idx on public.sync_logs (created_at desc);
create index if not exists meetings_status_idx on public.meetings (status);
create index if not exists meetings_meeting_start_idx on public.meetings (meeting_start);

alter table public.webhook_events enable row level security;
alter table public.sync_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'webhook_events'
      and policyname = 'service role manage webhook events'
  ) then
    create policy "service role manage webhook events"
      on public.webhook_events
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sync_logs'
      and policyname = 'service role manage sync logs'
  ) then
    create policy "service role manage sync logs"
      on public.sync_logs
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
