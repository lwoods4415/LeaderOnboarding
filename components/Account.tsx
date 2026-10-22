"use client";
// Loads the signed-in person: their profile, organization and role, their enrollment (program + plan),
// and their organization's copy of the program. Then starts saving their progress.
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useState } from "react";
import type { ProgramContent } from "@/content/program";
import { makeProgram, ProgramProvider, type Program } from "@/lib/program";
import { forgetDevice } from "@/lib/store";
import { flushNow, startSync, stopSync, useSaveStatus } from "@/lib/sync";
import type { Plan } from "@/lib/plans";
import { supabaseBrowser } from "@/lib/supabase/client";

export type { Plan } from "@/lib/plans";

export type Profile = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  isSuperAdmin: boolean;
  orgId: string;
  orgName: string;
  /** Their role in this organization. Org admins get the dashboard and the Leaders and cohorts page. */
  orgRole: "org_admin" | "leader";
  enrollmentId: string;
  orgProgramId: string;
  /** The plan that applies now (paid individual access falls back to the free preview after 12 months). */
  plan: Plan;
  expiresAt: string | null;
  cohort: string | null;
};

const AccountContext = createContext<Profile | null>(null);
export const useProfile = () => use(AccountContext);

type Phase =
  | { kind: "loading" }
  | { kind: "ready"; profile: Profile; program: Program }
  | { kind: "blocked" }
  | { kind: "no-program"; isSuperAdmin: boolean }
  | { kind: "error" };

type Membership = { org_id: string; role: "org_admin" | "leader"; active: boolean; organizations: { name: string; status: string } | null };
type Enrollment = { id: string; org_id: string; org_program_id: string; plan: Plan; expires_at: string | null; status: string; cohorts: { name: string } | null };

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const router = useRouter();

  useEffect(() => {
    const db = supabaseBrowser();
    let cancelled = false;
    (async () => {
      const { data: auth } = await db.auth.getUser();
      if (!auth.user) { router.replace("/signin"); return; }
      const me = auth.user.id;
      const [profile, memberships, enrollments] = await Promise.all([
        db.from("profiles").select("id, email, name, active, is_super_admin").eq("id", me).maybeSingle(),
        db.from("memberships").select("org_id, role, active, organizations(name, status)").eq("user_id", me),
        db.from("enrollments").select("id, org_id, org_program_id, plan, expires_at, status, cohorts(name)").eq("user_id", me).eq("status", "active"),
      ]);
      if (cancelled) return;
      if (profile.error || memberships.error || enrollments.error) { setPhase({ kind: "error" }); return; }
      const p = profile.data;
      if (!p || !p.active) { setPhase({ kind: "blocked" }); return; }

      // The first active enrollment in an organization they're an active member of.
      const activeOrgs = new Map((memberships.data as Membership[]).filter((m) => m.active && m.organizations?.status === "active").map((m) => [m.org_id, m]));
      const enrollment = (enrollments.data as Enrollment[]).find((e) => activeOrgs.has(e.org_id));
      if (!enrollment) { setPhase(activeOrgs.size || !p.is_super_admin ? { kind: "blocked" } : { kind: "no-program", isSuperAdmin: true }); return; }
      const membership = activeOrgs.get(enrollment.org_id)!;

      // The program text comes from the server, trimmed to what their plan includes.
      const res = await fetch(`/api/program?enrollment=${enrollment.id}`, { cache: "no-store" }).catch(() => null);
      const body = res?.ok ? ((await res.json()) as { plan: Plan; content: ProgramContent }) : null;
      if (cancelled) return;
      if (!body) { setPhase({ kind: "error" }); return; }
      const content = body.content;

      setPhase({
        kind: "ready",
        program: makeProgram(content),
        profile: {
          id: p.id, email: p.email, name: p.name, active: p.active, isSuperAdmin: p.is_super_admin,
          orgId: enrollment.org_id, orgName: membership.organizations?.name ?? "", orgRole: membership.role,
          enrollmentId: enrollment.id, orgProgramId: enrollment.org_program_id, plan: body.plan, expiresAt: enrollment.expires_at, cohort: enrollment.cohorts?.name ?? null,
        },
      });
      void startSync(p.id, enrollment.id, content);
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (phase.kind === "loading") return <p className="note">Loading your progress…</p>;
  if (phase.kind === "error") {
    return <Notice title="We couldn't load your account" body="Check your connection and refresh the page. If it keeps happening, contact your program leader." />;
  }
  if (phase.kind === "blocked") {
    return <Notice title="Your access isn't active" body="This account doesn't have access to the program right now. If you think that's a mistake, contact your program leader." />;
  }
  if (phase.kind === "no-program") {
    return <Notice title="You're not enrolled in a program" body="This account manages the platform but isn't enrolled in a program itself." />;
  }
  return (
    <AccountContext value={phase.profile}>
      <ProgramProvider program={phase.program}>{children}</ProgramProvider>
    </AccountContext>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-dash">
      <h3>{title}</h3>
      <p>{body}</p>
      <SignOut className="btn" />
    </div>
  );
}

/** Header status: where progress is saving, plus sign out. */
export function AccountStatus() {
  const s = useSaveStatus();
  const text = { loading: "Loading your progress…", saved: "Progress saves to your account", saving: "Saving…", offline: "Saved on this device. Will sync when you're back online" }[s];
  return (
    <div className="acct">
      <div className={`status${s === "saved" || s === "saving" ? " ok" : ""}`} role="status"><i></i><span>{text}</span></div>
      <SignOut className="linkbtn" />
    </div>
  );
}

function SignOut({ className }: { className: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button className={className} disabled={busy} onClick={async () => {
      setBusy(true);
      const saved = await flushNow();
      if (!saved && !confirm("Some changes haven't reached your account yet, maybe because you're offline. Sign out anyway? They'll stay on this device and save the next time you sign in here.")) {
        setBusy(false);
        return;
      }
      stopSync();
      // Don't leave a copy of the leader's progress on the device once it's safely saved.
      if (saved) forgetDevice();
      await supabaseBrowser().auth.signOut();
      router.replace("/signin");
    }}>Sign out</button>
  );
}
