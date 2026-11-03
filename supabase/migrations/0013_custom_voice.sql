-- Voice mode: the leader picks the voice their own practice character speaks with. Scenarios saved
-- before this have no choice (null) and use a neutral voice until the leader edits them.
alter table public.custom_scenarios add column voice text check (voice in ('female', 'male'));
