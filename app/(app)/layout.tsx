import { AccountProvider, AccountStatus } from "@/components/Account";
import { Header } from "@/components/Header";
import { Rail } from "@/components/Rail";
import { PASSAGES, PROGRAM } from "@/content";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header right={<AccountStatus />} />
      <nav className="ladder" id="ladder" aria-label="Where this protocol sits">
        {PASSAGES.map((p, i) => (
          <span key={p} className={i === PROGRAM.passage ? "on" : ""}>{i === PROGRAM.passage ? "This protocol: " : ""}{p}</span>
        ))}
      </nav>
      <AccountProvider>
        <div className="layout">
          <Rail />
          <main className="content">{children}</main>
        </div>
      </AccountProvider>
    </>
  );
}
