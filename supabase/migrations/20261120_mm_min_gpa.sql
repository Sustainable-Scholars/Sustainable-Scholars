-- GPA cutoff for the matchmaking email is now a setting (was hard-coded "above 3.5").
alter table public.mm_settings add column if not exists min_gpa numeric not null default 3.3;
update public.mm_settings set min_gpa = 3.3 where id = 1;
