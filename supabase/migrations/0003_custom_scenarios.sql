-- Practice scenarios a leader writes for themselves. Private to that leader: the admin can't read
-- them (they may describe real situations). Scores and coach feedback from practicing them are saved
-- in leader_progress like the built-in conversations; the conversations themselves stay private.
create table public.custom_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(title) between 1 and 80),
  who text not null check (length(who) between 1 and 40),          -- the name the partner uses (not a real person's)
  role text not null check (length(role) between 1 and 120),       -- e.g. "A nurse on my team, 2 years in"
  situation text not null check (length(situation) between 1 and 1200),
  goal text not null check (length(goal) between 1 and 400),
  reactions text not null default '' check (length(reactions) <= 600),
  hidden text not null default '' check (length(hidden) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index custom_scenarios_user_idx on public.custom_scenarios (user_id);

create trigger custom_scenarios_updated before update on public.custom_scenarios
  for each row execute function public.set_updated_at();

revoke all on public.custom_scenarios from anon, authenticated;
grant select, insert, update, delete on public.custom_scenarios to authenticated;
alter table public.custom_scenarios enable row level security;

-- Owner only. Deliberately no admin clause.
create policy "custom: owner reads" on public.custom_scenarios for select to authenticated
  using (user_id = (select auth.uid()));
create policy "custom: owner inserts" on public.custom_scenarios for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_member()
    and (select count(*) from public.custom_scenarios c where c.user_id = (select auth.uid())) < 20);
create policy "custom: owner updates" on public.custom_scenarios for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_member());
create policy "custom: owner deletes" on public.custom_scenarios for delete to authenticated
  using (user_id = (select auth.uid()));
