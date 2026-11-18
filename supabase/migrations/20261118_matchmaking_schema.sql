-- Matchmaking / Success Circle email workflow (Supabase side).
-- New completed intakes only: anything created before go_live_after is baselined and never touched.
-- Students with no GPA, or ones who lack two open scholarships, are held in status 'review' for a person.

create table if not exists public.mm_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  mode text not null default 'dry' check (mode in ('dry','test','live')),
  owner_email text not null default 'info@sustainable-scholars.org',
  from_email text not null default 'info@sustainable-scholars.org',
  go_live_after timestamptz not null default now(),
  cron_secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  updated_at timestamptz not null default now()
);
insert into public.mm_settings (id) values (1) on conflict do nothing;

create table if not exists public.mm_matchmaking (
  intake_id text primary key,                 -- Base44 IntakeForm id
  email text not null,
  first_name text,
  grade text,
  gpa numeric,
  status text not null check (status in (
    'sent',              -- live email delivered to the student
    'sent_test',         -- test email delivered to owner only
    'review',            -- eligible on grade/GPA but needs a person (no GPA, or not enough open scholarships)
    'ineligible',        -- grade not 11/12 or GPA not above 3.5
    'waiting_matches',   -- eligible, MatchResult not generated yet; retried each run
    'failed'             -- send error; retried each run up to 3 times
  )),
  reason text,
  top3 jsonb,
  attempts int not null default 0,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mm_matchmaking_status_idx on public.mm_matchmaking (status);

create table if not exists public.mm_run_log (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  mode text,
  scanned int, new_intakes int, sent int, review int, ineligible int, waiting int, failed int,
  detail jsonb
);

alter table public.mm_settings enable row level security;
alter table public.mm_matchmaking enable row level security;
alter table public.mm_run_log enable row level security;
-- No policies: only the service role (edge functions) reads or writes these tables.
