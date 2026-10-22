-- Program text is served by the server (/api/program), trimmed to what the leader's plan includes,
-- so a free preview can't read paid modules straight from the database. Apply together with the release
-- that reads content through /api/program. Everyone signed in keeps reading the other columns.
revoke select on public.org_programs from authenticated;
grant select (id, org_id, program, template_id, status, approved_at, approved_by, created_at, updated_at)
  on public.org_programs to authenticated;
-- The standard versions hold full program text too: only the server reads them.
revoke select on public.program_templates from authenticated;
grant select (id, program, title, created_at) on public.program_templates to authenticated;
