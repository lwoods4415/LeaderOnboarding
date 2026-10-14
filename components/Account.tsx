"use client";
// Loads the signed-in leader's profile, starts saving their progress, and shares the profile with pages.
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useState } from "react";
import { forgetDevice } from "@/lib/store";
import { flushNow, startSync, stopSync, useSaveStatus } from "@/lib/sync";
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
