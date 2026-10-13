"use client";
import { Fragment } from "react";
import type { Module } from "@/content";
import { raw } from "@/lib/html";
import { update, useLeader } from "@/lib/store";
import { RATING } from "../ui";

export function Scenario({ m }: { m: Module }) {
  const scn = m.scenario;
  const pk = useLeader().picks[m.id] ?? {};

  const setSay = (v: string) => update((d) => { (d.picks[m.id] ??= {}).say = v; });
  const reveal = () => update((d) => {
    const p = (d.picks[m.id] ??= {});
    p.open = true;
    // What they typed before seeing any options is their first answer.
    p.first ??= { say: p.say ?? "" };
  });
  const pick = (step: number, k: number) => update((d) => {
    const p = (d.picks[m.id] ??= { open: true });
    p[step === 0 ? "s0" : "s1"] = k;
    const f = (p.first ??= { say: p.say ?? "" });
    if (!f.done) {
      f[step === 0 ? "s0" : "s1"] = k;
      if (step === scn.steps.length - 1) f.done = true;
    }
  });
  const reset = () => update((d) => {
    const p = d.picks[m.id] ?? {};
    d.picks[m.id] = { say: p.say, open: true, first: p.first, retried: true };
  });

  const chosenAt = (si: number) => (si === 0 ? pk.s0 : pk.s1);

  return (
    <div className="scn" id={`scn-${m.id}`}>
      <p className="setup" {...raw(scn.setup)} />
      <div>
        <label htmlFor={`say-${m.id}`} className="say-l" {...raw(scn.ask)} />
        <textarea id={`say-${m.id}`} placeholder="Type it the way you'd actually say it." value={pk.say ?? ""} onChange={(e) => setSay(e.target.value)} />
      </div>
      {!pk.open ? (
        <div><button className="btn" onClick={reveal}>Show the options →</button></div>
      ) : (
        <>
          {scn.steps.map((st, si) => {
            if (si > 0 && chosenAt(si - 1) == null) return null;
            const chosen = chosenAt(si);
            const o = chosen != null ? st.options[chosen] : null;
            const best = st.options.find((x) => x.r === "strong");
            return (
              <Fragment key={si}>
                {st.setup ? <p className="setup step2" {...raw(st.setup)} /> : null}
                <div className="opts">
                  {st.options.map((opt, k) => {
                    const cls = chosen === k ? "picked " + RATING[opt.r][1] : chosen != null ? "dim" : "";
                    return <button key={k} className={`opt ${cls}`} disabled={chosen != null} onClick={() => pick(si, k)} {...raw(opt.t)} />;
                  })}
                </div>
                {o ? (
                  <>
                    <div className="fb" {...raw(`<span class="rate ${RATING[o.r][1]}">${RATING[o.r][0]}</span> ${o.fb}`)} />
                    {o.reply ? <div className="reply"><span className="eyebrow">What happens</span><p {...raw(o.reply)} /></div> : null}
                    {o.r !== "strong" && best ? <p className="note" {...raw(`<b>A stronger move:</b> ${best.t}`)} /> : null}
                  </>
                ) : null}
              </Fragment>
            );
          })}
          {pk.s1 != null ? (
            <>
              <div className="debrief"><span className="tag">What strong leaders do here</span><p {...raw(scn.debrief)} /></div>
              {(pk.say ?? "").trim() ? <p className="note">Compare it with what you wrote at the start. What would you change?</p> : null}
              <div><button className="btn" onClick={reset}>Try the scenario again</button></div>
            </>
          ) : null}
        </>
      )}
      {scn.note ? <p className="note" {...raw(scn.note)} /> : null}
    </div>
  );
}

