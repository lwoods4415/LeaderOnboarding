"use client";
// The five interactive core-lesson models (content/core-lessons/types.ts). Each works by tap, click and
// keyboard (no drag needed), at phone width and in both themes. Lesson text is plain text, never HTML.
import { useState } from "react";
import type { EquationModel, FlipCardsModel, MatrixModel, SortModel, StagesModel } from "@/content/core-lessons/types";
import type { CoreLessonState } from "@/lib/state";

type Explore = (id: string) => void;

export function FlipCards({ model, explored, onExplore }: { model: FlipCardsModel; explored: string[]; onExplore: Explore }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const seen = model.cards.filter((c) => explored.includes(c.id)).length;
  return (
    <>
      <p className="note">{seen} of {model.cards.length} explored</p>
      <div className="cl-flips">
        {model.cards.map((c) => {
          const open = !!flipped[c.id];
          return (
            <button key={c.id} type="button" className={`cl-flip${open ? " open" : ""}`} aria-pressed={open}
              onClick={() => { setFlipped({ ...flipped, [c.id]: !open }); if (!open) onExplore(c.id); }}>
              {open ? (
                <span className="cl-flip-back"><span className="eyebrow">What&apos;s true</span><span>{c.back}</span>
                  {c.example ? <span className="cl-example">{c.example}</span> : null}</span>
              ) : (
                <span className="cl-flip-front"><span className="eyebrow">Myth</span><span className="cl-myth">{c.front}</span><span className="cl-hint">Tap to flip</span></span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function Equation({ model, values, onChange }: { model: EquationModel; values: Record<string, number>; onChange: (id: string, v: number) => void }) {
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const val = (id: string) => values[id] ?? model.scale.default;
  const num = model.factors.filter((f) => f.role === "numerator").reduce((sum, f) => sum + val(f.id), 0);
  const den = model.factors.find((f) => f.role === "denominator");
  const score = Math.round((num / Math.max(1, den ? val(den.id) : 1)) * 10) / 10;
  const band = model.resultBands.find((b) => b.maxScore >= score) ?? model.resultBands[model.resultBands.length - 1];
  return (
    <>
      <p className="cl-formula">{model.formula}</p>
      <div className="cl-factors">
        {model.factors.map((f) => (
          <div className="cl-factor" key={f.id}>
            <label htmlFor={`f-${f.id}`}><b>{f.label}</b>{f.role === "denominator" ? <span className="note"> (divides)</span> : null}<span className="cl-q">{f.question}</span></label>
            <div className="cl-slider">
              <input type="range" id={`f-${f.id}`} min={model.scale.min} max={model.scale.max} step={1} value={val(f.id)}
                onChange={(e) => onChange(f.id, Number(e.target.value))} aria-valuetext={`${val(f.id)} of ${model.scale.max}`} />
              <output htmlFor={`f-${f.id}`}>{val(f.id)}</output>
            </div>
            <button type="button" className="linkbtn" aria-expanded={!!shown[f.id]} onClick={() => setShown({ ...shown, [f.id]: !shown[f.id] })}>
              {shown[f.id] ? "Hide" : "What this looks like"}
            </button>
            {shown[f.id] ? (
              <div className="cl-looks">
                <p><b>Low:</b> {f.lowSounds}</p>
                <p><b>High:</b> {f.highSounds}</p>
                <p><b>How to build it:</b></p>
                <ul className="plain">{f.buildIt.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="cl-result" aria-live="polite">
        <span className="cl-score">{score.toFixed(1)}</span>
        <div><b>{band.label}</b><p>{band.message}</p></div>
      </div>
      <p className="note">Your slider settings are private to you.</p>
    </>
  );
}

/** Used for the "sort" model and for the spotlight activity (the marble jar). */
export function SortActivity({ model, placed, onPlace, onReset }: {
  model: SortModel; placed: Record<string, string>; onPlace: (item: string, bucket: string) => void; onReset: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const waiting = model.items.filter((i) => !placed[i.id]);
  const done = model.items.length - waiting.length;
  const right = model.items.filter((i) => placed[i.id] === i.answer).length;
  return (
    <div className="cl-sort">
      <p className="note">{model.instructions}</p>
      {waiting.length ? (
        <div className="cl-sort-items" role="group" aria-label="Items to sort">
          {waiting.map((i) => (
            <button key={i.id} type="button" className="cl-chipcard" aria-pressed={picked === i.id} onClick={() => setPicked(picked === i.id ? null : i.id)}>{i.text}</button>
          ))}
        </div>
      ) : null}
      <div className="cl-buckets">
        {model.buckets.map((b) => (
          <div className="cl-bucket" key={b.id}>
            <button type="button" className="cl-bucket-head" disabled={!picked} onClick={() => { if (picked) { onPlace(picked, b.id); setPicked(null); } }}>
              <b>{b.label}</b><span>{b.description}</span>{picked ? <span className="cl-drop">Place here</span> : null}
            </button>
            <ul className="cl-placed">
              {model.items.filter((i) => placed[i.id] === b.id).map((i) => {
                const ok = i.answer === b.id;
                return (
                  <li key={i.id} className={ok ? "ok" : "no"}>
                    <span>{i.text}</span>
                    <span className="cl-verdict">{ok ? "✓ Right" : `✗ Not quite: this belongs in ${model.buckets.find((x) => x.id === i.answer)?.label}`}</span>
                    <span className="note">{i.explain}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="row" style={{ alignItems: "center" }}>
        <span className="note">{done} of {model.items.length} sorted{done ? `, ${right} right` : ""}.</span>
        {done ? <button type="button" className="btn ghost" onClick={() => { setPicked(null); onReset(); }}>Try again</button> : null}
      </div>
    </div>
  );
}

export function Stages({ model, onExplore }: { model: StagesModel; onExplore: Explore }) {
  const [at, setAt] = useState(0);
  const go = (i: number) => { setAt(i); onExplore(model.stages[i].id); };
  const st = model.stages[at];
  // Some lessons number their stage names already ("2. Tell a story"); only add a number when they don't.
  const numbered = model.stages.every((x) => /^\d+\./.test(x.name));
  return (
    <div className="cl-stages">
      <ol className="cl-stepper">
        {model.stages.map((x, i) => (
          <li key={x.id}>
            <button type="button" aria-current={i === at ? "step" : undefined} onClick={() => go(i)}>
              {numbered ? null : <span className="cl-num">{i + 1}</span>}<span><b>{x.name}</b><small>{x.summary}</small></span>
            </button>
          </li>
        ))}
      </ol>
      <div className="cl-stage" aria-live="polite">
        <h4>{numbered ? st.name : `${at + 1}. ${st.name}`}</h4>
        <p>{st.detail}</p>
        <p className="cl-example">{st.example}</p>
        {st.questions?.length ? <><p><b>Questions to ask</b></p><ul className="plain">{st.questions.map((q) => <li key={q}>{q}</li>)}</ul></> : null}
        {st.watchFor ? <p className="cl-watch"><b>Watch for:</b> {st.watchFor}</p> : null}
        {at === model.stages.length - 1 && model.closing ? <p className="cl-closing">{model.closing}</p> : null}
        <div className="row">
          <button type="button" className="btn ghost" disabled={at === 0} onClick={() => go(at - 1)}>← Back</button>
          <button type="button" className="btn" disabled={at === model.stages.length - 1} onClick={() => go(at + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}

const POS = { topLeft: "tl", topRight: "tr", bottomLeft: "bl", bottomRight: "br" } as const;

export function Matrix({ model, onExplore, children }: { model: MatrixModel; onExplore: Explore; children?: React.ReactNode }) {
  const [sel, setSel] = useState<string | null>(null);
  const q = model.quadrants.find((x) => x.id === sel);
  return (
    <div className="cl-matrix">
      <div className="cl-grid-wrap">
        <div className="cl-yaxis"><span>{model.axes.y.high}</span><b>{model.axes.y.label}</b><span>{model.axes.y.low}</span></div>
        <div className="cl-grid" role="group" aria-label={`${model.axes.x.label} by ${model.axes.y.label}`}>
          {(["topLeft", "topRight", "bottomLeft", "bottomRight"] as const).map((p) => {
            const x = model.quadrants.find((y) => y.position === p);
            if (!x) return <div key={p} />;
            return (
              <button key={x.id} type="button" className={`cl-quad ${POS[p]}${x.id === model.target ? " target" : ""}`} aria-pressed={sel === x.id}
                onClick={() => { setSel(x.id); onExplore(x.id); }}>
                <b>{x.name}</b>{x.id === model.target ? <span className="cl-aim">Aim here</span> : null}
              </button>
            );
          })}
        </div>
        <div className="cl-xaxis"><span>{model.axes.x.low}</span><b>{model.axes.x.label}</b><span>{model.axes.x.high}</span></div>
      </div>
      {q ? (
        <div className="cl-stage" aria-live="polite">
          <h4>{q.name}</h4>
          <p>{q.description}</p>
          <p className="cl-example">“{q.soundsLike}”</p>
          <p><b>The move:</b> {q.move}</p>
        </div>
      ) : <p className="note">Select a quadrant to see what it looks like.</p>}
      {children}
    </div>
  );
}

export const explored = (st: CoreLessonState) => st.modelExplored ?? [];
