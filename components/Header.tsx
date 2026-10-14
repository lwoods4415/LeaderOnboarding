import { PROGRAM } from "@/content";
import { raw } from "@/lib/html";

export function Header({ right }: { right?: React.ReactNode }) {
  const h = PROGRAM.header;
  return (
    <header className="top">
      <div className="brand">
        <div className="eyebrow" {...raw(h.eyebrow)} />
        <h1 {...raw(`${h.h1a} <span>${h.h1b}</span>`)} />
        <p {...raw(h.p)} />
      </div>
      {right}
    </header>
  );
}
