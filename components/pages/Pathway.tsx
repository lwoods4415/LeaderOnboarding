"use client";
// The Performance pathway page, from the leader's own program.
import { Planner } from "@/components/Planner";
import { useProgram } from "@/lib/program";
import { raw } from "@/lib/html";



export function Pathway() {
  const { docTool: DOC_TOOL, escalate: ESCALATE, pathway: PATHWAY } = useProgram();
  return (
    <>
      <div className="mhead"><div className="eyebrow">Resources</div><h2>The <em>performance pathway</em></h2><div className="sub">From a first conversation to a clear outcome, fairly and without surprises</div></div>
      <div className="pair">
        <div className="panel peach"><span className="tag">The purpose</span><p>A performance conversation exists to help someone succeed, not to build a paper trail. Most concerns should be solved at the early check-in. The stages make sure every person on every team gets the same fair, prompt, transparent process.</p></div>
        <div className="panel sky"><span className="tag">Four principles</span><ul className="plain"><li><b>Prompt:</b> address a concern within days, not months.</li><li><b>Factual:</b> metrics, dates and observations, never labels.</li><li><b>Consistent:</b> the same standard for friends and everyone else.</li><li><b>No surprises:</b> nothing in a written plan should be news.</li></ul></div>
      </div>
      <section className="blk"><h3>The stages</h3>
        <div className="stages">
          {PATHWAY.map((s) => (
            <div className="stage" key={s.n}>
              <div className="st-n" {...raw(s.n)} />
              <div className="st-body">
                <h4 {...raw(s.t)} />
                <p className="note" {...raw(`<b>When:</b> ${s.when}`)} />
                <p {...raw(`<b>Goal:</b> ${s.goal}`)} />
                <ul>{s.do.map((x, k) => <li key={k} {...raw(x)} />)}</ul>
                <div className="st-meta"><span {...raw(`<b>Document:</b> ${s.doc}`)} /><span {...raw(`<b>Who:</b> ${s.who}`)} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="blk"><div className="escalate"><span className="tag">Bring in your director right away</span>
        <ul>{ESCALATE.map((x, k) => <li key={k} {...raw(x)} />)}</ul></div></section>
      <section className="blk"><Planner t={DOC_TOOL} /></section>
      <p className="note">This pathway describes good leadership practice. It isn&apos;t legal advice. Follow your organization&apos;s policies, and involve your director in any decision about a written plan or someone&apos;s employment.</p>
    </>
  );
}
