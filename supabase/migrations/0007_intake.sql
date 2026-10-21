-- Intake requests and the tailored program drafts made from them (additive).
-- A company or individual fills in the public intake form at /start. For a company, Claude drafts a tailored
-- copy of the standard program; the platform owner reviews the changes, can undo any of them or ask for a
-- redraft, and approves it. Approving creates the organization and its live program. A "template" request is
-- the platform owner drafting a new standard version (for example the general, non-healthcare one).
--
-- Contact details and draft backstories live here, so no one signed in can read or write this table directly:
-- every read and write goes through server code that first checks the caller is the super admin.

create table public.intake_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('company', 'individual', 'template')),
  org_name text check (length(org_name) <= 120),
  contact_name text check (length(contact_name) <= 120),
  contact_email text check (length(contact_email) <= 254),
  answers jsonb not null,                       -- the intake form answers
  status text not null default 'new'
    check (status in ('new', 'drafting', 'draft_ready', 'draft_failed', 'approved', 'declined')),
  base_template_id text references public.program_templates (id),
  draft_content jsonb,                          -- the tailored copy (what leaders would see)
  draft_secrets jsonb,                          -- tailored character backstories (server only)
  draft_summary text,                           -- Claude's short summary of what it changed
  review_notes text,                            -- the platform owner's notes for the latest redraft
  draft_error text,
  draft_cost numeric(8, 4) not null default 0,  -- estimated Claude cost of all drafts for this request, USD
  drafted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  org_id uuid references public.organizations (id) on delete set null,       -- set when a company request is approved
  template_id text references public.program_templates (id) on delete set null, -- set when a template request is approved
  ip_hash text,                                 -- for the form's rate limit; a hash, never the address
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index intake_requests_created_idx on public.intake_requests (created_at desc);
create index intake_requests_ip_idx on public.intake_requests (ip_hash, created_at);
create trigger intake_requests_updated before update on public.intake_requests
  for each row execute function public.set_updated_at();

revoke all on public.intake_requests from anon, authenticated;
alter table public.intake_requests enable row level security;
-- No policies and no grants: server only.
