"use client";
// A module's core lesson (docs/INTEGRATION.md), shown after "What changes / The shift" and before
// "Voices on this idea". Text is rendered exactly as written, as plain text. The leader's work is saved
// with their progress: completion and check answers are visible to their program leader; written answers,
// sliders, sorting and cards explored stay private unless they share an answer.
import { useEffect, useRef, useState } from "react";
import type { CoreLesson as Lesson, GoDeeperResource, ReflectionSet } from "@/content/core-lessons/types";
import type { Roleplay } from "@/content";
import { lessonProgress } from "@/lib/progress";
import { useProgram } from "@/lib/program";
import { lessonState, type CoreLessonState } from "@/lib/state";
import { update, useLeader } from "@/lib/store";
import { useSaveStatus } from "@/lib/sync";
import { ShareBar } from "../module/ShareBar";
import { useOpenRoleplay } from "../useOpenRoleplay";
import { Equation, FlipCards, Matrix, SortActivity, Stages } from "./models";

const today = () => new Date().toISOString().slice(0, 10);

export function CoreLesson({ lesson, rp }: { lesson: Lesson; rp?: Roleplay }) {
  const s = useLeader();
  const st: CoreLessonState = s.coreLessons[lesson.id] ?? {};
  const set = (fn: (x: CoreLessonState) => void) => update((d) => fn(lessonState(d, lesson.id)));
  const explore = (id: string) => set((x) => { if (!x.modelExplored?.includes(id)) x.modelExplored = [...(x.modelExplored ?? []), id]; });
  const prog = lessonProgress(s, lesson);

  // Opening the module page counts as opening the lesson, but only once saved progress has loaded:
  // a change made before then would look newer than the saved copy on a fresh device and replace it.
  const opened = !!st.opened;
  const loaded = useSaveStatus() === "saved";
  useEffect(() => { if (loaded && !opened) update((d) => { lessonState(d, lesson.id).opened ??= today(); }); }, [loaded, opened, lesson.id]);

  const m = lesson.model;
  return (
    <section className="blk cl" aria-labelledby={`${lesson.id}-title`}>
      <div className="cl-head">
        <span className="tag">Core lesson</span>
        <h3 id={`${lesson.id}-title`}>{lesson.title}</h3>
        <span className="note">About {lesson.estimatedMinutes} minutes · {prog.done} of {prog.total} steps{prog.pct === 100 ? " · Complete ✓" : ""}</span>
        <div className="bar" aria-label="Lesson progress"><span style={{ width: `${prog.pct}%` }} /></div>
        <p className="cl-big">{lesson.bigIdea}</p>
      </div>

      <div className="cl-part"><h4>Why this matters now</h4>{lesson.whyNow.map((p) => <p key={p}>{p}</p>)}</div>

      <div className="cl-part cl-model">
        <span className="eyebrow">The model</span>
        <h4>{m.name}</h4>
        <p className="cl-one">{m.oneLine}</p>
        {m.type !== "sort" ? <p className="note">{m.instructions}</p> : null}
        {m.type === "flipcards" ? <FlipCards model={m} explored={st.modelExplored ?? []} onExplore={explore} />
          : m.type === "equation" ? <Equation model={m} values={st.sliders ?? {}} onChange={(id, v) => set((x) => { x.sliders = { ...x.sliders, [id]: v }; })} />
          : m.type === "sort" ? <SortActivity model={m} placed={st.modelSorted ?? {}} onPlace={(i, b) => set((x) => { x.modelSorted = { ...x.modelSorted, [i]: b }; })} onReset={() => set((x) => { x.modelSorted = {}; })} />
          : m.type === "stages" ? <Stages model={m} onExplore={explore} />
          : <Matrix model={m} onExplore={explore}>
              {m.selfPlacement ? <Questions set={m.selfPlacement} st={st} onText={(id, v) => set((x) => { x.answers = { ...x.answers, [id]: v }; })} /> : null}
            </Matrix>}
      </div>

      <div className="cl-part">
        <h4>Why it works</h4>
        {lesson.whyItWorks.paragraphs.map((p) => <p key={p}>{p}</p>)}
        <Sources list={lesson.whyItWorks.sources} />
      </div>

      {lesson.spotlight ? (
        <div className="cl-part cl-spotlight">
          <span className="eyebrow">Spotlight</span>
          <h4>{lesson.spotlight.title}</h4>
          <p className="cl-one">{lesson.spotlight.intro}</p>
          {lesson.spotlight.paragraphs.map((p) => <p key={p}>{p}</p>)}
          {lesson.spotlight.points?.length ? (
            <div className="cl-points">{lesson.spotlight.points.map((pt) => <div className="card" key={pt.title}><h4>{pt.title}</h4><p>{pt.text}</p></div>)}</div>
          ) : null}
          {lesson.spotlight.activity ? (
            <>
              <h4 style={{ marginTop: 14 }}>{lesson.spotlight.activity.name}</h4>
              <p>{lesson.spotlight.activity.oneLine}</p>
              <SortActivity model={lesson.spotlight.activity} placed={st.spotlightSorted ?? {}}
                onPlace={(i, b) => set((x) => { x.spotlightSorted = { ...x.spotlightSorted, [i]: b }; })} onReset={() => set((x) => { x.spotlightSorted = {}; })} />
            </>
          ) : null}
          <Sources list={lesson.spotlight.sources} />
        </div>
      ) : null}

      <SeeIt lesson={lesson} />

      <div className="cl-part"><h4>Common traps</h4>
        <ul className="cl-traps">{lesson.traps.map((t) => <li key={t.trap}><span className="cl-trap">{t.trap}</span><span className="cl-instead"><b>Instead:</b> {t.instead}</span></li>)}</ul>
      </div>

      <Check lesson={lesson} st={st} onPick={(q, i) => set((x) => { x.checkAnswers = { ...x.checkAnswers, [q]: i }; })} />

      <div className="cl-part"><h4>Make it yours</h4>
        <Questions set={lesson.makeItYours} st={st} onText={(id, v) => set((x) => { x.answers = { ...x.answers, [id]: v }; })} />
      </div>

      <div className="cl-part"><h4>Field card</h4><FieldCardBody lesson={lesson} /></div>

      <Practice lesson={lesson} rp={rp} />

      <div className="cl-part"><h4>Go deeper</h4>
        <ul className="cl-deeper">{lesson.goDeeper.map((r) => <Resource key={r.title} r={r} />)}</ul>
      </div>

      <Complete lesson={lesson} st={st} onComplete={(v) => set((x) => { if (v) x.completedAt = today(); else delete x.completedAt; })} />
    </section>
  );
}

function Sources({ list }: { list: { label: string; url?: string }[] }) {
  return (
    <ul className="cl-sources">
      {list.map((c) => <li key={c.label}>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.label}</a> : c.label}</li>)}
    </ul>
  );
}

function SeeIt({ lesson }: { lesson: Lesson }) {
  const x = lesson.seeItInAction;
  return (
    <div className="cl-part"><h4>See it in action</h4>
      <p>{x.setup}</p>
      <div className="cl-versions">
        {[x.weak, x.strong].map((v, k) => (
          <div className={`cl-version ${k ? "strong" : "weak"}`} key={v.label}>
            <span className="tag">{v.label}</span>
            {v.lines.map((l, i) => <Line key={i} speaker={l.speaker} text={l.text} note={l.note} />)}
            <p className="cl-outcome"><b>What happens:</b> {v.result}</p>
          </div>
        ))}
      </div>
      <p className="cl-takeaway">{x.takeaway}</p>
    </div>
  );
}

function Line({ speaker, text, note }: { speaker: "leader" | "teamMember"; text: string; note?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cl-line ${speaker}`}>
      <span className="cl-who">{speaker === "leader" ? "You" : "Team member"}</span>
      <span>{text}</span>
      {note ? (
        <>
          <button type="button" className="linkbtn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide note" : "Coaching note"}</button>
          {open ? <span className="cl-coach">{note}</span> : null}
        </>
      ) : null}
    </div>
  );
}

function Check({ lesson, st, onPick }: { lesson: Lesson; st: CoreLessonState; onPick: (q: string, i: number) => void }) {
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  return (
    <div className="cl-part"><h4>Check your understanding</h4>
      <ol className="cl-checks">
        {lesson.check.map((q) => {
          const chosen = st.checkAnswers?.[q.id];
          const correct = q.options.findIndex((o) => o.correct);
          return (
            <li key={q.id}>
              <p className="cl-cq">{q.question}</p>
              <div className="cl-options" role="radiogroup" aria-label={q.question}>
                {q.options.map((o, i) => (
                  <button key={i} type="button" role="radio" aria-checked={chosen === i}
                    className={chosen === i ? (o.correct ? "ok" : "no") : reveal[q.id] && o.correct ? "ok-reveal" : ""}
                    onClick={() => onPick(q.id, i)}>{o.text}</button>
                ))}
              </div>
              {chosen != null ? (
                <div className={`cl-explain ${q.options[chosen].correct ? "ok" : "no"}`} aria-live="polite">
                  <b>{q.options[chosen].correct ? "✓ Right." : "✗ Not quite."}</b> {q.options[chosen].explain}
                  {!q.options[chosen].correct ? (
                    reveal[q.id]
                      ? <p style={{ marginTop: 6 }}><b>The best answer:</b> {q.options[correct].text} {q.options[correct].explain}</p>
                      : <p><button type="button" className="linkbtn" onClick={() => setReveal({ ...reveal, [q.id]: true })}>Show the best answer</button></p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="note">You can change your answers at any time.</p>
    </div>
  );
}

/** A set of written questions, each with its own box. Private unless the leader shares an answer. */
function Questions({ set, st, onText }: { set: ReflectionSet; st: CoreLessonState; onText: (id: string, v: string) => void }) {
  return (
    <div className="cl-written">
      {set.intro ? <p>{set.intro}</p> : null}
      <ol className="ref cl-qs">
        {set.questions.map((q) => {
          const v = st.answers?.[q.id] ?? "";
          return (
            <li key={q.id}>
              <label htmlFor={q.id}>{q.prompt}</label>
              <textarea id={q.id} className="cl-grow" placeholder={q.placeholder} value={v} onChange={(e) => onText(q.id, e.target.value)} />
              <div className="sharebar"><ShareBar id={q.id} text={v} /></div>
            </li>
          );
        })}
      </ol>
      <p className="note">Private to you unless you choose to share an answer with your program leader.</p>
    </div>
  );
}

export function FieldCardBody({ lesson }: { lesson: Lesson }) {
  return (
    <div className="cl-field">
      <b>{lesson.fieldCard.title}</b>
      <ul>{lesson.fieldCard.lines.map((l) => <li key={l}>{l}</li>)}</ul>
    </div>
  );
}

function Practice({ lesson, rp }: { lesson: Lesson; rp?: Roleplay }) {
  const program = useProgram();
  const open = useOpenRoleplay();
  // Chips only for skill names the practice rubric already uses, exactly. The rubric never changes to match.
  const rubric = new Set(program.roleplays.flatMap((r) => r.skills));
  const chips = lesson.practiceTieIn.relatedSkills.filter((x) => rubric.has(x));
  return (
    <div className="cl-part"><h4>This week&apos;s practice</h4>
      <p>{lesson.practiceTieIn.text}</p>
      {chips.length ? <ul className="cl-chips">{chips.map((c) => <li key={c}>{c}</li>)}</ul> : null}
      {rp ? <p style={{ marginTop: 10 }}><button type="button" className="btn primary" onClick={() => open(rp.id)}>Practice the conversation →</button></p> : null}
    </div>
  );
}

const KIND: Record<GoDeeperResource["kind"], { label: string; path: string }> = {
  video: { label: "Video", path: "M8 5v14l11-7z" },
  article: { label: "Article", path: "M6 3h9l4 4v14H6zM9 11h7M9 15h7M9 7h4" },
  book: { label: "Book", path: "M5 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H5zM19 4h-5M19 4v14h-5" },
  tool: { label: "Tool", path: "M14 6a4 4 0 0 0 5 5l-8 8-3-3 8-8a4 4 0 0 0-2-2z" },
  podcast: { label: "Podcast", path: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4" },
};

function Resource({ r }: { r: GoDeeperResource }) {
  const k = KIND[r.kind];
  const title = r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> : <span>{r.title}</span>;
  return (
    <li>
      <svg className="cl-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={k.path} /></svg>
      <div>
        <b>{title}</b>
        <span className="note"> · {k.label} · {r.by}{r.minutes ? ` · about ${r.minutes} min` : ""}</span>
        <p>{r.why}</p>
        {r.access ? <p className="note">{r.access}</p> : null}
      </div>
    </li>
  );
}

function Complete({ lesson, st, onComplete }: { lesson: Lesson; st: CoreLessonState; onComplete: (v: boolean) => void }) {
  const ready = lesson.check.every((q) => st.checkAnswers?.[q.id] != null);
  if (st.completedAt) {
    return (
      <div className="cl-done">
        <b>✓ Lesson complete</b> <span className="note">on {st.completedAt}</span>
        <button type="button" className="linkbtn" onClick={() => onComplete(false)}>Mark as not complete</button>
      </div>
    );
  }
  return (
    <div className="cl-done">
      <button type="button" className="btn primary" disabled={!ready} onClick={() => onComplete(true)}>Mark lesson complete</button>
      {!ready ? <span className="note">Answer every question in “Check your understanding” first.</span> : null}
    </div>
  );
}

/** A "Field card" button for the module header: opens the card as an overlay, to pull up right before a real conversation. */
export function FieldCardButton({ lesson }: { lesson: Lesson }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn ghost cl-fieldbtn" onClick={() => ref.current?.showModal()}>Field card</button>
      <dialog ref={ref} className="cl-dialog" aria-label={lesson.fieldCard.title} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
        <FieldCardBody lesson={lesson} />
        <form method="dialog"><button className="btn" autoFocus>Close</button></form>
      </dialog>
    </>
  );
}
