"use client";
// The For your leader page, from the leader's own program.
import { CheckRow } from "@/components/ui";
import { useProgram } from "@/lib/program";
import { raw } from "@/lib/html";



export function SponsorGuide() {
  const s = useProgram().sponsor;
  return (
    <>
      <div className="mhead"><div className="eyebrow" {...raw(s.eyebrow)} /><h2 {...raw(s.title)} /><div className="sub" {...raw(s.sub)} /></div>
      <div className="pair">
        <div className="panel peach"><span className="tag">Why this matters</span><p {...raw(s.why)} /></div>
        <div className="panel sky"><span className="tag">Your commitment</span><p {...raw(s.commit)} /></div>
      </div>
      <section className="blk"><h3>What to do when</h3><div className="checks">{s.steps.map((x) => <CheckRow key={x.id} id={x.id} t={x.t} s={x.s} />)}</div></section>
      <section className="blk"><h3>What to watch for</h3>
        <div className="learn">{s.watch.map((w) => <div className="card" key={w[0]}><h4 {...raw(w[0])} /><p {...raw(w[1])} /></div>)}</div>
      </section>
    </>
  );
}
