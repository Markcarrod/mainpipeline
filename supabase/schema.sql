create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  target_industry text not null,
  target_location text not null,
  target_company_size text not null,
  target_job_titles jsonb not null default '[]'::jsonb,
  monthly_meeting_target integer not null,
  monthly_price numeric(10, 2) not null,
  status text not null check (status in ('active', 'paused', 'onboarding')),
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  channel text not null,
  status text not null,
  messages_sent integer not null default 0,
  replies integer not null default 0,
  positive_replies integer not null default 0,
  meetings_booked integer not null default 0,
  start_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.client_integrations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  provider text not null,
  label text not null,
  api_key_hint text,
  status text not null check (status in ('connected', 'pending', 'needs_attention')) default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.client_cal_credentials (
  client_id uuid primary key references public.clients(id) on delete cascade,
  cal_api_key text not null,
  booking_link text not null,
  webhook_url text not null,
  webhook_signing_secret text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id text primary key,
  label text not null,
  platform text not null,
  status text not null,
  daily_limit integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  booking_uid text unique,
  cal_booking_id text,
  event_type_id text,
  prospect_name text not null,
  prospect_email text,
  email text not null,
  company text not null,
  job_title text not null,
  event_name text,
  meeting_start timestamptz,
  meeting_end timestamptz,
  meeting_datetime timestamptz not null,
  status text not null check (status in ('scheduled', 'completed', 'no_show', 'rescheduled', 'cancelled')),
  source text not null,
  account_id text references public.accounts(id),
  host_name text,
  host_email text,
  raw_latest_payload jsonb,
  last_event_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create unique index if not exists meetings_booking_uid_idx on public.meetings (booking_uid);
create index if not exists meetings_status_idx on public.meetings (status);
create index if not exists meetings_meeting_start_idx on public.meetings (meeting_start);
create index if not exists webhook_events_booking_uid_idx on public.webhook_events (booking_uid);
create index if not exists webhook_events_received_at_idx on public.webhook_events (received_at desc);
create index if not exists sync_logs_created_at_idx on public.sync_logs (created_at desc);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'Admin'
);

alter table public.clients enable row level security;
alter table public.campaigns enable row level security;
alter table public.client_integrations enable row level security;
alter table public.client_cal_credentials enable row level security;
alter table public.accounts enable row level security;
alter table public.meetings enable row level security;
alter table public.webhook_events enable row level security;
alter table public.sync_logs enable row level security;
alter table public.profiles enable row level security;

create policy "authenticated read clients" on public.clients for select to authenticated using (true);
create policy "authenticated insert clients" on public.clients for insert to authenticated with check (true);
create policy "authenticated read campaigns" on public.campaigns for select to authenticated using (true);
create policy "authenticated read client integrations" on public.client_integrations for select to authenticated using (true);
create policy "authenticated insert client integrations" on public.client_integrations for insert to authenticated with check (true);
create policy "service role read client cal credentials" on public.client_cal_credentials for select to service_role using (true);
create policy "service role insert client cal credentials" on public.client_cal_credentials for insert to service_role with check (true);
create policy "service role update client cal credentials" on public.client_cal_credentials for update to service_role using (true) with check (true);
create policy "authenticated read meetings" on public.meetings for select to authenticated using (true);
create policy "service role insert meetings" on public.meetings for insert to service_role with check (true);
create policy "service role update meetings" on public.meetings for update to service_role using (true) with check (true);
create policy "service role manage webhook events" on public.webhook_events for all to service_role using (true) with check (true);
create policy "service role manage sync logs" on public.sync_logs for all to service_role using (true) with check (true);
create policy "authenticated read accounts" on public.accounts for select to authenticated using (true);
create policy "authenticated read profiles" on public.profiles for select to authenticated using (auth.uid() = id);
