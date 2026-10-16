# Leading People protocol app

Live at https://www.growlikealeader.com. A 12-week onboarding protocol for first-time people leaders. Next.js (App Router) on Vercel, Supabase for
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
| `ANTHROPIC_API_KEY` | server only: the practice partner | **Yes, server-only** |
| `PRACTICE_MESSAGE_MODEL` | optional; default `claude-haiku-5-5` | No |
| `PRACTICE_FEEDBACK_MODEL` | optional; default `claude-sonnet-5-5` | No |
| `PRACTICE_MESSAGES_PER_DAY` | optional; default `150` per leader | No |
| `PRACTICE_FEEDBACK_PER_DAY` | optional; default `15` per leader | No |

## Supabase setup (one time)

1. **Database:** open Supabase → SQL Editor → New query, paste all of `supabase/migrations/0001_init.sql`, and run it.
   Then do the same for each later file in `supabase/migrations/`, in number order.
2. **Invite-only sign-in:** Authentication → Sign In / Providers → turn **off** "Allow new users to sign up".
   Email stays enabled. Leaders can only get in after you invite them.
3. **Links:** Authentication → URL Configuration.
   - Site URL: the production address, `https://www.growlikealeader.com`
   - Redirect URLs: add `https://www.growlikealeader.com/**`, `https://growlikealeader.com/**` and `http://localhost:3000/**`.
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

Sign-in emails are sent from the server (`app/(auth)/signin/actions.ts`) so every link works even when a
leader opens the email on a different device.

- **With Supabase's standard templates** (before custom SMTP), links go to `/auth/callback`, which carries the
  session in the link.
- **With the custom templates** in `supabase/email-templates/` (needs custom SMTP), links go to `/auth/confirm`,
  which signs in only when the leader selects **Sign in**. Work email systems often open links to scan them,
  and that would otherwise use up the one-time link. These emails also include a sign-in code, which leaders
  can type on the sign-in page instead.

### When invite emails are slow or go to spam

- **Copy sign-in link** (Leaders and cohorts page) creates a one-time link for a leader **without sending email**,
  for you to share directly (Teams, text). It opens `/auth/confirm`, so link scanners can't use it up.
- Set link and code lifetime to 24 hours: Authentication → Sign In / Providers → Email → **Email OTP Expiration** `86400`.
- Keep a DMARC record on the domain (`_dmarc` TXT `v=DMARC1; p=none;`). A new domain builds sending reputation over a few weeks.
- Ask leaders to mark the email "Not junk", or ask their organization's IT to allowlist `growlikealeader.com`.

### Custom email (SMTP)

Supabase's built-in email only sends a few messages an hour and is meant for testing. Before inviting the
pilot cohort, connect a real email provider (for example Resend, Postmark or Amazon SES):
Authentication → Emails → SMTP Settings → enable custom SMTP and enter the provider's host, port, username,
password and a sender address on a domain you own. Then raise the email rate limit under Authentication →
Rate Limits. Send yourself a magic link to check it arrives.

With custom SMTP connected, paste the templates: Authentication → Emails → Templates → **Magic link** gets
`supabase/email-templates/magic-link.html` and **Invite user** gets `supabase/email-templates/invite.html`.
Recommended for pilots where leaders use work email addresses.

## Privacy model

Enforced by row-level security in `supabase/migrations/0001_init.sql`, not just by the screens.

| Data | Table | Admin can read? |
| --- | --- | --- |
| Name, cohort, last active | `profiles` | Yes |
| Module progress, scenario answers, practice scores and feedback, self-assessment, team pulse | `leader_progress` | Yes |
| Shared reflections and conversations (one at a time, until the leader stops sharing) | `shared_items` | Yes |
| Reflections, planners, documentation builder, trust self-check, practice checklist, full conversations | `leader_private` | **No** |
| Practice scenarios a leader writes | `custom_scenarios` | **No** |

`npm run test:rls` signs in as two throwaway leaders and a throwaway admin and checks these rules (it needs
`SUPABASE_SECRET_KEY` in `.env.local`, and deletes the test accounts when it finishes).

## Changing program wording

The content files in `content/leading-people/` are generated from the reference page. To change wording, add a
`find` / `replace` pair to `content/leading-people/approved-edits.json`, then run `node scripts/extract-content.mjs`
and `npm run verify:content`. The check confirms every other word still matches the reference.

## Practice partner

`app/api/practice/message` streams the character's reply; `app/api/practice/feedback` returns scored feedback.
Both need a signed-in, active leader. The character's instructions are built on the server from
`content/leading-people/prompts.ts` and `roleplay-secrets.ts`, so the persona and hidden context never reach
the browser. Only conversation text is sent to Claude. Limits: 30 leader turns per conversation, 2,000
characters per message, and the daily per-leader limits above. Every call is recorded in `usage_log`
(user, route, model, tokens) for cost per cohort. Feedback uses Anthropic's server-side fallback
(`fallbacks: "default"`), so a wrongly declined review is retried on another model.

**Leaders' own scenarios** ("Create your own" in the studio) live in `custom_scenarios`, readable only by the
leader who wrote them. The server loads a scenario by id as that leader and places their text inside fixed
program instructions (`customRolePrompt` in `prompts.ts`). They're scored on the standard five-skill rubric in
`content/custom-practice.ts`. Scores and coach feedback go to `leader_progress` (visible to the admin as
"Custom scenario 1, 2…", without titles or descriptions); conversations stay private unless shared.
Up to 20 scenarios per leader.

After a build, `npm run check:bundle` confirms no secret key or backstory is in the browser code.

## Development

```bash
npm install
npm run dev
```

`.claude/launch.json` also has a `reference` config that serves the original page on port 4321 for side-by-side checks.

## Launch checklist

- [x] Custom SMTP connected and a magic link received at a non-test address
- [ ] Custom email templates pasted in (see Custom email above) and a sign-in tested from a work email address
- [x] Spending limit set in the Anthropic Console ($20/month)
- [ ] `ANTHROPIC_API_KEY` set in Vercel, and a practice conversation tested on the live site
- [x] Row-level security tests passing (`npm run test:rls`)
- [x] Admin role set on my account only
- [x] Privacy wording approved by me (Overview panel and `/privacy` page)
- [ ] Every page checked on a phone
- [ ] Pilot cohort created and leaders invited

### Good to know

- **Supabase free plan pauses a project after about a week with no activity.** That's unlikely during a
  cohort, but between cohorts sign in once a week, or upgrade to Supabase Pro.
- **Removing a leader** (Leaders and cohorts → Remove access) blocks sign-in and keeps their data.
  **Delete permanently** then removes the account and everything saved in it.
- **Signing out** removes the leader's on-device copy once everything has saved.
- Error pages: `app/(app)/error.tsx` (inside the app), `app/error.tsx` (sign-in pages), `app/global-error.tsx`
  (last resort), `app/not-found.tsx`.
