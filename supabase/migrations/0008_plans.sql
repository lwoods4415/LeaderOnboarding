-- Paid plans for individual leaders (additive). Payments come from Stripe Checkout and are recorded by
-- the server only. "Create your own" practice scenarios need the Complete plan or above (or a company plan).
-- The individual leaders' organization ("Individuals") is created by the server on the first free sign-up.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  plan text not null check (plan in ('essentials', 'complete', 'cohort')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  launch_price boolean not null default false,  -- bought Complete at the launch price
  stripe_session_id text not null unique,       -- the Checkout Session, so a payment is only recorded once
  stripe_payment_intent text,
  email text,
  created_at timestamptz not null default now()
);
create index payments_enrollment_idx on public.payments (enrollment_id);

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
alter table public.payments enable row level security;
-- Leaders see their own payments; the super admin sees all (the Platform page). Writes: server only.
create policy "payments: own or super admin" on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or public.is_super_admin());

-- True when this enrollment's plan includes "Create your own" scenarios right now.
create function public.enrollment_allows_custom(eid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    where e.id = eid and e.user_id = (select auth.uid())
      and (e.plan = 'company' or (e.plan in ('complete', 'cohort') and (e.expires_at is null or e.expires_at > now())))
  );
$$;
revoke execute on function public.enrollment_allows_custom(uuid) from public, anon;
grant execute on function public.enrollment_allows_custom(uuid) to authenticated;

drop policy "custom: owner inserts" on public.custom_scenarios;
create policy "custom: owner inserts" on public.custom_scenarios for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_active_enrollment(enrollment_id)
    and public.enrollment_allows_custom(enrollment_id) and public.my_custom_scenario_count() < 20);
