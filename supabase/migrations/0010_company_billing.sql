-- Company self-serve (additive). An approved company program waits for payment: the platform owner sends
-- the contact a private payment link, the company chooses its number of leaders and pays with Stripe,
-- and the program goes live. Organizations get a number of leader seats and an access end date.

alter table public.organizations add column seats integer check (seats is null or seats >= 0);   -- null: no limit (e.g. the pilot)
alter table public.organizations add column paid_until timestamptz;

alter table public.org_programs drop constraint org_programs_status_check;
alter table public.org_programs add constraint org_programs_status_check
  check (status in ('draft', 'pending_review', 'awaiting_payment', 'live', 'archived'));

alter table public.intake_requests drop constraint intake_requests_status_check;
alter table public.intake_requests add constraint intake_requests_status_check
  check (status in ('new', 'drafting', 'draft_ready', 'draft_failed', 'awaiting_payment', 'approved', 'declined'));
alter table public.intake_requests add column pay_token text unique;   -- the secret in the company's payment link

create table public.org_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete set null,
  kind text not null check (kind in ('initial', 'seats')),
  seats integer not null check (seats > 0),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  email text,
  created_at timestamptz not null default now()
);
create index org_payments_org_idx on public.org_payments (org_id);

revoke all on public.org_payments from anon, authenticated;
grant select on public.org_payments to authenticated;
alter table public.org_payments enable row level security;
-- The organization's admins and the super admin read them. Writes: server only.
create policy "org payments: org admin or super admin" on public.org_payments for select to authenticated
  using (public.is_org_admin(org_id) or public.is_super_admin());
