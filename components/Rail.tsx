"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MODULES, ROLEPLAYS } from "@/content";
import { modProgress, overall } from "@/lib/progress";
import { useLeader } from "@/lib/store";
import { Ring } from "./ui";

function Item({ href, t, w, pct, current }: { href: string; t: string; w?: string; pct?: number; current: boolean }) {
  return (
    <Link href={href} scroll={false} aria-current={current ? "true" : undefined}>
      <span className="rt">{t}</span>
      {w ? <span className="rw">{w}</span> : null}
      {pct != null ? <Ring pct={pct} /> : null}
    </Link>
  );
}

export function Rail() {
  const s = useLeader();
  const path = usePathname();
  const rpDone = ROLEPLAYS.filter((r) => s.rp[r.id]?.fb).length;
  const at = (href: string) => path === href;

  // Like the reference page, bring the top of the section into view after moving between sections.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    document.getElementById("ladder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [path]);

  return (
    <aside className="rail" aria-label="Sections">
      <div className="grp">Start here</div>
      <Item href="/" t="Program overview" w="How it works" pct={overall(s)} current={at("/")} />
      <Item href="/growth" t="My growth" w="Week 0 and Week 12" current={at("/growth")} />
      <div className="grp">Modules</div>
      {MODULES.map((m) => (
        <Item key={m.id} href={`/module/${m.id}`} t={m.short} w={m.weeks} pct={modProgress(s, m).pct} current={at(`/module/${m.id}`)} />
      ))}
      <div className="grp">Practice</div>
      <Item href="/studio" t="Practice studio" w={`${rpDone} of ${ROLEPLAYS.length} conversations`} current={at("/studio")} />
      <Item href="/lab" t="Leader lab guide" w="Cohort sessions" current={at("/lab")} />
      <div className="grp">Resources</div>
      <Item href="/pathway" t="Performance pathway" w="Stages and documentation" current={at("/pathway")} />
      <Item href="/toolkit" t="Toolkit" w="Planners and guides" current={at("/toolkit")} />
      <Item href="/sponsor" t="For your leader" w="Sponsor guide" current={at("/sponsor")} />
    </aside>
  );
}
