-- Instagram comment-to-DM system (replaces the Activepieces flows). Applied to project jbqzuzuloxxnzjrbehgr.
-- Service-role only: RLS on, no policies. The Page token lives in ig_settings.page_token (never commit it).

create table if not exists public.ig_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  mode text not null default 'dry' check (mode in ('dry','live')),
  page_token text,
  ig_user_id text not null default '17841479724684432',
  page_id text not null default '1432241136630399',
  own_username text not null default 'sustainable__scholars',
  owner_email text not null default 'info@sustainable-scholars.org',
  max_dms_per_run int not null default 10,
  max_review_per_run int not null default 40,
  dm_window_days numeric not null default 6.8,
  review_window_days int not null default 14,
  display_tz text not null default 'America/New_York',
  digest_hour int not null default 8,
  last_digest_date date,
  cron_secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  updated_at timestamptz not null default now()
);
insert into public.ig_settings (id) values (1) on conflict do nothing;

create table if not exists public.ig_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null unique,
  keyword text not null,
  post_id text not null,
  post_link text,
  dm_message text not null,
  link_to_send text not null,
  status text not null default 'Paused' check (status in ('Active','Paused','Ended')),
  ends_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.ig_handled (
  comment_id text primary key,
  campaign_name text,
  post_id text,
  username text,
  comment_text text,
  handled_at timestamptz not null default now(),
  result text not null check (result in ('Sent','Failed','Skipped','Pending')),
  public_reply_ok boolean,
  error text
);
create index if not exists ig_handled_sent_idx on public.ig_handled (post_id, lower(username)) where result = 'Sent';

create table if not exists public.ig_needs_reply (
  comment_id text primary key,
  campaign_name text,
  post_link text,
  username text,
  comment_text text,
  commented_at timestamptz,
  type text not null default 'Other' check (type in ('Question','Other')),
  status text not null default 'New' check (status in ('New','Emailed','Replied','Ignored')),
  emailed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists ig_needs_reply_status_idx on public.ig_needs_reply (status);

create table if not exists public.ig_run_log (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  job text not null,
  detail jsonb
);

alter table public.ig_settings enable row level security;
alter table public.ig_campaigns enable row level security;
alter table public.ig_handled enable row level security;
alter table public.ig_needs_reply enable row level security;
alter table public.ig_run_log enable row level security;

-- cron (run in the SQL editor; secret is read from ig_settings):
--   ig-run     */5 * * * *  -> /functions/v1/ig-run
--   ig-digest  5 * * * *    -> /functions/v1/ig-digest  (acts only at digest_hour local time, once a day)
