import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import { PROGRAM } from "@/content";
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
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable}`}>
      <body>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
