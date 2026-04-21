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
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  prospect_name text not null,
  email text not null,
  company text not null,
  job_title text not null,
  meeting_datetime timestamptz not null,
  status text not null check (status in ('scheduled', 'completed', 'no_show', 'rescheduled', 'cancelled')),
  source text not null,
  account_id text not null references public.accounts(id),
  notes text,
  created_at timestamptz not null default now()
);

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
create policy "authenticated read accounts" on public.accounts for select to authenticated using (true);
create policy "authenticated read profiles" on public.profiles for select to authenticated using (auth.uid() = id);
