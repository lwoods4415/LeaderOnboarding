import type { Metadata } from "next";
import { Braving } from "@/components/Braving";
import { Planner } from "@/components/Planner";
import { BOOKS, TOOLS } from "@/content";
import { raw } from "@/lib/html";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Toolkit" };

export default function Page() {
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
