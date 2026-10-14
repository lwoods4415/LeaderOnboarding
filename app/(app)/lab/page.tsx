import type { Metadata } from "next";
import Link from "next/link";
import { MODULES } from "@/content";
import { raw } from "@/lib/html";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Leader lab guide" };

export default function Page() {
  return (
    <>
      <div className="mhead"><div className="eyebrow">Practice</div><h2>The <em>leader lab</em></h2><div className="sub">Where new leaders practice together</div></div>
      <div className="pair">
        <div className="panel peach"><span className="tag">Why a lab</span><p>Research on leadership training finds that practice with feedback, led by a facilitator over several sessions, works far better than reading alone. The lab is where new leaders say the hard sentences out loud, hear how they land, and learn from each other&apos;s real situations.</p></div>
        <div className="panel sky"><span className="tag">The format</span><p>Seven 60-minute sessions, one every two weeks, matched to the modules. Three to nine new leaders per cohort. Run by a senior leader who facilitates every session. Works on video with breakout rooms.</p></div>
      </div>
      <section className="blk"><h3>The seven sessions</h3>
        <div className="checks">
          {MODULES.map((m) => (
            <Link key={m.id} href={`/module/${m.id}`} scroll={false} className="check linkrow">
              <span className="min">{m.weeks}</span>
              <span {...raw(`<b>${m.lab.focus}</b><small>Practice: ${m.lab.triad}</small>`)} />
            </Link>
          ))}
        </div>
      </section>
      <section className="blk"><h3>Every session follows the same agenda</h3>
        <ol className="agenda">
          <li><span className="min">10 min</span><div><b>Check-in round</b><p>Each leader answers the session&apos;s check-in question in a sentence or two. The facilitator goes first.</p></div></li>
          <li><span className="min">15 min</span><div><b>Challenge clinic</b><p>One or two leaders bring a real situation. Others may only ask questions for the first five minutes, then offer ideas. The leader decides what to try.</p></div></li>
          <li><span className="min">25 min</span><div><b>Practice in threes</b><p>Three rounds of about eight minutes. In each round: five minutes of conversation, three minutes of observer feedback. Rotate so everyone plays leader once.</p></div></li>
          <li><span className="min">10 min</span><div><b>Commitments</b><p>Each leader says one thing they&apos;ll do before the next lab. The facilitator writes them down and opens the next lab by asking how it went.</p></div></li>
        </ol>
      </section>
      <section className="blk"><h3>Roles in practice</h3>
        <div className="learn">
          <div className="card"><h4>Leader</h4><p>Holds the conversation as they really would. No pausing to explain. If they get stuck, they can call a 30-second timeout.</p></div>
          <div className="card"><h4>Team member</h4><p>Plays the person realistically, using the module&apos;s description. Not a pushover, not a villain. Opens up when the leader earns it.</p></div>
          <div className="card"><h4>Observer</h4><p>Scores each item on the module&apos;s observer list from 1 to 3, and writes down one exact quote that worked and one that didn&apos;t.</p></div>
          <div className="card"><h4>Feedback order</h4><p>The leader goes first: what worked, what they&apos;d change. Then the team member: how it felt. Then the observer: scores and quotes.</p></div>
        </div>
      </section>
      <section className="blk"><h3>Ground rules</h3>
        <ul className="qlist">
          <li><b>The vault.</b> What&apos;s shared in the lab stays in the lab. No names of team members in the challenge clinic.</li>
          <li><b>Practice, not performance.</b> Clumsy is expected. That&apos;s why we practice here first.</li>
          <li><b>Ask before advising.</b> In the clinic, questions come first.</li>
          <li><b>Everyone plays leader.</b> No one only observes.</li>
        </ul>
      </section>
      <section className="blk"><div className="checkin"><h3>Facilitator tips</h3>
        <ul>
          <li>Share one of your own mistakes in the first session. It sets the tone faster than any ground rule.</li>
          <li>Keep time strictly. The practice block is the most valuable part and the first to get squeezed.</li>
          <li>Notice who avoids playing leader in hard scenarios, and gently make sure they go.</li>
          <li>Use the Practice studio scores and commitments to follow up in 1:1s.</li>
          <li>At the final session, hold the graduation shares: what changed for each leader since Week 0.</li>
        </ul>
      </div></section>
    </>
  );
}
