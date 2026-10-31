-- Tailored core lessons (docs/TAILORING.md), additive. A "lesson set" holds the tailored example layer of
-- the seven core lessons for one owner:
--   a company's program draft (intake request), which moves to its live program when approved;
--   a live program (for example the Individuals program's general version); or
--   one individual leader on the Complete or Cohort plan (their enrollment), from their own answers.
-- Approved 2026-10-31: server only (no one signed in reads these tables; leaders get lessons from
-- /api/program, trimmed to their plan), and started lessons can't be regenerated or edited.

create table public.lesson_sets (
  id uuid primary key default gen_random_uuid(),
  intake_request_id uuid unique references public.intake_requests (id) on delete set null,
  org_program_id uuid unique references public.org_programs (id) on delete cascade,
  enrollment_id uuid unique references public.enrollments (id) on delete cascade,
  use_default boolean not null default false,        -- show the base lessons, no tailoring
  answers jsonb,                                     -- an individual's own answers (the form on their plan page)
  context jsonb,                                     -- the ProgramContext the lessons were tailored from
  state text not null default 'idle' check (state in ('idle', 'running', 'done', 'failed')),
  error text,
  cost numeric(8, 4) not null default 0,             -- estimated Claude cost of all tailoring for this set, USD
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(intake_request_id, org_program_id, enrollment_id) >= 1)
);
create trigger lesson_sets_updated before update on public.lesson_sets
  for each row execute function public.set_updated_at();

create table public.program_core_lessons (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.lesson_sets (id) on delete cascade,
  lesson_id text not null,                           -- cl-m0 … cl-m6
  content_version text not null,                     -- CORE_LESSONS_CONTENT_VERSION it was tailored from
  status text not null check (status in ('generated', 'approved', 'edited', 'fallback')),
  tailored jsonb not null,                           -- the example layer (TailoredLessonContent)
  errors jsonb,
  note text,                                         -- the platform owner's steering note, if any
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  unique (set_id, lesson_id)
);

revoke all on public.lesson_sets, public.program_core_lessons from anon, authenticated;
alter table public.lesson_sets enable row level security;
alter table public.program_core_lessons enable row level security;
-- No policies and no grants: server only.

-- Tailoring calls are logged with the practice partner's usage.
alter table public.usage_log drop constraint usage_log_route_check;
alter table public.usage_log add constraint usage_log_route_check check (route in ('message', 'feedback', 'tailor'));

-- The pilot already matches the lessons' healthcare examples: it shows the base lessons.
insert into public.lesson_sets (org_program_id, use_default)
select op.id, true from public.org_programs op join public.organizations o on o.id = op.org_id
where o.slug = 'pilot' and op.status = 'live'
on conflict do nothing;
