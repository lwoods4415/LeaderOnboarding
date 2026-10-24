// The public home page (draft wording, for the platform owner's approval). Prices come from lib/plans
// so they always match checkout. No testimonials or numbers that haven't happened yet.
import Link from "next/link";
import { LAUNCH_PRICE, LAUNCH_SEATS, PLAN_FEATURES, PRICES } from "@/lib/plans";

const dollars = (cents: number) => `$${cents / 100}`;

const LOSSES = [
  { weeks: "Weeks 1–2", t: "Lose “my way”", from: "Do it the way I did it.", to: "Know each person well enough to lead them." },
  { weeks: "Weeks 3–4", t: "Lose the scoreboard", from: "My numbers prove I'm good at my job.", to: "My team's growth is the proof." },
  { weeks: "Weeks 5–6", t: "Lose the quick fix", from: "I'll handle it.", to: "What do you think we should do?" },
  { weeks: "Weeks 7–8", t: "Lose the right to guess", from: "She doesn't care.", to: "I see a missed number. I don't know why yet." },
  { weeks: "Weeks 9–10", t: "Lose your peers", from: "One of us.", to: "Fair to all of us." },
];

const STEPS = [
  ["Read and decide", "About 20 minutes of ideas from leaders and researchers, then a scenario where you type what you'd say before you see the options."],
  ["Practice the conversation", "Hold the module's key conversation with an AI partner who plays someone on your team. Get scored feedback, then try again."],
  ["Practice with others", "Every two weeks, a live 60-minute Leader Lab with other new leaders (Cohort plan and company programs)."],
  ["Do it for real", "Use the skill with your team, reflect on how it went, and bring it to your check-in with your own leader."],
];

const CONVERSATIONS = [
  "The former-peer reset", "Getting-to-know-you 1:1", "Setting clear expectations", "A coaching moment",
  "The performance conversation", "The pattern conversation with a friend", "Responding to a reported mistake",
];

const FAQ: [string, React.ReactNode][] = [
  ["Who is it for?", "Anyone leading a team for the first time, or leaders who never had real onboarding. It works in any industry. Companies get a version tailored to their own team's world."],
  ["How much time does it take?", "About 30 minutes a week for 12 weeks, at your own pace. Week 0 is meant for before (or just after) your first day as a leader."],
  ["Is it a subscription?", "No. Each plan is a one-time payment for 12 months of access. Start with the free preview; no card needed."],
  ["What if it isn't right for me?", "There's a 30-day money-back guarantee. Let us know within 30 days of buying for a full refund."],
  ["Who sees my answers and practice conversations?", <>On your own plan, only you. In a company program, your program leader sees your progress and scores; your reflections and full conversations stay private unless you choose to share them. The AI partner is powered by Claude, from Anthropic. <Link href="/privacy">How your data is used</Link></>],
  ["Can my employer pay for it?", "Many employers cover leadership training. Your Stripe receipt works for reimbursement, or your company can bring the whole program to its new leaders."],
];

export function Landing() {
  return (
    <div className="landing">
      <nav className="land-nav" aria-label="Site">
        <span className="land-brand">Grow Like a Leader</span>
        <span className="row">
          <a href="#pricing">Pricing</a>
          <Link href="/start">For companies</Link>
          <Link href="/signin">Sign in</Link>
        </span>
      </nav>

      <header className="land-hero">
        <div className="eyebrow">For first-time leaders</div>
        <h1>A promotion is a new job. <span>Onboard it like one.</span></h1>
        <p className="land-lede">A 12-week program for people leading a team for the first time. Learn what changes when you go from doing the work to leading the people who do it, and practice the hard conversations with an AI partner before you have them for real.</p>
        <div className="row land-cta">
          <Link className="btn primary" href="/start/free">Start free</Link>
          <Link className="btn" href="/start">Bring it to your company</Link>
        </div>
        <p className="note">Free preview: Week 0, the self-assessment and one practice conversation. No card needed.</p>
      </header>

      <section className="land-sec">
        <h2>You were promoted for being great at the work. <em>Now the work is people.</em></h2>
        <p className="land-lede">Most leadership onboarding covers systems, reports and workflows. This program covers the rest: how to connect with people, build trust, coach instead of rescue, and hold prompt, fair performance conversations that help people succeed.</p>
      </section>

      <section className="land-sec">
        <div className="eyebrow">The 12 weeks</div>
        <h2>Five things a promotion <em>takes away</em>, and what to learn in their place</h2>
        <div className="land-grid">
          <div className="land-card sky"><span className="eyebrow">Week 0</span><h3>Before day one</h3><p>Start the new job on purpose. The first conversations set the terms.</p></div>
          {LOSSES.map((l) => (
            <div className="land-card" key={l.t}>
              <span className="eyebrow">{l.weeks}</span><h3>{l.t}</h3>
              <p className="land-from">“{l.from}”</p><p className="land-to">“{l.to}”</p>
            </div>
          ))}
          <div className="land-card peach"><span className="eyebrow">Weeks 11–12</span><h3>What you earn</h3><p>A team that tells you the truth. Authority comes with the title. Trust comes from what you do.</p></div>
        </div>
      </section>

      <section className="land-sec">
        <div className="eyebrow">How each module works</div>
        <h2>Read it, practice it, <em>do it</em></h2>
        <ol className="land-steps">
          {STEPS.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}
        </ol>
      </section>

      <section className="land-sec land-practice">
        <div>
          <div className="eyebrow">The Practice studio</div>
          <h2>Rehearse the conversations <em>you&apos;re dreading</em></h2>
          <p className="land-lede">The AI partner plays someone on your team, with their own worries and things they won&apos;t say unless you ask well. Choose how tough they are. When you&apos;re done, get scored feedback on the skills that matter, then try again. On the Complete plan, describe a real situation and practice that too.</p>
        </div>
        <ul className="land-convs">{CONVERSATIONS.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>

      <section className="land-sec" id="pricing">
        <div className="eyebrow">Pricing</div>
        <h2>Start free. <em>Upgrade when you&apos;re ready.</em></h2>
        <div className="plans">
          <div className="plan">
            <h3>Free preview</h3><div className="price">$0</div>
            <ul className="plain"><li>Week 0: before day one</li><li>The starting self-assessment</li><li>1 practice conversation with scored feedback</li></ul>
            <Link className="btn" href="/start/free">Start free</Link>
          </div>
          <div className="plan">
            <h3>Essentials</h3><div className="price">{dollars(PRICES.essentials)}</div>
            <ul className="plain">{PLAN_FEATURES.essentials.map((f) => <li key={f}>{f}</li>)}</ul>
            <Link className="btn" href="/start/free">Start free, upgrade inside</Link>
          </div>
          <div className="plan featured">
            <h3>Complete</h3><div className="price">{dollars(LAUNCH_PRICE)}</div>
            <p className="note">Launch price for the first {LAUNCH_SEATS} leaders. Usually {dollars(PRICES.complete)}.</p>
            <ul className="plain">{PLAN_FEATURES.complete.map((f) => <li key={f}>{f}</li>)}</ul>
            <Link className="btn primary" href="/start/free">Start free, upgrade inside</Link>
          </div>
          <div className="plan">
            <h3>Cohort</h3><div className="price">{dollars(PRICES.cohort)}</div>
            <ul className="plain">{PLAN_FEATURES.cohort.map((f) => <li key={f}>{f}</li>)}</ul>
            <Link className="btn" href="/start/free">Start free, upgrade inside</Link>
          </div>
        </div>
        <p className="note" style={{ marginTop: 14 }}>One-time payment for 12 months of access. No subscription. 30-day money-back guarantee.</p>

        <div className="land-company">
          <div>
            <h3>For companies</h3>
            <p>Give every new leader the same strong start. We tailor the program to your team&apos;s world from a short questionnaire: your work, your measures, your words. Every tailored program is reviewed by a person before it goes live. You get a cohort dashboard to see each leader&apos;s progress and growth.</p>
            <p className="note" style={{ marginTop: 8 }}>$199 per leader for 3–10 leaders, $179 for 11–50, $149 for 51–250, plus a one-time setup fee. Facilitated Leader Labs available.</p>
          </div>
          <Link className="btn primary" href="/start">Tell us about your team</Link>
        </div>
      </section>

      <section className="land-sec">
        <div className="eyebrow">Questions</div>
        <h2>Good to <em>know</em></h2>
        <div className="land-faq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <footer className="land-foot">
        <span>© Grow Like a Leader</span>
        <span className="row"><Link href="/privacy">Privacy</Link><Link href="/signin">Sign in</Link></span>
      </footer>
    </div>
  );
}
