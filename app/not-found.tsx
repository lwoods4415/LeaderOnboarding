import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="mhead"><h2>Page not <em>found</em></h2><div className="sub">That page doesn&apos;t exist.</div></div>
      <div className="pager"><Link className="btn primary" href="/">← Program overview</Link></div>
    </>
  );
}
