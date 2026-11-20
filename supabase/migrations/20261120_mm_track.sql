-- Two email tracks: 'circle' (grade 11/12 and GPA >= min_gpa) and 'general' (everyone else, including no GPA).
alter table public.mm_matchmaking add column if not exists track text check (track in ('circle','general'));
update public.mm_matchmaking set track = 'circle' where status in ('sent','sent_test') and track is null;
