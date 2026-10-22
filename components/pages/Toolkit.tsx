"use client";
// The Toolkit page, from the leader's own program.
import { Braving } from "@/components/Braving";
import { Planner } from "@/components/Planner";
import { useProgram } from "@/lib/program";
import { raw } from "@/lib/html";
import { toolkitOpen } from "@/lib/plans";
import { useProfile } from "../Account";
import { LockedCard } from "../LockedCard";



export function Toolkit() {
  const { books: BOOKS, tools: TOOLS } = useProgram();
  const profile = useProfile();
  if (profile && !toolkitOpen(profile.plan)) {
    return (
      <>
        <div className="mhead"><div className="eyebrow">Resources</div><h2>The <em>toolkit</em></h2><div className="sub">Planners, guides and templates for real conversations.</div></div>
        <LockedCard what="The toolkit is part of the full program." />
      </>
    );
  }
  return (
    <>
      <div className="mhead"><div className="eyebrow">Resources</div><h2>The <em>toolkit</em></h2><div className="sub">Use these alongside the modules, and keep using them after.</div></div>
      {TOOLS.map((t, i) =>
        t.type === "planner" ? <Planner key={i} t={t} />
        : t.type === "braving" ? <Braving key={i} t={t} />
        : (
          <div className="tool" key={i}><h3 {...raw(t.title)} /><p className="lede" {...raw(t.lede)} />
            <ol className="qlist">{t.items.map((x, k) => <li key={k} {...raw(x)} />)}</ol>
          </div>
        ),
      )}
      <div className="tool"><h3>Further reading</h3>
        <div className="books">{BOOKS.map((b) => <div key={b[0]}><b {...raw(b[0])} /><span {...raw(b[1])} /></div>)}</div>
      </div>
    </>
  );
}
