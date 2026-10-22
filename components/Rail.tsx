"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { isIndividual, PLAN_NAMES } from "@/lib/plans";
import { useProgram } from "@/lib/program";
import { modProgress, overall } from "@/lib/progress";
import { useLeader } from "@/lib/store";
import { useProfile } from "./Account";
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
  const profile = useProfile();
  const program = useProgram();
  const isOrgAdmin = profile?.orgRole === "org_admin";
  const rpDone = program.roleplays.filter((r) => s.rp[r.id]?.fb).length;
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
      <Item href="/" t="Program overview" w="How it works" pct={overall(s, program)} current={at("/")} />
      <Item href="/growth" t="My growth" w="Week 0 and Week 12" current={at("/growth")} />
      {isOrgAdmin ? <Item href="/dashboard" t="Cohort dashboard" w="Only visible to you" current={at("/dashboard")} /> : null}
      {isOrgAdmin ? <Item href="/admin" t="Leaders and cohorts" w="Invites and access" current={at("/admin")} /> : null}
      {profile?.isSuperAdmin ? <Item href="/platform" t="Platform" w="All organizations" current={at("/platform")} /> : null}
      {profile && isIndividual(profile.plan) ? <Item href="/upgrade" t="Your plan" w={profile.plan === "free" ? "Free preview · Upgrade" : PLAN_NAMES[profile.plan]} current={at("/upgrade")} /> : null}
      <div className="grp">Modules</div>
      {program.modules.map((m) => (
        <Item key={m.id} href={`/module/${m.id}`} t={m.short} w={m.locked ? `${m.weeks} · Locked` : m.weeks} pct={m.locked ? undefined : modProgress(s, m, program).pct} current={at(`/module/${m.id}`)} />
      ))}
      <div className="grp">Practice</div>
      <Item href="/studio" t="Practice studio" w={`${rpDone} of ${program.roleplays.length} conversations`} current={at("/studio")} />
      <Item href="/lab" t="Leader lab guide" w="Cohort sessions" current={at("/lab")} />
      <div className="grp">Resources</div>
      <Item href="/pathway" t="Performance pathway" w="Stages and documentation" current={at("/pathway")} />
      <Item href="/toolkit" t="Toolkit" w="Planners and guides" current={at("/toolkit")} />
      <Item href="/sponsor" t="For your leader" w="Sponsor guide" current={at("/sponsor")} />
    </aside>
  );
}
