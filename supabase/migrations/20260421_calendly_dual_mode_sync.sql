-- ============================================================
-- Migration: Calendly dual-mode sync
-- Date: 2026-04-21
-- Purpose: Store Calendly credentials separately from Cal.com
--          while normalizing synced bookings into meetings.
-- ============================================================

create table if not exists public.client_calendly_credentials (
  client_id uuid primary key references public.clients(id) on delete cascade,
  calendly_api_key text not null default '',
  booking_link text not null default '',
  webhook_url text not null default '',
  webhook_signing_secret text not null default '',
  user_uri text,
  organization_uri text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_calendly_credentials enable row level security;

create or replace function public.set_client_calendly_credentials_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists client_calendly_credentials_set_updated_at on public.client_calendly_credentials;
create trigger client_calendly_credentials_set_updated_at
  before update on public.client_calendly_credentials
  for each row execute function public.set_client_calendly_credentials_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'client_calendly_credentials'
      and policyname = 'service role read client calendly credentials'
  ) then
    create policy "service role read client calendly credentials"
      on public.client_calendly_credentials
      for select
      to service_role
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'client_calendly_credentials'
      and policyname = 'service role insert client calendly credentials'
  ) then
    create policy "service role insert client calendly credentials"
      on public.client_calendly_credentials
      for insert
      to service_role
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'client_calendly_credentials'
      and policyname = 'service role update client calendly credentials'
  ) then
    create policy "service role update client calendly credentials"
      on public.client_calendly_credentials
      for update
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
