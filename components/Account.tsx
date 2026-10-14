"use client";
// Loads the signed-in leader's profile, starts saving their progress, and shares the profile with pages.
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useState } from "react";
import { startSync, useSaveStatus } from "@/lib/sync";
import { supabaseBrowser } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: "leader" | "admin";
  active: boolean;
  cohort: string | null;
};

const AccountContext = createContext<Profile | null>(null);
export const useProfile = () => use(AccountContext);

type Phase = { kind: "loading" } | { kind: "ready"; profile: Profile } | { kind: "blocked" } | { kind: "error" };

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const router = useRouter();

  useEffect(() => {
    const db = supabaseBrowser();
    let cancelled = false;
    (async () => {
      const { data: auth } = await db.auth.getUser();
      if (!auth.user) { router.replace("/signin"); return; }
      const { data, error } = await db
        .from("profiles")
        .select("id, email, name, role, active, cohorts(name)")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setPhase({ kind: "error" }); return; }
      if (!data || !data.active) { setPhase({ kind: "blocked" }); return; }
      const cohort = (data.cohorts as { name: string } | null)?.name ?? null;
      setPhase({ kind: "ready", profile: { id: data.id, email: data.email, name: data.name, role: data.role, active: data.active, cohort } });
      void startSync(data.id);
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
  return <AccountContext value={phase.profile}>{children}</AccountContext>;
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-dash">
      <h3>{title}</h3>
      <p>{body}</p>
      <form action="/auth/signout" method="post"><button className="btn">Sign out</button></form>
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
      <form action="/auth/signout" method="post"><button className="linkbtn">Sign out</button></form>
    </div>
  );
}
