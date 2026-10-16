-- Fix for 0003: the 20-scenario limit counted rows inside the insert policy, which re-applies the
-- table's own policies ("infinite recursion"). Count through a security-definer helper instead.
create function public.my_custom_scenario_count() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.custom_scenarios where user_id = (select auth.uid());
$$;
revoke execute on function public.my_custom_scenario_count() from public, anon;
grant execute on function public.my_custom_scenario_count() to authenticated;

drop policy "custom: owner inserts" on public.custom_scenarios;
create policy "custom: owner inserts" on public.custom_scenarios for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_member() and public.my_custom_scenario_count() < 20);
