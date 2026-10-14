import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <>
      <Header />
      <section className="blk">
        <h3>Sign in</h3>
        <p className="lede">Enter the email address your program leader invited. We&apos;ll email you a link to sign in. There&apos;s no password.</p>
        <SignInForm />
      </section>
    </>
  );
}
