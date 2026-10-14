import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Callback } from "./Callback";

export const metadata: Metadata = { title: "Signing in" };

export default function Page() {
  return (
    <>
      <Header />
      <Callback />
    </>
  );
}
