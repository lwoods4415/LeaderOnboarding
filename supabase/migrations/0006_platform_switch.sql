-- Platform foundation, part 2. Run AFTER scripts/migrate-pilot.mjs has linked every row to an enrollment.
-- 1. Progress, private data, shared items and custom scenarios are keyed by enrollment (one person can be
--    enrolled in several programs).
-- 2. The single-admin privacy rules are replaced by organization-based ones:
--      leader          -> their own data
--      org admin       -> their organization's leaders' progress, shared items and usage (never private data)
--      super admin     -> the platform overview: organizations, programs, people, enrollments, usage
--                         (never leaders' progress, private data, shared items or custom scenarios)

-- ---------- helpers ----------
-- The caller's own, active enrollment (active person, active membership, active enrollment).
create function public.owns_active_enrollment(eid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    join public.memberships m on m.user_id = e.user_id and m.org_id = e.org_id
    join public.profiles p on p.id = e.user_id
    where e.id = eid and e.user_id = (select auth.uid()) and e.status = 'active' and m.active and p.active
  );
$$;

-- True if the caller is an org admin of the organization this enrollment belongs to.
create function public.admins_enrollment(eid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e where e.id = eid and public.is_org_admin(e.org_id));
$$;

-- True if the caller is an org admin of any organization the given person belongs to.
create function public.admins_person(person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m where m.user_id = person and public.is_org_admin(m.org_id));
$$;

revoke execute on function public.owns_active_enrollment(uuid), public.admins_enrollment(uuid), public.admins_person(uuid) from public, anon;
grant execute on function public.owns_active_enrollment(uuid), public.admins_enrollment(uuid), public.admins_person(uuid) to authenticated;

-- ---------- keys ----------
alter table public.leader_private alter column enrollment_id set not null;
alter table public.leader_private drop constraint leader_private_pkey;
alter table public.leader_private add primary key (enrollment_id);
create index leader_private_user_idx on public.leader_private (user_id);

alter table public.leader_progress alter column enrollment_id set not null;
alter table public.leader_progress drop constraint leader_progress_pkey;
alter table public.leader_progress add primary key (enrollment_id);
create index leader_progress_user_idx on public.leader_progress (user_id);

alter table public.shared_items alter column enrollment_id set not null;
alter table public.shared_items drop constraint shared_items_user_id_kind_item_id_key;
alter table public.shared_items add constraint shared_items_enrollment_kind_item_key unique (enrollment_id, kind, item_id);

alter table public.custom_scenarios alter column enrollment_id set not null;
create index custom_scenarios_enrollment_idx on public.custom_scenarios (enrollment_id);

-- ---------- replace the old single-admin rules ----------
drop policy "cohorts: own cohort or admin" on public.cohorts;
drop policy "profiles: own row or admin" on public.profiles;
drop policy "private: owner reads" on public.leader_private;
drop policy "private: owner inserts" on public.leader_private;
drop policy "private: owner updates" on public.leader_private;
drop policy "progress: owner or admin reads" on public.leader_progress;
drop policy "progress: owner inserts" on public.leader_progress;
drop policy "progress: owner updates" on public.leader_progress;
drop policy "shared: owner or admin reads" on public.shared_items;
drop policy "shared: owner inserts" on public.shared_items;
drop policy "shared: owner updates" on public.shared_items;
drop policy "shared: owner deletes" on public.shared_items;
drop policy "custom: owner reads" on public.custom_scenarios;
drop policy "custom: owner inserts" on public.custom_scenarios;
drop policy "custom: owner updates" on public.custom_scenarios;
drop policy "custom: owner deletes" on public.custom_scenarios;
drop policy "usage: admin reads" on public.usage_log;

create policy "profiles: own, org admin or super admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.admins_person(id) or public.is_super_admin());

create policy "cohorts: members, org admin or super admin" on public.cohorts for select to authenticated
  using (public.is_org_member(org_id) or public.is_super_admin());

-- Private data: the owner only. No admin of any kind.
create policy "private: owner reads" on public.leader_private for select to authenticated
  using (user_id = (select auth.uid()));
create policy "private: owner inserts" on public.leader_private for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id));
create policy "private: owner updates" on public.leader_private for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id));

-- Progress: the owner writes; the owner and their organization's admins read.
create policy "progress: owner or org admin reads" on public.leader_progress for select to authenticated
  using (user_id = (select auth.uid()) or public.admins_enrollment(enrollment_id));
create policy "progress: owner inserts" on public.leader_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id));
create policy "progress: owner updates" on public.leader_progress for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id));

-- Shared copies: the owner manages them; their organization's admins read them.
create policy "shared: owner or org admin reads" on public.shared_items for select to authenticated
  using (user_id = (select auth.uid()) or public.admins_enrollment(enrollment_id));
create policy "shared: owner inserts" on public.shared_items for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id));
create policy "shared: owner updates" on public.shared_items for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id));
create policy "shared: owner deletes" on public.shared_items for delete to authenticated
  using (user_id = (select auth.uid()));

-- Custom scenarios: the owner only.
create policy "custom: owner reads" on public.custom_scenarios for select to authenticated
  using (user_id = (select auth.uid()));
create policy "custom: owner inserts" on public.custom_scenarios for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id) and public.my_custom_scenario_count() < 20);
create policy "custom: owner updates" on public.custom_scenarios for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id));
create policy "custom: owner deletes" on public.custom_scenarios for delete to authenticated
  using (user_id = (select auth.uid()));

-- Usage: the organization's admins and the super admin.
create policy "usage: org admin or super admin reads" on public.usage_log for select to authenticated
  using (public.is_org_admin(org_id) or public.is_super_admin());

-- The old single-admin helpers are no longer used by any rule.
drop function public.is_admin();
drop function public.is_active_member();
