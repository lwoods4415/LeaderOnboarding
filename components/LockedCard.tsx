import Link from "next/link";

/** Shown in place of content the leader's plan doesn't include. */
export function LockedCard({ what }: { what: string }) {
  return (
    <section className="blk">
      <div className="locked-card">
        <h3>Unlock the full program</h3>
        <p>{what} Upgrade to get all 7 modules, every scenario, the toolkit and more practice with the AI partner.</p>
        <Link className="btn primary" href="/upgrade">See plans</Link>
      </div>
    </section>
  );
}
