-- Practice partner usage: one row per Claude API call, for daily limits and cost per cohort.
-- Written only by the server (secret key). The admin can read it; leaders can't.
create table public.usage_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  route text not null check (route in ('message', 'feedback')),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index usage_log_user_day_idx on public.usage_log (user_id, route, created_at);

revoke all on public.usage_log from anon, authenticated;
grant select on public.usage_log to authenticated;
alter table public.usage_log enable row level security;

create policy "usage: admin reads" on public.usage_log for select to authenticated
  using (public.is_admin());
