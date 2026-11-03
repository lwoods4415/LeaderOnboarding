-- Speech-to-text fallback: when the browser's own speech service can't be reached (some work networks block it),
-- the leader's recorded speech is turned into text by ElevenLabs through this site. For 'transcribe' rows,
-- input_tokens holds the seconds of audio transcribed.
alter table public.usage_log drop constraint usage_log_route_check;
alter table public.usage_log add constraint usage_log_route_check check (route in ('message', 'feedback', 'tailor', 'speak', 'transcribe'));
