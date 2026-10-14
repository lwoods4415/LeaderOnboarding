import type { Metadata } from "next";
import { CheckRow } from "@/components/ui";
import { SPONSOR as s } from "@/content";
import { raw } from "@/lib/html";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "For your leader" };

export default function Page() {
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
