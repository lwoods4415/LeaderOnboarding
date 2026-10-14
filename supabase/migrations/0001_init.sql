-- Leading People app: accounts, cohorts and saved progress.
-- Privacy model (brief section 7), enforced here with row-level security:
--   leader_private  -> only the owning leader. The admin has no read access.
--   leader_progress -> the owning leader, plus the admin (read only).
--   shared_items    -> the owning leader, plus the admin (read only). Deleting a row = "stop sharing".
--   profiles        -> a leader sees their own row; the admin sees all. Only the server (secret key) writes.
--   cohorts         -> a leader sees their own cohort; the admin sees all. Only the server writes.
-- Run once in the Supabase SQL Editor (or `supabase db push`).

-- ---------- tables ----------
create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  cohort_id uuid references public.cohorts (id) on delete set null,
  role text not null default 'leader' check (role in ('leader', 'admin')),
  active boolean not null default true,
  last_active timestamptz,
  created_at timestamptz not null default now()
);
create index profiles_cohort_idx on public.profiles (cohort_id);

create table public.leader_private (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.leader_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.shared_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('reflection', 'conversation')),
  item_id text not null,
  content jsonb not null,
  shared_at timestamptz not null default now(),
  unique (user_id, kind, item_id)
);

-- ---------- helpers ----------
-- security definer so policies can check the caller's own profile without recursion.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active
  );
$$;

create function public.is_active_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and active
  );
$$;

-- Lets a signed-in leader record "last active" without being able to edit anything else on their profile.
create function public.touch_last_active() returns void
language sql volatile security definer set search_path = '' as $$
  update public.profiles set last_active = now()
  where id = (select auth.uid()) and active;
$$;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger leader_private_updated before insert or update on public.leader_private
  for each row execute function public.set_updated_at();
create trigger leader_progress_updated before insert or update on public.leader_progress
  for each row execute function public.set_updated_at();

revoke execute on function public.is_admin(), public.is_active_member(), public.touch_last_active() from public, anon;
grant execute on function public.is_admin(), public.is_active_member(), public.touch_last_active() to authenticated;

-- ---------- table privileges ----------
-- Nobody signed out can touch anything. Signed-in users get only what the policies below allow.
revoke all on public.cohorts, public.profiles, public.leader_private, public.leader_progress, public.shared_items from anon, authenticated;
grant select on public.cohorts, public.profiles to authenticated;
grant select, insert, update on public.leader_private, public.leader_progress to authenticated;
grant select, insert, update, delete on public.shared_items to authenticated;

-- ---------- row-level security ----------
alter table public.cohorts enable row level security;
alter table public.profiles enable row level security;
alter table public.leader_private enable row level security;
alter table public.leader_progress enable row level security;
alter table public.shared_items enable row level security;

create policy "cohorts: own cohort or admin" on public.cohorts for select to authenticated
  using (
    public.is_admin()
    or id = (select cohort_id from public.profiles where id = (select auth.uid()))
  );

create policy "profiles: own row or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

-- Private: the owner only. Deliberately no admin clause.
create policy "private: owner reads" on public.leader_private for select to authenticated
  using (user_id = (select auth.uid()));
create policy "private: owner inserts" on public.leader_private for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_member());
create policy "private: owner updates" on public.leader_private for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_member());

-- Progress: the owner writes; the owner and the admin read.
create policy "progress: owner or admin reads" on public.leader_progress for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "progress: owner inserts" on public.leader_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_member());
create policy "progress: owner updates" on public.leader_progress for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_member());

-- Shared copies: the owner manages them; the admin reads them.
create policy "shared: owner or admin reads" on public.shared_items for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "shared: owner inserts" on public.shared_items for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_member());
create policy "shared: owner updates" on public.shared_items for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_member());
create policy "shared: owner deletes" on public.shared_items for delete to authenticated
  using (user_id = (select auth.uid()));
