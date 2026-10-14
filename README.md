# Leading People protocol app

A 12-week onboarding protocol for first-time people leaders. Next.js (App Router) on Vercel, Supabase for
sign-in and saved progress, and (from Phase 3) the Claude API for the practice partner.

The content is ported word for word from `reference/1-Leading-People-Protocol.html` into `content/`.
`npm run verify:content` checks it still matches.

## Environment variables

Set these in `.env.local` for local work and in Vercel → Project → Settings → Environment Variables.
`.env.example` has the same list.

| Name | Where it's used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser and server | No, public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server | No, public (row-level security protects the data) |
| `SUPABASE_SECRET_KEY` | server only: invites and access changes | **Yes, server-only.** Never prefix with `NEXT_PUBLIC_` |
| `SITE_URL` | server only: the link in invite emails | No |

## Supabase setup (one time)

1. **Database:** open Supabase → SQL Editor → New query, paste all of `supabase/migrations/0001_init.sql`, and run it.
2. **Invite-only sign-in:** Authentication → Sign In / Providers → turn **off** "Allow new users to sign up".
   Email stays enabled. Leaders can only get in after you invite them.
3. **Links:** Authentication → URL Configuration.
   - Site URL: the production address, e.g. `https://leader-onboarding-three.vercel.app`
   - Redirect URLs: add `https://leader-onboarding-three.vercel.app/**` and `http://localhost:3000/**`.
4. **Make yourself the admin (once).** With `.env.local` filled in, run:

   ```bash
   node --env-file=.env.local scripts/make-admin.mjs you@example.com "Your Name"
   ```

   Or in the SQL Editor, after inviting yourself from Authentication → Users:

   ```sql
   insert into public.profiles (id, email, name, role)
   select id, email, 'Your Name', 'admin' from auth.users where email = 'you@example.com'
   on conflict (id) do update set role = 'admin', active = true;
   ```

   The app never lets anyone change a role. These are the only ways to make an admin.

### How sign-in links work

Sign-in and invite emails use Supabase's standard templates. The link carries the session to
`/auth/callback`, so it works even when a leader opens the email on a different device. Sign-in emails
are sent from the server (`app/(auth)/signin/actions.ts`) for that reason.

### Custom email (SMTP)

Supabase's built-in email only sends a few messages an hour and is meant for testing. Before inviting the
pilot cohort, connect a real email provider (for example Resend, Postmark or Amazon SES):
Authentication → Emails → SMTP Settings → enable custom SMTP and enter the provider's host, port, username,
password and a sender address on a domain you own. Then raise the email rate limit under Authentication →
Rate Limits. Send yourself a magic link to check it arrives.

With custom SMTP connected you can also brand the emails: Authentication → Emails → Templates. Starting
points are in `supabase/email-templates/` (they link to `/auth/confirm`, which also works across devices).

## Privacy model

Enforced by row-level security in `supabase/migrations/0001_init.sql`, not just by the screens.

| Data | Table | Admin can read? |
| --- | --- | --- |
| Name, cohort, last active | `profiles` | Yes |
| Module progress, scenario answers, practice scores and feedback, self-assessment, team pulse | `leader_progress` | Yes |
| Shared reflections and conversations (one at a time, until the leader stops sharing) | `shared_items` | Yes |
| Reflections, planners, documentation builder, trust self-check, practice checklist, full conversations | `leader_private` | **No** |

`npm run test:rls` signs in as two throwaway leaders and a throwaway admin and checks these rules (it needs
`SUPABASE_SECRET_KEY` in `.env.local`, and deletes the test accounts when it finishes).

## Development

```bash
npm install
npm run dev
```

`.claude/launch.json` also has a `reference` config that serves the original page on port 4321 for side-by-side checks.

## Launch checklist

- [ ] Custom SMTP connected and a magic link received at a non-test address
- [ ] Spending limit set in the Anthropic Console
- [ ] Row-level security tests passing (`npm run test:rls`)
- [ ] Admin role set on my account only
- [ ] Privacy wording approved by me
- [ ] Every page checked on a phone
- [ ] Pilot cohort created and leaders invited
