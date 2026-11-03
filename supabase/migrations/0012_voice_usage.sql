-- Voice mode: the practice partner's spoken replies (ElevenLabs) are logged with the rest of the practice
-- usage, so daily limits and costs cover them. For 'speak' rows, input_tokens holds the number of characters spoken.
alter table public.usage_log drop constraint usage_log_route_check;
alter table public.usage_log add constraint usage_log_route_check check (route in ('message', 'feedback', 'tailor', 'speak'));
