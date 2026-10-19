"use client";
import type { BravingTool } from "@/content";
import { useProgram } from "@/lib/program";
import { raw } from "@/lib/html";
import { update, useLeader } from "@/lib/store";

export function Braving({ t }: { t: BravingTool }) {
  const b = useLeader().braving;
  const BRAVING = useProgram().braving;
  const val = (n: string) => b[n] || 3;
  const focus = BRAVING.map((x) => ({ n: x[0], v: Number(val(x[0])) })).reduce((a, c) => (c.v < a.v ? c : a)).n;
  return (
    <div className="tool"><h3>Trust self-check</h3><p className="lede" {...raw(t.lede)} />
      <div className="brv">
        {BRAVING.map(([name, desc]) => (
          <div className="brv-row" key={name}>
            <b {...raw(`${name}<small>${desc}</small>`)} />
            <input type="range" min="1" max="5" step="1" id={`brv-${name}`} aria-label={name} value={val(name)}
              onChange={(e) => { const v = Number(e.target.value); update((d) => { d.braving[name] = v; }); }} />
            <output id={`out-${name}`}>{val(name)}</output>
          </div>
        ))}
      </div>
      <p className="out" id="brv-focus">Your focus area: <b>{focus}</b>. Pick one small action this week that builds it.</p>
    </div>
  );
}
