import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import { Rail } from "@/components/Rail";
import { raw } from "@/lib/html";
import { PASSAGES, PROGRAM } from "@/content";
import { PROGRAM_NAME } from "@/program.config";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["500", "700", "800"] });
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: PROGRAM_NAME, template: `%s · ${PROGRAM_NAME}` },
  description: PROGRAM.header.p,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const h = PROGRAM.header;
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable}`}>
      <body>
        <div className="wrap">
          <header className="top">
            <div className="brand">
              <div className="eyebrow" {...raw(h.eyebrow)} />
              <h1 {...raw(`${h.h1a} <span>${h.h1b}</span>`)} />
              <p {...raw(h.p)} />
            </div>
            <div className="status" role="status"><i></i><span>Progress saves on this device only</span></div>
          </header>
          <nav className="ladder" id="ladder" aria-label="Where this protocol sits">
            {PASSAGES.map((p, i) => (
              <span key={p} className={i === PROGRAM.passage ? "on" : ""}>{i === PROGRAM.passage ? "This protocol: " : ""}{p}</span>
            ))}
          </nav>
          <div className="layout">
            <Rail />
            <main className="content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
