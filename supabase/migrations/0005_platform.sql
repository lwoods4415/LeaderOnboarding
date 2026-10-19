-- Platform foundation, part 1 (additive): organizations, program templates, each organization's own
-- copy of a program, memberships, enrollments with a plan. Existing tables gain nullable links that
-- scripts/migrate-pilot.mjs fills in; 0006 then switches progress to per-enrollment keys and replaces
-- the single-admin privacy rules with organization-based ones. Nothing here changes what the current
-- app can read or write.

-- ---------- organizations ----------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  kind text not null check (kind in ('company', 'individual')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

-- ---------- program templates (the standard versions of each program) ----------
create table public.program_templates (
  id text primary key,                         -- e.g. 'leading-people-healthcare-v1', 'leading-people-general-v1'
  program text not null,                       -- e.g. 'leading-people' (later 'leading-leaders', …)
  title text not null,
  content jsonb not null,                      -- everything leaders see
  created_at timestamptz not null default now()
);
-- Character backstories and other server-only parts. No one signed in can read this table; only the server.
create table public.program_template_secrets (
  template_id text primary key references public.program_templates (id) on delete cascade,
  secrets jsonb not null
);

-- ---------- each organization's own copy of a program ----------
create table public.org_programs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  program text not null,
  template_id text references public.program_templates (id),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'live', 'archived')),
  intake jsonb,                                -- the intake form answers it was tailored from
  content jsonb not null,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index org_programs_org_idx on public.org_programs (org_id);
create trigger org_programs_updated before update on public.org_programs
  for each row execute function public.set_updated_at();

create table public.org_program_secrets (
  org_program_id uuid primary key references public.org_programs (id) on delete cascade,
  secrets jsonb not null
);

-- ---------- who belongs to which organization ----------
create table public.memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role text not null default 'leader' check (role in ('org_admin', 'leader')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, org_id)
);
create index memberships_org_idx on public.memberships (org_id);

-- ---------- a leader's enrollment in a program, on a plan ----------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  org_program_id uuid not null references public.org_programs (id) on delete cascade,
  plan text not null check (plan in ('free', 'essentials', 'complete', 'cohort', 'company')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  cohort_id uuid references public.cohorts (id) on delete set null,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, org_program_id)
);
create index enrollments_org_idx on public.enrollments (org_id);
create index enrollments_user_idx on public.enrollments (user_id);

-- ---------- links on existing tables (filled in by the pilot migration script) ----------
alter table public.profiles add column is_super_admin boolean not null default false;
alter table public.cohorts add column org_id uuid references public.organizations (id) on delete cascade;
alter table public.cohorts drop constraint if exists cohorts_name_key;           -- names are unique per organization now
create unique index cohorts_org_name_idx on public.cohorts (org_id, name);
alter table public.leader_private add column enrollment_id uuid references public.enrollments (id) on delete cascade;
alter table public.leader_progress add column enrollment_id uuid references public.enrollments (id) on delete cascade;
alter table public.shared_items add column enrollment_id uuid references public.enrollments (id) on delete cascade;
alter table public.custom_scenarios add column enrollment_id uuid references public.enrollments (id) on delete cascade;
alter table public.usage_log add column org_id uuid references public.organizations (id) on delete set null;
alter table public.usage_log add column enrollment_id uuid references public.enrollments (id) on delete set null;

-- ---------- privacy for the new tables ----------
-- Helper checks (security definer so policies can use them without recursion).
create function public.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and is_super_admin and active);
$$;

create function public.is_org_admin(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m join public.profiles p on p.id = m.user_id
    where m.user_id = (select auth.uid()) and m.org_id = org and m.role = 'org_admin' and m.active and p.active
  );
$$;

create function public.is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m join public.profiles p on p.id = m.user_id
    where m.user_id = (select auth.uid()) and m.org_id = org and m.active and p.active
  );
$$;

revoke execute on function public.is_super_admin(), public.is_org_admin(uuid), public.is_org_member(uuid) from public, anon;
grant execute on function public.is_super_admin(), public.is_org_admin(uuid), public.is_org_member(uuid) to authenticated;

revoke all on public.organizations, public.program_templates, public.program_template_secrets, public.org_programs,
  public.org_program_secrets, public.memberships, public.enrollments from anon, authenticated;
-- Signed-in users may read (subject to the policies below). All writes go through the server.
grant select on public.organizations, public.program_templates, public.org_programs, public.memberships, public.enrollments to authenticated;
-- program_template_secrets and org_program_secrets: no grants at all. Server only.

alter table public.organizations enable row level security;
alter table public.program_templates enable row level security;
alter table public.program_template_secrets enable row level security;
alter table public.org_programs enable row level security;
alter table public.org_program_secrets enable row level security;
alter table public.memberships enable row level security;
alter table public.enrollments enable row level security;

create policy "orgs: members and super admin read" on public.organizations for select to authenticated
  using (public.is_org_member(id) or public.is_super_admin());

-- Templates hold no backstories (those are in the secrets table), so any signed-in user may read them.
create policy "templates: signed-in users read" on public.program_templates for select to authenticated
  using (true);

-- Members read their organization's live programs; its admins and the super admin read every status.
create policy "org programs: members read live, admins read all" on public.org_programs for select to authenticated
  using ((status = 'live' and public.is_org_member(org_id)) or public.is_org_admin(org_id) or public.is_super_admin());

-- Leaders see their own membership; org admins see their organization's; the super admin sees all.
create policy "memberships: own, org admin or super admin" on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or public.is_org_admin(org_id) or public.is_super_admin());

create policy "enrollments: own, org admin or super admin" on public.enrollments for select to authenticated
  using (user_id = (select auth.uid()) or public.is_org_admin(org_id) or public.is_super_admin());
