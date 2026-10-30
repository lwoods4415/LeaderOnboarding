# Integration brief: Core Lessons for Leading People

This brief is for Claude Code. It adds one new teaching section, the **core lesson**, to each of the seven Leading People modules. The change is additive: it must not alter scenarios, the AI practice conversations, scoring, feedback, or any existing content.

Read this whole brief and the content files, then complete **Step 0** and stop for approval before building.

## What's in this package

| Path | What it is |
| --- | --- |
| `src/core-lessons/types.ts` | TypeScript types for a lesson and its five interactive model types |
| `src/core-lessons/m0-…ts` to `m6-…ts` | The seven lessons, one file each. Final content: don't rewrite it. |
| `src/core-lessons/index.ts` | `CORE_LESSONS`, two lookup helpers and the `COUNT_CORE_LESSON_IN_PROGRESS` flag |
| `src/core-lessons/tailoring.ts` | Helpers for per-program tailoring. Not used until TAILORING.md. |
| `TAILORING.md` | The second brief: tailoring lessons for each program created from the intake form |
| `scripts/validate.ts` | Checks the content: unique ids, one correct answer per question, valid links, and more |
| `Core-Lessons-Review.md` | A readable copy of every lesson, for reference only |

The content files have no dependencies. Copy `src/core-lessons/` into the platform's content folder (wherever module content already lives) and keep the file names.

## Ground rules

1. **Additive only.** Do not modify these, even to "improve" them:
   - The scenario data and scenario UI.
   - The AI practice conversation routes, system prompts, personas, difficulty settings, feedback prompt, rubric or scores.
   - The existing module content.
   - Existing database tables or row-level security policies.
2. **Don't rewrite lesson text.** Render it exactly as written. The one exception is the per-program tailoring described in TAILORING.md, which only rewrites the example layer, through `tailoring.ts`. Build that after this integration is approved. For now, render the base lessons.
3. **Reuse the existing design system.** Use the platform's design tokens, fonts, light and dark themes, and components. The lesson should look like it was always part of the module.
4. **Keep the existing learn cards.** Only rename their heading from "Learn" to "Voices on this idea."
5. Work on a feature branch. Deploy a preview and wait for my review before merging.

## If you already integrated an earlier version of this package

This version changes the content shape in three ways:
- `makeItYours` is now a set of `questions`, each with its own text box, instead of a single `prompt`.
- `selfPlacement` works the same way.
- Module 1 adds an optional `spotlight` section (the marble jar), with a short sort activity.

Replace the content files and update the renderers. If any leader already saved text under the old `apply` or `placement` fields, move it into `answers` under that lesson's first question id, so nothing they wrote is lost. Report this migration in Step 0.

## Step 0: map lessons to modules, then stop

The platform builds a tailored 12-week program from the intake form, so module ids may not match the original reference page.

1. Find where modules or weekly topics are defined and how a leader's program is assembled.
2. Match each lesson to its module:
   - Use `legacyModuleId` (m0 to m6) if the platform kept those ids.
   - Otherwise use `getCoreLessonByModuleTitle()` and each lesson's `moduleMatch` keywords.
   - If a generated program has no matching module for a lesson, list it. Don't invent a placement.
3. Report back to me before writing any UI:
   - The mapping, as module → lesson.
   - Where on the module page you'll insert the lesson.
   - Where you'll store lesson progress.
   - Anything that conflicts with the ground rules.

## Where the lesson goes on a module page

Insert a **Core lesson** section after the module's "What changes / The shift" panels and before the existing learn cards (renamed "Voices on this idea"). Inside it, render these parts in order:

1. **Header:** lesson title, "About N minutes" from `estimatedMinutes`, and the `bigIdea` shown large.
2. **Why this matters now:** the `whyNow` paragraphs.
3. **The model:** the interactive renderer for `model.type` (see below).
4. **Why it works:** the `whyItWorks.paragraphs`, then the sources as small cited links.
5. **Spotlight (only if the lesson has a `spotlight`; currently Module 1's marble jar):**
   - Render the `title`, `intro` and `paragraphs`.
   - Render `points` as a small set of cards.
   - If `activity` is present, show it using the same renderer as the `sort` model type.
   - Then show the spotlight `sources`.
6. **See it in action:**
   - `setup`, then the `weak` and `strong` versions side by side on desktop and stacked on mobile.
   - Each line shows the speaker. Lines with a `note` get a tap-to-reveal coaching note.
   - Show `result` under each version, then the `takeaway`.
7. **Common traps:** each `trap` with its `instead`.
8. **Check your understanding:**
   - Three or four questions, one at a time or stacked.
   - On selection, mark the answer right or wrong and show that option's `explain`. The leader can then see the correct answer.
   - Answers can be changed.
9. **Make it yours:**
   - Show `intro` if present.
   - Show every item in `makeItYours.questions` as its own numbered question, with **its own free-text box directly underneath** using that question's `placeholder`.
   - Boxes grow as the leader types and save automatically, like the platform's existing reflections.
   - Same privacy and sharing behavior as the existing reflections, including the "share with my program leader" button. Sharing can be per question or for the whole set, whichever matches the existing reflection pattern.
10. **Field card:** a compact card with `fieldCard.title` and its lines. Leaders need to reach it quickly. Add a "Field card" button near the module header that opens it as an overlay, so a leader can pull it up right before a real conversation.
11. **This week's practice:** show `practiceTieIn.text` with a button to the module's existing practice conversation.
    - Show the `relatedSkills` as chips only if they exactly match skill names the platform's rubric already uses. Otherwise show the text alone.
    - Never change the rubric to match.
12. **Go deeper:**
    - Each resource shows its kind icon (video, article, book, tool, podcast), title, author, approximate minutes and `why`.
    - Resources with a `url` open in a new tab with `rel="noopener noreferrer"`. Show the `access` note if present.
    - Books without a url show as plain text.
13. **Mark lesson complete** button: enabled once every check question has an answer.

## The five interactive model renderers

Build one small component per `model.type`. All five must work by keyboard and touch, without drag-and-drop as the only option, at phone width and in both themes.

- **`flipcards`:** one card per item. The front shows the myth. Tap or press Enter to flip to `back`, and show `example` beneath it if present. Show a small "x of y explored" count.
- **`equation`:**
  - Show `formula` large, and one slider per factor using `scale`.
  - Each factor shows its `question`. A "What this looks like" toggle reveals `lowSounds`, `highSounds` and `buildIt`.
  - Live result: (sum of the numerator factors) ÷ (the denominator factor), rounded to one decimal.
  - The first `resultBands` entry whose `maxScore` is greater than or equal to the result supplies the label and message.
  - Slider values are private to the leader and may be saved, but they never appear on the admin dashboard.
- **`sort`:**
  - Show the two buckets with their descriptions, and the items as cards.
  - The leader taps an item, then taps a bucket (drag is optional on top).
  - After each placement, show whether it was right and the item's `explain`.
  - Offer a "Try again" reset.
- **`stages`:**
  - A horizontal stepper on desktop and a vertical one on mobile.
  - Each stage shows `summary`. Selecting it reveals `detail`, `example`, the `questions` as a list, and `watchFor` as a warning note.
  - "Next" and "Back" buttons move through the stages. Show `closing` after the last one.
- **`matrix`:**
  - A 2×2 grid with labeled axes: `x` left to right, `y` bottom to top, with `low` and `high` labels at the ends.
  - Selecting a quadrant reveals its `description`, `soundsLike` and `move`. Visually highlight the `target` quadrant.
  - If `selfPlacement` exists, show its `intro` under the grid, then each of its `questions` with its own free-text box. Use the same privacy rules as "Make it yours."

## Saving progress

Store lesson state inside the leader's existing private progress record. Add a `coreLessons` object keyed by lesson id (`cl-m0` … `cl-m6`). Each entry holds:
- `opened`
- `modelExplored` (for example, cards flipped or stages viewed)
- `checkAnswers` (question id → chosen option index)
- `answers` (question id → text) for every "Make it yours" and self-placement question. Ids such as `cl-m1-apply-2` and `cl-m5-place-1` are stable.
- `spotlightSorted` (spotlight activity item id → chosen bucket), private to the leader
- `completedAt`

Ids are stable, so never rename them.

If the platform's progress storage can't hold this without a schema change, propose a new table with owner-only row-level security in Step 0 rather than creating it.

## What the program leader can see

Follow the platform's existing privacy rules, extended like this:

| Data | Visible on the admin dashboard? |
| --- | --- |
| Lesson opened and completed, with date | Yes |
| Check answers (right or wrong per question) | Yes, the same as scenario choices |
| "Make it yours" and self-placement text | Only if the leader shares it, using the existing share mechanism |
| Equation slider values, sort attempts (including the marble jar activity), cards flipped | No |

On the dashboard:
- Add lesson completion to the leader grid in the simplest way that fits the current design.
- Add a check-question summary per lesson to "Focus for your next lab": the percentage answered correctly, per question.
- Update the leader-facing "What your program leader can see" panel so it mentions lesson completion and check answers.

## Progress percentages

If `COUNT_CORE_LESSON_IN_PROGRESS` is `true`, a completed lesson counts as one item in that module's progress. Existing pilot leaders' percentages will dip slightly when this ships, so mention that in your summary to me. If it's `false`, lessons don't affect progress.

## Acceptance checks before you hand it back

- [ ] `scripts/validate.ts` passes, and the project typechecks and builds.
- [ ] All seven lessons appear in the right modules, matching the approved Step 0 mapping.
- [ ] Every model type works by touch and keyboard, at phone width, in light and dark themes.
- [ ] Every "Make it yours" and self-placement question has its own text box. Answers, check answers and completion survive a reload and sign-in on another device.
- [ ] Module 1 shows the marble jar spotlight, including its activity.
- [ ] Row-level security: another leader can't read a leader's lesson text, and the admin sees only what the table above allows.
- [ ] **Regression test:** start a practice conversation, finish it and get feedback, with scores and feedback identical in format to before.
- [ ] **Regression test:** scenarios, reflections, the growth page and the dashboard behave as before.
- [ ] Every Go deeper link opens in a new tab, and none returns a 404 on the preview.
- [ ] No console errors on any module page.

Then send me:
- The preview link.
- A short list of what to click through.
- Any place where you had to make a judgment call.
