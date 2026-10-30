# Tailoring brief: core lessons for every program

This brief is for Claude Code. Read it after INTEGRATION.md. The platform builds an individualized 12-week program from each organization's intake form. This brief makes the core lessons part of that: each program gets its own version of every lesson, with examples written for that organization and team.

Do this **after** the core lessons are integrated and approved (INTEGRATION.md). Start with Step 0 below and wait for approval before building.

## What gets tailored, and what never changes

Each lesson has two layers. The split is enforced in code by `src/core-lessons/tailoring.ts`.

| Layer | Fields | Tailored? |
| --- | --- | --- |
| **Teaching layer** | Title, big idea, the model's names, explanations and stages, why it works, spotlight research, sources, "Make it yours" questions, go-deeper links | **Never.** Same for every program. |
| **Example layer** | "Why this matters now"; model examples (flip-card examples, equation "sounds like" lines, sort items, stage examples, quadrant "sounds like" lines); the marble jar activity items; the whole "See it in action" section; traps; check question stories, options and explanations; field card wording; the practice tie-in text | **Yes.** Rewritten for each program's setting. |

Structure never changes. Ids, the number of items, the order of options, which option is correct, and which bucket each sort item belongs to always come from the base lesson. `applyTailored()` takes those from the base lesson even if the model returns something different, so a bad generation can never change a correct answer.

## What's in `tailoring.ts`

| Export | What it does |
| --- | --- |
| `ProgramContext` | The organization and team details the tailoring needs. Map these from the existing intake form fields. |
| `extractTailorable(lesson)` | Returns the lesson's example layer in the exact shape a tailored version must have. |
| `TAILORING_SYSTEM_PROMPT` | The system prompt for each tailoring call. Use as written. |
| `buildTailoringRequest(lesson, context, previousErrors?)` | Builds the user message for one lesson, including the fixed correct answers. |
| `validateTailored(lesson, tailored)` | Returns a list of problems: wrong ids, wrong counts, empty or overlong text, leftover placeholders. An empty list means it's safe to apply. |
| `applyTailored(lesson, tailored)` | Merges a validated tailored version into a copy of the base lesson, for display. |
| `CORE_LESSONS_CONTENT_VERSION` | Stored with each tailored version so it can be refreshed when lesson content changes. |

`scripts/test-tailoring.ts` checks these helpers. Keep it passing.

## Step 0: report before building

Find out and report back:
1. **The intake fields.** List which existing intake form fields map to each `ProgramContext` field. List any `ProgramContext` field with no matching intake field. Don't add intake questions without asking me.
2. **Where program content is generated** today: which code runs after an intake is submitted, and which model and API wrapper it uses.
3. **Practice personas.** Does the platform tailor the practice conversation personas (names and roles) per program? If so, where are they stored? `practicePersonas` must come from there, so lesson examples use the same names as that program's practice conversations.
4. **Storage.** Your proposed table or storage for tailored lessons, using the shape below.
5. **Your plan** for the admin review screen.

Then stop and wait for approval.

## The pipeline

**When it runs:** right after the platform finishes building a program from an intake form, plus on demand from the admin screen.

**For each of the seven lessons:**
1. Build `ProgramContext` from the program's intake answers, plus its practice personas if they're tailored.
2. Call the Claude API server-side, with `TAILORING_SYSTEM_PROMPT` as the system prompt and `buildTailoringRequest(lesson, context)` as the user message.
   - Use the model the platform already uses for program generation, or the configured feedback model.
   - Allow enough output tokens for a full lesson's example layer (about 6,000).
   - The seven calls can run in parallel.
3. Parse the JSON reply and run `validateTailored()`.
   - **If there are problems,** retry once, passing the problems as `previousErrors`.
   - **If it still fails,** store the base lesson's example layer with status `fallback` and log the errors. Never show leaders a half-tailored lesson.
4. Store the result (see Storage).

When a leader opens a lesson, load the stored tailored version for their program, call `applyTailored(baseLesson, stored)`, and render the result with the existing lesson components. **No AI call happens when a leader views a lesson.**

## Storage

A table such as `program_core_lessons` with:
- `program_id`
- `lesson_id`
- `content_version`
- `status`: `generated`, `approved`, `edited` or `fallback`
- `tailored` (the JSON)
- `errors` (if any)
- `generated_at`
- `approved_at`

Row-level security:
- Leaders in a program can read that program's rows.
- Only the server and admins can write.

## Admin review screen

Add this to the existing admin area:
- **List** each program's seven lessons with their status.
- **Compare** a lesson side by side: base example layer on one side, tailored version on the other.
- **Regenerate** one lesson, with an optional note to steer it (for example, "make the examples about the night shift"). The note is added to the user message.
- **Edit** the tailored text directly in a simple form, which sets status to `edited`. Run `validateTailored()` before saving.
- **Approve.** A setting `REQUIRE_LESSON_APPROVAL`, default `false`, controls whether leaders see tailored lessons right away or only after approval. While a lesson is unapproved and approval is required, leaders see the base lesson.
- **Use default content.** A per-program switch that skips tailoring and shows the base lessons. Use it for programs that are already a close match, like my own healthcare pilot.

## Rules that protect leaders' work

- **Lock started lessons.** Once any leader in a program has answered a check question or written an answer in a lesson, regenerating that lesson must not silently change what they saw. Either block regeneration with a clear message, or keep the previous version for leaders who already started it. Tell me which approach you chose.
- **Answers stay keyed by stable ids,** so tailoring never breaks saved progress.
- **The AI practice conversations, their prompts and their scoring are not part of this change.** Only read persona names from them.

## Privacy and safety

- Send only the `ProgramContext` fields to the API. Never send leaders' names, emails or answers.
- The prompt already tells the model to use fictional first names and never name real people or the organization. If the intake form contains names of real employees, leave them out of `ProgramContext`.
- Keep the Anthropic API key server-side, as with the practice partner.
- Log token usage per tailoring call in the existing usage log.

## Acceptance checks

- [ ] `scripts/validate.ts` and `scripts/test-tailoring.ts` pass. The project typechecks and builds.
- [ ] A new test intake for a clearly different setting, such as "front desk team lead at a veterinary clinic chain, in person," produces seven tailored lessons with status `generated`:
  - The examples use that setting.
  - The correct answers in the check questions and sort activities are unchanged.
- [ ] A forced validation failure (for example, temporarily truncating the reply) results in `fallback`, and the leader sees the base lesson with no errors.
- [ ] Viewing a lesson makes no AI call.
- [ ] Regenerating a lesson that a leader already started follows the lock rule.
- [ ] With "Use default content" on, a program shows the base lessons.
- [ ] Practice conversations, scenarios and scoring behave exactly as before.

Then send me:
- The preview link.
- The test intake's tailored Module 4 lesson, side by side with the base.
- Any judgment calls you made.
