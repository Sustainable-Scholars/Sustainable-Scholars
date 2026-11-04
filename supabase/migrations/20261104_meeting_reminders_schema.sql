-- Meeting reminder system: 24h / 1h / 5m emails before a booked call.
-- All tables are service-role only (RLS on, no policies). Applied to project jbqzuzuloxxnzjrbehgr.

create table if not exists public.mr_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  mode text not null default 'dry' check (mode in ('dry','test','live')),
  owner_email text not null default 'info@sustainable-scholars.org',
  from_email text not null default 'info@sustainable-scholars.org',
  from_name text not null default 'Sustainable Scholars',
  display_tz text not null default 'America/New_York',
  cron_secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  updated_at timestamptz not null default now()
);
insert into public.mr_settings (id) values (1) on conflict do nothing;

create table if not exists public.mr_meetings (
  id uuid primary key default gen_random_uuid(),
  source_id text not null unique,            -- Base44 Booking id
  client_email text,
  client_name text,
  start_utc timestamptz not null,
  end_utc timestamptz,
  meet_link text,
  topic text,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mr_reminders (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.mr_meetings(id) on delete cascade,
  kind text not null check (kind in ('24h','1h','5m')),
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','skipped','cancelled')),
  attempts int not null default 0,
  sent_at timestamptz,
  provider_id text,
  error text,
  updated_at timestamptz not null default now(),
  unique (meeting_id, kind)                   -- hard cap: one reminder of each kind per meeting
);
create index if not exists mr_reminders_due_idx on public.mr_reminders (status, due_at);

create table if not exists public.mr_opt_outs (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.mr_run_log (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  job text not null,
  detail jsonb
);

alter table public.mr_settings enable row level security;
alter table public.mr_meetings enable row level security;
alter table public.mr_reminders enable row level security;
alter table public.mr_opt_outs enable row level security;
alter table public.mr_run_log enable row level security;

-- Claims due reminders safely: expires missed ones, cancels dead ones, locks the rest.
create or replace function public.mr_claim_due(p_limit int default 20)
returns table (o_id uuid, o_kind text, o_due timestamptz, o_meeting uuid, o_email text, o_name text,
               o_start timestamptz, o_link text, o_topic text, o_attempts int)
language plpgsql security definer set search_path = public as $$
begin
  update mr_reminders r set status = 'skipped', error = 'missed window', updated_at = now()
   where r.status = 'pending'
     and r.due_at < now() - (case r.kind when '24h' then interval '15 minutes'
                                         when '1h' then interval '10 minutes'
                                         else interval '2 minutes' end);
  update mr_reminders r set status = 'cancelled', updated_at = now()
    from mr_meetings m
   where r.meeting_id = m.id and r.status = 'pending'
     and (m.status <> 'confirmed' or m.start_utc <= now());
  update mr_reminders r set status = 'skipped', error = 'opted out', updated_at = now()
    from mr_meetings m
   where r.meeting_id = m.id and r.status = 'pending'
     and exists (select 1 from mr_opt_outs o where lower(o.email) = lower(m.client_email));
  update mr_reminders r set status = 'pending', updated_at = now()
   where r.status = 'sending' and r.updated_at < now() - interval '10 minutes';

  return query
  with c as (
    select r.id from mr_reminders r
     where r.status = 'pending' and r.due_at <= now()
     order by r.due_at limit p_limit
     for update skip locked
  ), u as (
    update mr_reminders r set status = 'sending', attempts = r.attempts + 1, updated_at = now()
      from c where r.id = c.id
    returning r.id, r.kind, r.due_at, r.meeting_id, r.attempts
  )
  select u.id, u.kind, u.due_at, m.id, m.client_email, m.client_name, m.start_utc, m.meet_link, m.topic, u.attempts
    from u join mr_meetings m on m.id = u.meeting_id;
end $$;
revoke all on function public.mr_claim_due(int) from public, anon, authenticated;
