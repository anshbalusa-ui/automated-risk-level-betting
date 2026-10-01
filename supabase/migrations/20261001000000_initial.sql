-- Optional authenticated persistence; the no-login demo remains local to each browser.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);
create table public.preferences (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade unique,
  categories text[] not null, interests text[] not null,
  risk_profile text not null check (risk_profile in ('low','medium','high')),
  mode text not null check (mode in ('review','auto-simulate')),
  virtual_bankroll numeric(16,2) not null default 1000 check (virtual_bankroll >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.events (
  id text primary key, category text not null check (category in ('sports','weather')),
  title text not null, description text not null default '', start_time timestamptz not null,
  resolution_time timestamptz not null, status text not null default 'upcoming',
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  check (resolution_time > start_time)
);
create table public.forecasts (
  id uuid primary key default gen_random_uuid(), event_id text not null references public.events(id),
  outcomes jsonb not null, uncertainty numeric not null check (uncertainty between 0 and 1),
  factors jsonb not null default '[]'::jsonb, model_version text not null, generated_at timestamptz not null,
  unique (event_id, model_version, generated_at)
);
create table public.reference_probabilities (
  id uuid primary key default gen_random_uuid(), event_id text not null references public.events(id),
  outcome text not null, provider text not null, probability numeric not null check (probability between 0 and 1),
  captured_at timestamptz not null, unique (event_id,outcome,provider,captured_at)
);
create table public.candidates (
  id uuid primary key default gen_random_uuid(), forecast_id uuid not null references public.forecasts(id),
  outcome text not null, probability numeric not null check (probability between 0 and 1),
  risk_band text not null check (risk_band in ('low','medium','high','very_high')),
  reference_probability numeric check (reference_probability between 0 and 1),
  probability_gap numeric, unique (forecast_id,outcome),
  check ((reference_probability is null and probability_gap is null) or
    (reference_probability is not null and probability_gap is not null))
);
create table public.policy_decisions (
  id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id),
  user_id uuid not null references public.users(id) on delete cascade,
  risk_profile text not null check (risk_profile in ('low','medium','high')),
  decision text not null check (decision in ('include','abstain')),
  risk_score numeric not null, reason text not null, policy_version text not null,
  created_at timestamptz not null default now(), unique (candidate_id,user_id)
);
create table public.simulated_positions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id),
  event_id text not null references public.events(id), outcome text not null,
  risk_profile text not null check (risk_profile in ('low','medium','high')),
  probability numeric not null check (probability between 0 and 1),
  uncertainty numeric not null check (uncertainty between 0 and 1),
  reference_probability numeric check (reference_probability between 0 and 1),
  probability_gap numeric, model_version text not null, policy_version text not null,
  virtual_allocation numeric(16,2) not null check (virtual_allocation > 0),
  status text not null check (status in ('active','resolved')),
  result text check (result in ('correct','incorrect')),
  credit_return numeric(16,2) check (credit_return >= 0),
  created_at timestamptz not null, resolved_at timestamptz,
  unique (user_id,candidate_id),
  check ((status = 'active' and resolved_at is null and result is null and credit_return is null) or
         (status = 'resolved' and resolved_at is not null and result is not null and credit_return is not null)),
  check (resolved_at is null or resolved_at >= created_at)
);
create unique index one_active_position_per_event on public.simulated_positions(user_id,event_id) where status = 'active';
create table public.resolutions (
  id uuid primary key default gen_random_uuid(), event_id text not null references public.events(id) unique,
  actual_outcome text not null, resolved_at timestamptz not null
);
create table public.feedback (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id), rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(), unique (user_id,candidate_id)
);
-- No browser service-role token and no anonymous writable tables.
alter table public.users enable row level security;
alter table public.preferences enable row level security;
alter table public.events enable row level security;
alter table public.forecasts enable row level security;
alter table public.reference_probabilities enable row level security;
alter table public.candidates enable row level security;
alter table public.policy_decisions enable row level security;
alter table public.simulated_positions enable row level security;
alter table public.resolutions enable row level security;
alter table public.feedback enable row level security;
create policy own_user on public.users for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy own_preferences on public.preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Ledger snapshots are read-only to clients; trusted server transactions must enforce policy and balance before inserting or resolving.
create policy read_own_decisions on public.policy_decisions for select to authenticated using (user_id = auth.uid());
create policy read_own_positions on public.simulated_positions for select to authenticated using (user_id = auth.uid());
create policy own_feedback on public.feedback for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy read_events on public.events for select to authenticated using (true);
create policy read_forecasts on public.forecasts for select to authenticated using (true);
create policy read_references on public.reference_probabilities for select to authenticated using (true);
create policy read_candidates on public.candidates for select to authenticated using (true);
create policy read_resolutions on public.resolutions for select to authenticated using (true);
