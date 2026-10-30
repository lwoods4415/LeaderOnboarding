import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Privacy" };

// Public page (no sign-in needed). Wording approved by the program owner, 2026-10-15.
export default function Page() {
  return (
    <>
      <Header />
      <div className="mhead"><div className="eyebrow">Privacy</div><h2>Your data in this <em>program</em></h2><div className="sub">What&apos;s collected, who can see it, and where it goes</div></div>

      <section className="blk"><h3>What&apos;s collected</h3>
        <ul className="qlist">
          <li><b>Your account:</b> your name, email address and cohort, added by your program leader when they invite you.</li>
          <li><b>Your work in the program:</b> what you type and choose in each module, your reflections, planners, checklists, self-assessment and team pulse numbers, and your Practice studio conversations, scores and feedback.</li>
          <li><b>Activity:</b> when you were last active, and a count of practice messages and feedback requests (used for daily limits and to track the program&apos;s costs).</li>
        </ul>
      </section>

      <section className="blk"><div className="visible"><span className="tag">What your program leader can see</span>
        <div className="vis-grid">
          <div><b>Shared automatically</b><ul className="plain"><li>Your name, cohort, progress through each module, and when you were last active</li><li>Your scenario answers: what you typed first, the options you chose, and any later tries</li><li>Your Practice studio scores, score history and coach feedback</li><li>Your self-assessment and team pulse numbers</li><li>In programs with core lessons: whether you&apos;ve opened and completed each one, and your answers to its check questions</li></ul></div>
          <div><b>Private unless you choose to share</b><ul className="plain"><li>Your reflections. Each has its own share button, and you can stop sharing at any time.</li><li>Your full practice conversations. Share one from the Practice studio after you get feedback, and stop sharing at any time.</li><li>Your written answers in core lessons. Each has its own share button.</li></ul>
            <b style={{ marginTop: 12 }}>Always private</b><ul className="plain"><li>Your planners, documentation builder, trust self-check, &ldquo;Do it for real&rdquo; checklist, and the practice scenarios you write. Your scores and coach feedback from practicing them are shared like any other practice.</li><li>Your core lesson sliders, sorting activities and flipped cards.</li></ul></div>
        </div>
        <p className="note">These rules are enforced by the database itself, not just by what the screens show. As the database owner, your program leader could technically access private items, but commits not to view them. When you stop sharing an item, the shared copy is deleted.</p>
      </div></section>

      <section className="blk"><h3>Where your data goes</h3>
        <ul className="qlist">
          <li><b>Supabase</b> stores your account and progress in a secure database. It also sends the sign-in emails.</li>
          <li><b>Vercel</b> hosts the website.</li>
          <li><b>Anthropic&apos;s Claude</b> creates the practice partner&apos;s replies and your feedback. Only the text of the practice conversation is sent. Your name and email are never sent.</li>
          <li>Your browser also keeps a copy of your progress on your device, so typing never waits on the internet and nothing is lost on a bad connection. Signing out removes it from the device once everything is saved, so always sign out on a shared computer.</li>
        </ul>
      </section>

      <section className="blk"><h3>Please don&apos;t enter</h3>
        <p className="lede">Real patient names or details, or real names or identifying details of the people on your team. Use first names that aren&apos;t real, or &ldquo;a nurse on my team&rdquo;. This applies everywhere, especially the Practice studio.</p>
      </section>

      <section className="blk"><h3>Questions or deleting your data</h3>
        <p className="lede">Ask your program leader. They can remove your access at any time, and on request can permanently delete your account and everything saved in it.</p>
      </section>

      <div className="pager"><Link className="btn" href="/">← Back to the program</Link></div>
    </>
  );
}
